import { useState, useMemo, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import type { Page } from "./components/Sidebar";
import Header from "./components/Header";
import StatsCards from "./components/StatsCards";
import FilterBar from "./components/FilterBar";
import ComplaintTable from "./components/ComplaintTable";
import ComplaintDetail from "./components/ComplaintDetail";
import NewComplaint from "./components/NewComplaint";
import EmployeesPage from "./components/EmployeesPage";
import LiveFeed from "./components/LiveFeed";
import WardStatus from "./components/WardStatus";
import AuditLogPage from "./components/AuditLogPage";
import CallSimulatorModal from "./components/CallSimulatorModal";
import CitizenNavbar from "./components/CitizenNavbar";
import CitizenPortal from "./components/CitizenPortal";
import LoginModal from "./components/LoginModal";
import { fetchComplaints } from "./data/complaints";
import type { Complaint } from "./data/complaints";
import { getStoredUser, logout as authLogout } from "./data/auth";
import type { User } from "./data/auth";
import "./index.css";

import type { Filters } from "./components/FilterBar";

const defaultFilters: Filters = { ward: "", zone: "", category: "", status: "", search: "" };

export default function App() {
  const [page, setPage] = useState<Page>("overview");
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [viewMode, setViewMode] = useState<"citizen" | "officer">(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("track")) return "citizen";
    return getStoredUser() ? "officer" : "citizen";
  });
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const handleLoginSuccess = (loggedUser: User) => {
    setUser(loggedUser);
    setViewMode("officer");
    setLoginModalOpen(false);
  };

  const handleLogout = () => {
    authLogout();
    setUser(null);
    setViewMode("citizen");
  };

  const loadComplaints = useCallback(() => {
    fetchComplaints()
      .then(setComplaints)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const handleUpdate = () => {
    loadComplaints();
    setSelected(null);
  };

  const isWardStaff = user?.role === "ward_officer" || user?.role === "ward_engineer";
  const isFieldWorker = user?.role === "field_worker";
  const officerWard = user?.ward || "12";

  // Scope dashboard data based on role
  const scopedComplaints = useMemo(() => {
    if (isWardStaff) {
      return complaints.filter((c) => String(c.ward).trim() === String(officerWard).trim());
    }
    if (isFieldWorker) {
      const assigned = complaints.filter((c) => {
        if (!c.assignedTo) return false;
        if (typeof c.assignedTo === "object") {
          return c.assignedTo._id === user?.id || c.assignedTo.email === user?.email || c.assignedTo.name === user?.name;
        }
        return c.assignedTo === user?.id;
      });
      return assigned.length > 0 ? assigned : complaints.filter((c) => String(c.ward).trim() === "12");
    }
    return complaints;
  }, [complaints, isWardStaff, isFieldWorker, officerWard, user]);

  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase().trim();
    return scopedComplaints.filter((c) => {
      if (!isWardStaff && !isFieldWorker && filters.ward && c.ward !== filters.ward) return false;
      if (!isWardStaff && !isFieldWorker && filters.zone && c.zone !== filters.zone) return false;
      if (filters.category && c.category !== filters.category) return false;
      if (filters.status && c.status !== filters.status) return false;
      if (q) {
        const matchesName = c.name?.toLowerCase().includes(q);
        const matchesAddress = c.address?.toLowerCase().includes(q);
        const matchesIssue = c.issue?.toLowerCase().includes(q);
        const matchesTicket = c.ticketId?.toLowerCase().includes(q);
        const matchesPhone = c.phone?.toLowerCase().includes(q);
        if (!matchesName && !matchesAddress && !matchesIssue && !matchesTicket && !matchesPhone) {
          return false;
        }
      }
      return true;
    });
  }, [filters, scopedComplaints, isWardStaff, isFieldWorker]);

  // Public Citizen Portal View (Default when not logged in)
  if (viewMode === "citizen") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <CitizenNavbar
          currentUser={user}
          onOpenLogin={() => setLoginModalOpen(true)}
          onOpenSimulator={() => setSimulatorOpen(true)}
          onGoToDashboard={() => setViewMode("officer")}
          onLogout={handleLogout}
        />

        <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
          <CitizenPortal />
        </main>

        <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-400">
          <p>Vadodara Municipal Corporation (VMC) · Automated AI Civic Grievance Redressal System</p>
          <p className="mt-1 text-[11px] text-gray-400">Major Project Capstone · Department of Computer Science & Engineering</p>
        </footer>

        <CallSimulatorModal
          isOpen={simulatorOpen}
          onClose={() => setSimulatorOpen(false)}
          onComplaintCreated={loadComplaints}
        />

        <LoginModal
          isOpen={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

  // Officer Dashboard Page Renderer
  const renderPage = () => {
    switch (page) {
      case "new_complaint":
        return (
          <NewComplaint
            onBack={() => {
              setPage("overview");
              loadComplaints();
            }}
          />
        );

      case "employees":
        return <EmployeesPage currentUser={user} onSelectComplaint={setSelected} />;

      case "live_feed":
        return <LiveFeed />;

      case "ward_status":
        return <WardStatus onSelectComplaint={setSelected} currentUser={user} />;

      case "audit_log":
        return <AuditLogPage />;

      default: // overview
        return (
          <>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-bold text-gray-900">
                  {user?.role === "ward_engineer"
                    ? `Ward ${officerWard} Engineer Workspace`
                    : user?.role === "ward_officer"
                    ? `Ward ${officerWard} Complaints`
                    : isFieldWorker
                    ? "My Assigned Field Tasks"
                    : "Automated Call Center Complaints"}
                </h2>
                {user?.role === "ward_engineer" && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Ward {officerWard} Engineer (Resolution Authority)
                  </span>
                )}
                {user?.role === "ward_officer" && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                    Ward {officerWard} Officer Scope
                  </span>
                )}
                {isFieldWorker && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Field Worker Workspace
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {user?.role === "ward_engineer"
                  ? `Inspect field completions, verify fix photos, and approve resolutions for Ward ${officerWard}`
                  : isWardStaff
                  ? `Real-time civic grievance tracking and response for Ward ${officerWard} (${user?.zone || "West"} Zone)`
                  : isFieldWorker
                  ? "Field assignments pending your on-site repair and mobile app fix submission"
                  : "Real-time civic issue tracking across Vadodara Wards"}
              </p>
            </div>
            <StatsCards complaints={scopedComplaints} />
            <FilterBar
              filters={filters}
              onChange={setFilters}
              lockedWard={isWardStaff ? officerWard : undefined}
              lockedZone={isWardStaff ? (user?.zone || "West") : undefined}
            />
            {loading ? (
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
                Loading complaints...
              </div>
            ) : (
              <ComplaintTable complaints={filtered} onSelect={setSelected} />
            )}
          </>
        );
    }
  };

  // Internal Municipal Control Center Dashboard (Authenticated Officers)
  return (
    <div className="min-h-screen bg-surface font-sans">
      <Sidebar
        activePage={page}
        onNavigate={setPage}
        currentUser={user}
        onOpenLogin={() => setLoginModalOpen(true)}
        onLogout={handleLogout}
      />

      <div className="ml-56">
        <Header
          onOpenSimulator={() => setSimulatorOpen(true)}
          currentUser={user}
          onOpenLogin={() => setLoginModalOpen(true)}
          onLogout={handleLogout}
          onSwitchToCitizenView={() => setViewMode("citizen")}
        />
        <main className="px-8 py-6 space-y-6">
          {renderPage()}
        </main>
      </div>

      {selected && (
        <ComplaintDetail
          complaint={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
          currentUser={user}
        />
      )}

      <CallSimulatorModal
        isOpen={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
        onComplaintCreated={loadComplaints}
      />

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

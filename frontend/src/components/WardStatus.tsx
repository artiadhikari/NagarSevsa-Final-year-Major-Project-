import { useState, useEffect, useMemo } from "react";
import { fetchComplaints, categoryLabel } from "../data/complaints";
import type { Complaint, Category } from "../data/complaints";
import { fetchEmployees } from "../data/employees";
import type { Employee } from "../data/employees";
import type { User } from "../data/auth";

interface WardStats {
  ward: string;
  zone: string;
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  criticalCount: number;
  highCount: number;
  categories: Record<Category, number>;
  complaints: Complaint[];
}

interface Props {
  onSelectComplaint?: (complaint: Complaint) => void;
  currentUser?: User | null;
}

// Vadodara Ward to Zone mapping fallback
const WARD_ZONE_MAP: Record<string, string> = {
  "1": "West",
  "2": "West",
  "3": "West",
  "7": "West",
  "12": "West",
  "5": "East",
  "6": "East",
  "14": "East",
  "15": "East",
  "16": "East",
  "4": "North",
  "8": "North",
  "9": "North",
  "13": "North",
  "19": "North",
  "10": "South",
  "11": "South",
  "17": "South",
  "18": "South",
  "20": "South",
};

export default function WardStatus({ onSelectComplaint, currentUser }: Props) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"load" | "critical" | "pending" | "ward">("load");

  const isWardOfficer = currentUser?.role === "ward_officer";
  const officerWard = currentUser?.ward || "12";

  // Modal drilldown state for viewing & filtering issues in a selected ward
  const [selectedWardModal, setSelectedWardModal] = useState<WardStats | null>(null);
  const [modalSearch, setModalSearch] = useState("");
  const [modalCategory, setModalCategory] = useState("all");
  const [modalStatus, setModalStatus] = useState("all");
  const [modalPriority, setModalPriority] = useState("all");

  useEffect(() => {
    Promise.all([fetchComplaints(), fetchEmployees()])
      .then(([compData, empData]) => {
        setComplaints(compData);
        setEmployees(empData);
      })
      .finally(() => setLoading(false));
  }, []);

  // Compute ward aggregations
  const wardList = useMemo(() => {
    const map: Record<string, WardStats> = {};

    complaints.forEach((c) => {
      const w = String(c.ward || "Unassigned").trim();
      if (!map[w]) {
        map[w] = {
          ward: w,
          zone: c.zone || WARD_ZONE_MAP[w] || "Central",
          total: 0,
          pending: 0,
          inProgress: 0,
          resolved: 0,
          criticalCount: 0,
          highCount: 0,
          categories: {
            street_light: 0,
            water_supply: 0,
            garbage: 0,
            drainage: 0,
            road: 0,
            other: 0,
          },
          complaints: [],
        };
      }

      map[w].total++;
      map[w].complaints.push(c);

      const s = c.status || "pending";
      if (s === "pending") map[w].pending++;
      else if (s === "in_progress" || s === "assigned") map[w].inProgress++;
      else if (s === "resolved") map[w].resolved++;

      if (c.priority === "P1_critical") map[w].criticalCount++;
      if (c.priority === "P2_high") map[w].highCount++;

      if (c.category && map[w].categories[c.category] !== undefined) {
        map[w].categories[c.category]++;
      }
    });

    let list = Object.values(map);

    // If logged in as Ward Officer, strictly scope to his own ward
    if (isWardOfficer) {
      list = list.filter((item) => String(item.ward).trim() === String(officerWard).trim());
    } else if (selectedZone !== "all") {
      list = list.filter((item) => item.zone.toLowerCase() === selectedZone.toLowerCase());
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "critical") {
        if (b.criticalCount !== a.criticalCount) return b.criticalCount - a.criticalCount;
        return b.total - a.total;
      }
      if (sortBy === "pending") {
        return b.pending - a.pending;
      }
      if (sortBy === "ward") {
        const numA = parseInt(a.ward, 10) || 999;
        const numB = parseInt(b.ward, 10) || 999;
        return numA - numB;
      }
      return b.total - a.total;
    });

    return list;
  }, [complaints, selectedZone, sortBy, isWardOfficer, officerWard]);

  // Overall KPIs
  const totalCases = wardList.reduce((acc, w) => acc + w.total, 0);
  const totalPending = wardList.reduce((acc, w) => acc + w.pending, 0);
  const totalActive = wardList.reduce((acc, w) => acc + w.inProgress, 0);
  const totalResolved = wardList.reduce((acc, w) => acc + w.resolved, 0);
  const criticalTotal = wardList.reduce((acc, w) => acc + w.criticalCount, 0);
  const topWard = wardList.length > 0 ? wardList[0] : null;

  // Filtered complaints within the active modal
  const filteredModalComplaints = useMemo(() => {
    if (!selectedWardModal) return [];
    return selectedWardModal.complaints.filter((c) => {
      // Search query
      if (modalSearch.trim()) {
        const q = modalSearch.toLowerCase();
        const matchesAddress = c.address?.toLowerCase().includes(q);
        const matchesIssue = c.issue?.toLowerCase().includes(q);
        const matchesName = c.name?.toLowerCase().includes(q);
        const matchesPhone = c.phone?.toLowerCase().includes(q);
        const matchesTicket = c.ticketId?.toLowerCase().includes(q);
        if (!matchesAddress && !matchesIssue && !matchesName && !matchesPhone && !matchesTicket) {
          return false;
        }
      }
      // Category filter
      if (modalCategory !== "all" && c.category !== modalCategory) {
        return false;
      }
      // Status filter
      if (modalStatus !== "all") {
        if (modalStatus === "in_progress") {
          if (c.status !== "in_progress" && c.status !== "assigned") return false;
        } else if (c.status !== modalStatus) {
          return false;
        }
      }
      // Priority filter
      if (modalPriority !== "all" && c.priority !== modalPriority) {
        return false;
      }
      return true;
    });
  }, [selectedWardModal, modalSearch, modalCategory, modalStatus, modalPriority]);

  const resetModalFilters = () => {
    setModalSearch("");
    setModalCategory("all");
    setModalStatus("all");
    setModalPriority("all");
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-gray-900">
              {isWardOfficer ? `Ward ${officerWard} Operational Status` : "Ward Operational Status"}
            </h2>
            {isWardOfficer && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                Ward {officerWard} Officer Scope
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {isWardOfficer
              ? `Grievance operations, critical hazard tracking, and field crew for Ward ${officerWard} (${wardList[0]?.zone || currentUser?.zone || "West"} Zone)`
              : "Click any ward card to inspect, filter, and review all assigned grievances"}
          </p>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            {isWardOfficer ? "Assigned Ward" : "Monitored Wards"}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {isWardOfficer ? `Ward ${officerWard}` : wardList.length}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {isWardOfficer
              ? `${wardList[0]?.zone || currentUser?.zone || "West"} Zone Jurisdiction`
              : "Active with registered cases"}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Critical P1 Hotspots</p>
          <p className={`text-2xl font-bold mt-1 ${criticalTotal > 0 ? "text-red-700" : "text-gray-900"}`}>
            {criticalTotal}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {isWardOfficer ? "Urgent hazards in your ward" : "Urgent hazards requiring dispatch"}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            {isWardOfficer ? "Open Backlog" : "Highest Backlog Ward"}
          </p>
          <p className="text-lg font-bold text-gray-900 mt-1 truncate">
            {isWardOfficer ? `${totalPending} open` : (topWard ? `Ward ${topWard.ward} (${topWard.pending} open)` : "None")}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {isWardOfficer ? "Awaiting field resolution" : (topWard?.zone ? `${topWard.zone} Zone` : "All clear")}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total Grievances</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalCases}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {totalPending} pending · {totalActive} active · {totalResolved} resolved
          </p>
        </div>
      </div>

      {/* Filters and Sorting Controls (Only shown for super_admin or multi-ward view) */}
      {!isWardOfficer ? (
        <div className="bg-white rounded-xl border border-gray-200 p-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Zone Tabs */}
          <div className="flex items-center gap-1">
            {["all", "West", "East", "North", "South"].map((z) => (
              <button
                key={z}
                onClick={() => setSelectedZone(z)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedZone.toLowerCase() === z.toLowerCase()
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {z === "all" ? "All Zones" : `${z} Zone`}
              </button>
            ))}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "load" | "critical" | "pending" | "ward")}
              className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="load">Highest Load (Total Cases)</option>
              <option value="critical">Critical Hazards (P1 First)</option>
              <option value="pending">Pending Backlog</option>
              <option value="ward">Ward Number</option>
            </select>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Ward {officerWard} Jurisdiction ({wardList[0]?.zone || currentUser?.zone || "West"} Zone)</span>
          </div>
          <span className="text-xs text-blue-700 font-medium">
            {wardList[0]?.total || 0} Grievances Under Supervision
          </span>
        </div>
      )}

      {/* Ward Cards Grid */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
          Analyzing ward operations...
        </div>
      ) : wardList.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
          No complaints registered in the selected zone.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wardList.map((w) => {
            const hasCritical = w.criticalCount > 0;

            // Get top categories with count
            const topCategories = (Object.entries(w.categories) as [Category, number][])
              .filter(([, count]) => count > 0)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3);

            // Get zone field staff
            const zoneStaff = employees.filter(
              (e) => e.zone.toLowerCase() === w.zone.toLowerCase() && e.active !== false
            );

            return (
              <div
                key={w.ward}
                onClick={() => {
                  setSelectedWardModal(w);
                  resetModalFilters();
                }}
                className={`bg-white rounded-xl border transition-all cursor-pointer hover:border-primary hover:shadow-md group p-4 flex flex-col justify-between ${
                  hasCritical ? "border-red-200" : "border-gray-200"
                }`}
              >
                <div className="space-y-3.5">
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-primary transition-colors">
                          Ward {w.ward}
                        </h3>
                        <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-medium">
                          {w.zone} Zone
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {w.pending} pending · {w.inProgress} active
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-bold text-gray-900 block leading-tight">{w.total}</span>
                      <span className="text-[10px] text-gray-400 font-medium">total cases</span>
                    </div>
                  </div>

                  {/* Critical Alert Tag */}
                  {hasCritical && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-2.5 py-1 flex items-center justify-between text-[11px] text-red-800 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                        <span>{w.criticalCount} Critical Hazard{w.criticalCount > 1 ? "s" : ""}</span>
                      </span>
                      <span className="text-[10px] text-red-600 font-normal">Immediate Action</span>
                    </div>
                  )}

                  {/* Clear Status Distribution Breakdown */}
                  <div className="space-y-1.5">
                    {/* Proportional Segmented Bar */}
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                      {w.pending > 0 && (
                        <div
                          style={{ width: `${(w.pending / w.total) * 100}%` }}
                          className="bg-amber-400 h-full"
                          title={`Pending: ${w.pending}`}
                        />
                      )}
                      {w.inProgress > 0 && (
                        <div
                          style={{ width: `${(w.inProgress / w.total) * 100}%` }}
                          className="bg-blue-500 h-full"
                          title={`In Progress: ${w.inProgress}`}
                        />
                      )}
                      {w.resolved > 0 && (
                        <div
                          style={{ width: `${(w.resolved / w.total) * 100}%` }}
                          className="bg-emerald-500 h-full"
                          title={`Resolved: ${w.resolved}`}
                        />
                      )}
                    </div>

                    {/* Labeled Status Metric Badges */}
                    <div className="flex items-center justify-between text-[11px] text-gray-600 font-medium pt-0.5">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span>{w.pending} Pending</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>{w.inProgress} Active</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>{w.resolved} Done</span>
                      </span>
                    </div>
                  </div>

                  {/* Top Issues Breakdown with counts */}
                  {topCategories.length > 0 && (
                    <div className="pt-2 border-t border-gray-100">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                        Primary Infrastructure Issues:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {topCategories.map(([cat, count]) => (
                          <span
                            key={cat}
                            className="inline-flex items-center gap-1 text-[11px] text-gray-700 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded"
                          >
                            <span className="font-medium">{categoryLabel[cat] || cat}:</span>
                            <span className="font-bold text-gray-900">{count}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assigned Zone Crew */}
                  {zoneStaff.length > 0 && (
                    <div className="pt-1 text-[11px] text-gray-500 flex items-center justify-between">
                      <span className="text-gray-400">Assigned Crew:</span>
                      <span className="font-medium text-gray-700 truncate max-w-[170px]">
                        {zoneStaff.map((s) => s.name.split(" ")[0]).join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Clickable Card Action Footer */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-primary font-semibold group-hover:underline flex items-center gap-1">
                    <span>View & Filter {w.total} Issues</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {w.criticalCount > 0 ? "P1 Alert" : "Normal"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ward Grievance Explorer Modal */}
      {selectedWardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Dim Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedWardModal(null)}
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-100 z-10 overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 bg-white">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    Ward {selectedWardModal.ward} Issues & Grievances
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                    {selectedWardModal.zone} Zone
                  </span>
                  {selectedWardModal.criticalCount > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">
                      {selectedWardModal.criticalCount} Critical
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedWardModal.total} total recorded complaints in this ward
                </p>
              </div>

              <button
                onClick={() => setSelectedWardModal(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="p-4 bg-gray-50/80 border-b border-gray-100 flex flex-wrap items-center gap-3">
              {/* Search input */}
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search address, citizen, issue..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
                <svg
                  className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Category Filter */}
              <select
                value={modalCategory}
                onChange={(e) => setModalCategory(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Categories</option>
                <option value="street_light">Street Light</option>
                <option value="water_supply">Water Supply</option>
                <option value="garbage">Garbage</option>
                <option value="drainage">Drainage</option>
                <option value="road">Road</option>
                <option value="other">Other</option>
              </select>

              {/* Status Filter */}
              <select
                value={modalStatus}
                onChange={(e) => setModalStatus(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress / Assigned</option>
                <option value="fixed">Waiting for Approval</option>
                <option value="resolved">Resolved</option>
              </select>

              {/* Priority Filter */}
              <select
                value={modalPriority}
                onChange={(e) => setModalPriority(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Priorities</option>
                <option value="P1_critical">P1 Critical</option>
                <option value="P2_high">P2 High</option>
                <option value="P3_medium">P3 Medium</option>
                <option value="P4_low">P4 Low</option>
              </select>

              {(modalSearch || modalCategory !== "all" || modalStatus !== "all" || modalPriority !== "all") && (
                <button
                  onClick={resetModalFilters}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Complaints List Table */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredModalComplaints.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">
                  <p className="font-medium text-gray-600">No complaints match your filters</p>
                  <p className="text-xs mt-1">Try broadening your search or resetting active filters.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredModalComplaints.map((c) => {
                    const isP1 = c.priority === "P1_critical";
                    return (
                      <div
                        key={c._id}
                        onClick={() => onSelectComplaint?.(c)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isP1 ? "bg-red-50/40 border-red-200 hover:bg-red-50/70" : "bg-white border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-gray-900">
                              {c.ticketId || `#VMC-2026-${c._id.slice(-4)}`}
                            </span>
                            <span className="text-xs font-medium text-gray-700">
                              {c.name} {c.phone && `· ${c.phone}`}
                            </span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                              {categoryLabel[c.category] || c.category}
                            </span>
                            {c.priority && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                  isP1
                                    ? "bg-red-100 text-red-700"
                                    : c.priority === "P2_high"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {c.priority.replace("_", " ")}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-gray-800 font-medium">
                            {c.address}
                          </p>

                          <p className="text-xs text-gray-600 italic line-clamp-1">
                            "{c.issue}"
                          </p>
                        </div>

                        {/* Status & Action */}
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                              c.status === "resolved"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : c.status === "in_progress" || c.status === "assigned"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {c.status === "in_progress"
                              ? "In Progress"
                              : c.status === "assigned"
                              ? "Assigned"
                              : c.status === "resolved"
                              ? "Resolved"
                              : "Pending"}
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectComplaint?.(c);
                            }}
                            className="px-3 py-1 bg-white border border-gray-200 hover:border-primary hover:text-primary rounded-lg text-xs font-medium text-gray-700 transition-colors"
                          >
                            Details →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>
                Showing {filteredModalComplaints.length} of {selectedWardModal.total} issues in Ward {selectedWardModal.ward}
              </span>
              <button
                onClick={() => setSelectedWardModal(null)}
                className="px-4 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

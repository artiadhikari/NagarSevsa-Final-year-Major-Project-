import { useState, useEffect, useMemo } from "react";
import { fetchEmployees, roleLabel } from "../data/employees";
import type { Employee } from "../data/employees";
import { fetchComplaints, categoryLabel } from "../data/complaints";
import type { Complaint } from "../data/complaints";
import type { User } from "../data/auth";

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const deptLabel: Record<string, string> = {
  street_light: "Street Light",
  water_supply: "Water Supply",
  garbage: "Garbage",
  drainage: "Drainage",
  road: "Road",
};

const roleColors: Record<string, string> = {
  engineer: "bg-blue-50 text-blue-700 border-blue-200",
  supervisor: "bg-purple-50 text-purple-700 border-purple-200",
  field_worker: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

interface Props {
  currentUser?: User | null;
  onSelectComplaint?: (complaint: Complaint) => void;
}

export default function EmployeesPage({ currentUser, onSelectComplaint }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const isWardOfficer = currentUser?.role === "ward_officer";
  const officerZone = currentUser?.zone || "West";

  useEffect(() => {
    Promise.all([fetchEmployees(), fetchComplaints()])
      .then(([empData, compData]) => {
        setEmployees(empData);
        setComplaints(compData);
      })
      .finally(() => setLoading(false));
  }, []);

  const baseEmployees = isWardOfficer
    ? employees.filter((e) => e.zone.toLowerCase() === officerZone.toLowerCase())
    : employees;

  const filtered = useMemo(() => {
    return baseEmployees.filter((e) => {
      if (filter && e.role !== filter && e.department !== filter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = e.name.toLowerCase().includes(q);
        const matchesEmail = e.email.toLowerCase().includes(q);
        const matchesPhone = e.phone.includes(q);
        const matchesDept = (deptLabel[e.department] || e.department).toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesDept) return false;
      }
      return true;
    });
  }, [baseEmployees, filter, search]);

  // Helper to get complaints assigned to a specific employee
  const getAssignedTasks = (emp: Employee): Complaint[] => {
    return complaints.filter((c) => {
      if (!c.assignedTo) return false;
      if (typeof c.assignedTo === "object") {
        return (
          String(c.assignedTo._id) === String(emp._id) ||
          (c.assignedTo.name && c.assignedTo.name.toLowerCase() === emp.name.toLowerCase())
        );
      }
      return String(c.assignedTo) === String(emp._id);
    });
  };

  const selectedTasks = selectedEmployee ? getAssignedTasks(selectedEmployee) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-900">
              {isWardOfficer ? `${officerZone} Zone Field Staff` : "Employees & Staff Directory"}
            </h2>
            {isWardOfficer && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                Ward {currentUser?.ward || "12"} Dispatch
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Click on any employee to view their assigned civic tasks and grievances
          </p>
        </div>

        {/* Controls: Search & Filter */}
        <div className="flex items-center gap-2.5">
          <div className="relative min-w-[200px]">
            <input
              type="text"
              placeholder="Search staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
            <svg
              className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">All Roles & Depts</option>
            <optgroup label="By Role">
              <option value="engineer">Engineers</option>
              <option value="supervisor">Supervisors</option>
              <option value="field_worker">Field Workers</option>
            </optgroup>
            <optgroup label="By Department">
              <option value="street_light">Street Light</option>
              <option value="water_supply">Water Supply</option>
              <option value="garbage">Garbage</option>
              <option value="drainage">Drainage</option>
              <option value="road">Road</option>
            </optgroup>
          </select>
        </div>
      </div>

      {/* Employee List Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
          Loading employees...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
          No staff members found matching your search.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Zone</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-center">Assigned Tasks</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((emp) => {
                  const tasks = getAssignedTasks(emp);
                  const activeCount = tasks.filter((t) => t.status !== "resolved").length;

                  return (
                    <tr
                      key={emp._id}
                      onClick={() => setSelectedEmployee(emp)}
                      className="hover:bg-gray-50/80 cursor-pointer transition-colors group"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                            {getInitials(emp.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                              {emp.name}
                            </p>
                            <p className="text-xs text-gray-400 truncate max-w-[180px]">{emp.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold border ${
                            roleColors[emp.role] || "bg-gray-50 text-gray-600 border-gray-200"
                          }`}
                        >
                          {roleLabel[emp.role] || emp.role}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4 text-gray-700 font-medium">
                        {deptLabel[emp.department] || emp.department}
                      </td>

                      {/* Zone */}
                      <td className="py-3 px-4">
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {emp.zone} Zone
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4 text-xs font-mono text-gray-600">
                        {emp.phone || "—"}
                      </td>

                      {/* Assigned Tasks Count */}
                      <td className="py-3 px-4 text-center">
                        {tasks.length > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            <span>{tasks.length} task{tasks.length > 1 ? "s" : ""}</span>
                            {activeCount > 0 && <span className="text-blue-500 font-normal">({activeCount} active)</span>}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">Available (0)</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <span className="text-xs font-semibold text-primary group-hover:underline inline-flex items-center gap-1">
                          <span>View Tasks</span>
                          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employee Tasks Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Dim Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedEmployee(null)}
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-gray-100 z-10 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white text-base font-bold shrink-0">
                  {getInitials(selectedEmployee.name)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">{selectedEmployee.name}</h3>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${
                        roleColors[selectedEmployee.role] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {roleLabel[selectedEmployee.role] || selectedEmployee.role}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {deptLabel[selectedEmployee.department] || selectedEmployee.department} Department · {selectedEmployee.zone} Zone · {selectedEmployee.phone}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedEmployee(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body - Tasks List */}
            <div className="p-6 overflow-y-auto space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Assigned Grievances ({selectedTasks.length})
                </h4>
                <span className="text-xs text-gray-400">
                  {selectedTasks.filter((t) => t.status === "resolved").length} resolved
                </span>
              </div>

              {selectedTasks.length === 0 ? (
                <div className="bg-gray-50 border border-gray-150 rounded-xl p-8 text-center text-gray-400">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2.5">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">No Active Tasks Assigned</p>
                  <p className="text-xs mt-1 text-gray-400">
                    This staff member currently has zero pending complaints and is available for dispatch.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedTasks.map((task) => {
                    const isP1 = task.priority === "P1_critical";
                    return (
                      <div
                        key={task._id}
                        onClick={() => {
                          setSelectedEmployee(null);
                          onSelectComplaint?.(task);
                        }}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:shadow-xs flex flex-col gap-2 ${
                          isP1 ? "bg-red-50/30 border-red-200 hover:bg-red-50/60" : "bg-white border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-gray-900">
                              {task.ticketId || `#VMC-2026-${task._id.slice(-4)}`}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                              {categoryLabel[task.category] || task.category}
                            </span>
                            {task.priority && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                  isP1
                                    ? "bg-red-100 text-red-700"
                                    : task.priority === "P2_high"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {task.priority.replace("_", " ")}
                              </span>
                            )}
                          </div>

                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-lg border ${
                              task.status === "resolved"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : task.status === "in_progress" || task.status === "assigned"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {task.status === "in_progress"
                              ? "In Progress"
                              : task.status === "assigned"
                              ? "Assigned"
                              : task.status === "resolved"
                              ? "Resolved"
                              : "Pending"}
                          </span>
                        </div>

                        <p className="text-xs text-gray-800 font-medium">
                          📍 {task.address} {task.ward ? `(Ward ${task.ward})` : ""}
                        </p>

                        <p className="text-xs text-gray-600 italic line-clamp-2">
                          "{task.issue}"
                        </p>

                        <div className="pt-1 flex justify-end">
                          <span className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                            Inspect Complaint Details →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>
                {selectedTasks.length} total task{selectedTasks.length === 1 ? "" : "s"} assigned to {selectedEmployee.name}
              </span>
              <button
                onClick={() => setSelectedEmployee(null)}
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

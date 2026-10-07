import { useState } from "react";
import type { Complaint } from "../data/complaints";
import { categoryLabel } from "../data/complaints";

interface Props {
  complaints: Complaint[];
  onSelect: (complaint: Complaint) => void;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  return { time, label: isToday ? "Today" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) };
}

function getInitials(name: string) {
  return (name || "C").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 1);
}

export default function ComplaintTable({ complaints, onSelect }: Props) {
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const totalPages = Math.ceil(complaints.length / pageSize) || 1;
  const safePage = Math.min(page, totalPages);

  if (complaints.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
        No complaints match the current filters.
      </div>
    );
  }

  const paginatedComplaints = complaints.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
      {/* Title bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Recent Complaints</h3>
          <p className="text-xs text-gray-400 mt-0.5">Real-time civic grievances across Vadodara wards</p>
        </div>
        <span className="text-xs text-gray-500 font-medium bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg">
          {complaints.length} Total Cases
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-gray-50/75 text-gray-500 uppercase text-[10px] font-semibold tracking-wider border-b border-gray-200">
              <th className="px-6 py-3">Citizen & Case ID</th>
              <th className="px-4 py-3">Ward</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Issue Description</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedComplaints.map((c) => {
              const { time, label } = formatTime(c.createdAt);
              const displayCategory = categoryLabel[c.category] || c.category || "Other";
              const isCritical = c.priority === "P1_critical";

              return (
                <tr
                  key={c._id}
                  className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                  onClick={() => onSelect(c)}
                >
                  {/* Citizen Details */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-semibold shrink-0">
                        {getInitials(c.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{c.name}</span>
                          {c.ticketId && (
                            <span className="font-mono text-[11px] text-gray-500">
                              {c.ticketId}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 max-w-[170px] truncate mt-0.5">
                          {c.address}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Ward / Zone */}
                  <td className="px-4 py-3.5">
                    <span className="font-medium text-gray-900 block">Ward {c.ward}</span>
                    <span className="text-[11px] text-gray-400 block">{c.zone ? `${c.zone} Zone` : "—"}</span>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3.5">
                    <span className="font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                      {displayCategory}
                    </span>
                  </td>

                  {/* Issue Description */}
                  <td className="px-4 py-3.5">
                    <p className="text-gray-700 max-w-[240px] truncate leading-tight">{c.issue}</p>
                    {(c.isDuplicate || (c.duplicateCount || 0) > 0) && (
                      <div className="flex items-center gap-1.5 mt-1">
                        {c.isDuplicate && (
                          <span className="text-[10px] text-gray-500 border border-gray-200 px-1.5 py-0.2 rounded font-medium">
                            Duplicate
                          </span>
                        )}
                        {(c.duplicateCount || 0) > 0 && (
                          <span className="text-[10px] text-gray-500 border border-gray-200 px-1.5 py-0.2 rounded font-medium">
                            +{c.duplicateCount} reported
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Priority (Color ONLY for P1 Critical) */}
                  <td className="px-4 py-3.5">
                    {isCritical ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                        Critical
                      </span>
                    ) : c.priority === "P2_high" ? (
                      <span className="text-[11px] text-amber-700 font-medium">
                        High
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400">
                        Normal
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        c.status === "resolved"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                          : c.status === "fixed"
                          ? "bg-teal-50 text-teal-800 border border-teal-300 font-bold"
                          : c.status === "in_progress"
                          ? "bg-blue-50 text-blue-700 border border-blue-200/70"
                          : c.status === "assigned"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200/70"
                          : "bg-amber-50 text-amber-700 border border-amber-200/70"
                      }`}
                    >
                      {c.status === "fixed" ? "Fixed · Review" : c.status?.replace("_", " ") || "Pending"}
                    </span>
                  </td>

                  {/* Date & Time */}
                  <td className="px-4 py-3.5 text-gray-500 text-[11px]">
                    <span className="block text-gray-700 font-medium">{label}</span>
                    <span className="text-gray-400">{time}</span>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(c);
                      }}
                      className="text-primary hover:text-primary-dark font-semibold text-xs transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Dynamic Pagination */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-white">
        <span className="text-xs text-gray-400">
          Showing {Math.min((page - 1) * pageSize + 1, complaints.length)} - {Math.min(page * pageSize, complaints.length)} of {complaints.length}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-2.5 py-1 rounded text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-200"
          >
            Previous
          </button>
          <span className="text-xs font-medium text-gray-700 px-2">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-2.5 py-1 rounded text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-200"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

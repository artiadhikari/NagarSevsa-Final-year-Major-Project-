import { useState, useEffect } from "react";
import { fetchAuditLogs } from "../data/audit";
import type { AuditLogItem } from "../data/audit";

const actionStyles: Record<string, { label: string; badge: string }> = {
  CREATED: {
    label: "Grievance Registered",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
  },
  STATUS_UPDATED: {
    label: "Status Updated",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
  },
  ASSIGNED: {
    label: "Staff Assigned",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  NOTE_ADDED: {
    label: "Internal Note",
    badge: "bg-gray-100 text-gray-700 border-gray-200",
  },
  RESOLVED: {
    label: "Grievance Resolved",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

function formatTimestamp(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs().then((data) => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Audit Trail</h2>
          <p className="text-sm text-gray-400 mt-1">
            Immutable log of all grievance lifecycle events, assignments, and status transitions
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-full font-medium">
          <span className="w-2 h-2 rounded-full bg-primary" />
          {logs.length} Recorded Events
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
          Loading audit events...
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
          No audit entries recorded yet.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5">Case ID</th>
                  <th className="px-4 py-3.5">Action Event</th>
                  <th className="px-4 py-3.5">Performed By</th>
                  <th className="px-6 py-3.5">Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => {
                  const style = actionStyles[log.action] || {
                    label: log.action,
                    badge: "bg-gray-50 text-gray-600 border-gray-200",
                  };
                  return (
                    <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-medium text-gray-500 whitespace-nowrap">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-xs font-mono font-bold text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/15">
                          {log.ticketId || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold border ${style.badge}`}
                        >
                          {style.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-gray-700 whitespace-nowrap">
                        {log.performedBy}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">
                        {log.details || "Lifecycle update recorded"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

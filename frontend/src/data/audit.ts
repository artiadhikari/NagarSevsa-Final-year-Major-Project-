export interface AuditLogItem {
  _id: string;
  complaintId: string;
  ticketId?: string;
  action: "CREATED" | "STATUS_UPDATED" | "ASSIGNED" | "NOTE_ADDED" | "RESOLVED";
  performedBy: string;
  details?: string;
  changes?: {
    previous?: Record<string, unknown>;
    updated?: Record<string, unknown>;
  };
  timestamp: string;
}

const API_URL = import.meta.env.VITE_API_URL || "/api";

export async function fetchAuditLogs(complaintId?: string): Promise<AuditLogItem[]> {
  try {
    const url = complaintId
      ? `${API_URL}/audit-logs?complaintId=${complaintId}`
      : `${API_URL}/audit-logs`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("⚠ Could not fetch audit logs from backend:", err);
    return [
      {
        _id: "log-demo-1",
        complaintId: "c001",
        ticketId: "VMC-2026-4821",
        action: "CREATED",
        performedBy: "Twilio IVR (+919876543210)",
        details: "Grievance registered automatically via phone call",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        _id: "log-demo-2",
        complaintId: "c002",
        ticketId: "VMC-2026-9214",
        action: "ASSIGNED",
        performedBy: "Municipal Staff",
        details: "Assigned to Ramesh Patel (Street Light, West Zone)",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        _id: "log-demo-3",
        complaintId: "c003",
        ticketId: "VMC-2026-1042",
        action: "RESOLVED",
        performedBy: "Field Supervisor",
        details: "Garbage bin cleared and sanitized on site",
        timestamp: new Date(Date.now() - 600000).toISOString(),
      },
    ];
  }
}

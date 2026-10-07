export interface Employee {
  _id: string;
  name: string;
  role: "engineer" | "supervisor" | "field_worker";
  department: string;
  zone: string;
  phone: string;
  email: string;
  active?: boolean;
}

export const roleLabel: Record<string, string> = {
  engineer: "Engineer",
  supervisor: "Supervisor",
  field_worker: "Field Worker",
};

const API_URL = import.meta.env.VITE_API_URL || "/api";

export async function fetchEmployees(): Promise<Employee[]> {
  try {
    const res = await fetch(`${API_URL}/employees`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("⚠ Could not fetch employees:", err);
    return [];
  }
}

export async function assignComplaint(
  complaintId: string,
  data: {
    status?: string;
    assignedTo?: string | null;
    notes?: string;
    resolutionNotes?: string;
    resolverName?: string;
    reworkReason?: string;
    performedBy?: string;
  }
) {
  const res = await fetch(`${API_URL}/complaints/${complaintId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

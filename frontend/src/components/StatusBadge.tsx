import type { Status } from "../data/complaints";

const config: Record<Status, { label: string; bg: string; text: string }> = {
  pending: { label: "Pending", bg: "bg-amber-light", text: "text-amber-dark" },
  assigned: { label: "Assigned", bg: "bg-indigo-50", text: "text-indigo-700" },
  in_progress: { label: "In Progress", bg: "bg-blue-light", text: "text-blue-dark" },
  fixed: { label: "Awaiting Approval", bg: "bg-amber-100", text: "text-amber-900" },
  resolved: { label: "Resolved", bg: "bg-green-light", text: "text-green-dark" },
};

export default function StatusBadge({ status }: { status: Status }) {
  const c = config[status];
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

import type { Complaint } from "../data/complaints";

interface Props {
  complaints: Complaint[];
}

export default function StatsCards({ complaints }: Props) {
  const total = complaints.length;
  const pending = complaints.filter((c) => (c.status || "pending") === "pending").length;
  const inProgress = complaints.filter((c) => c.status === "in_progress" || c.status === "assigned" || c.status === "fixed").length;
  const resolved = complaints.filter((c) => c.status === "resolved").length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const cards = [
    {
      label: "Total Registered",
      count: total,
      accent: <span className="text-primary text-xs font-medium mt-1 block">Active civic cases</span>,
      border: "border-l-4 border-l-primary",
      textColor: "text-gray-900",
      iconBg: "bg-primary/10 text-primary",
      iconPath: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
    },
    {
      label: "Pending Review",
      count: pending,
      accent: <span className="text-amber-600 text-xs font-medium mt-1 block">Awaiting assignment</span>,
      border: "border-l-4 border-l-amber-400",
      textColor: "text-amber-600",
      iconBg: "bg-amber-50 text-amber-500",
      iconPath: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      label: "In Progress",
      count: inProgress,
      accent: <span className="text-blue-600 text-xs font-medium mt-1 block">Assigned to field staff</span>,
      border: "border-l-4 border-l-blue-500",
      textColor: "text-blue-600",
      iconBg: "bg-blue-50 text-blue-500",
      iconPath: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
    },
    {
      label: "Resolved",
      count: resolved,
      accent: <span className="text-emerald-600 text-xs font-medium mt-1 block">{resolutionRate}% resolution rate</span>,
      border: "border-l-4 border-l-emerald-500",
      textColor: "text-emerald-600",
      iconBg: "bg-emerald-50 text-emerald-500",
      iconPath: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className={`bg-white rounded-xl border border-gray-100 p-5 ${card.border}`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.iconBg}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={card.iconPath} />
            </svg>
          </div>
          <p className="text-xs text-gray-400 mt-3">{card.label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-0.5">{card.count}</p>
          {card.accent}
        </div>
      ))}
    </div>
  );
}

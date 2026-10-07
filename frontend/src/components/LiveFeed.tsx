import { useState, useEffect, useCallback } from "react";
import { fetchComplaints, categoryLabel } from "../data/complaints";
import type { Complaint } from "../data/complaints";

const categoryColors: Record<string, string> = {
  street_light: "bg-yellow-500",
  water_supply: "bg-sky-500",
  garbage: "bg-emerald-500",
  drainage: "bg-violet-500",
  road: "bg-orange-500",
  other: "bg-gray-400",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function LiveFeed() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    fetchComplaints().then((data) => {
      setComplaints(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000); // auto-refresh every 15s
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Live Feed</h2>
          <p className="text-sm text-gray-400 mt-1">Auto-refreshes every 15 seconds</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Live
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
          Loading feed...
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((c, i) => (
            <div
              key={c._id}
              className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-start gap-4 hover:shadow-sm transition-shadow"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Timeline dot */}
              <div className="flex flex-col items-center pt-1">
                <div className={`w-3 h-3 rounded-full ${categoryColors[c.category] || categoryColors.other}`} />
                {i < complaints.length - 1 && <div className="w-px h-full bg-gray-100 mt-1" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900">{c.name}</span>
                  <span className="text-[10px] text-gray-400">·</span>
                  <span className="text-[10px] text-gray-400">{timeAgo(c.createdAt)}</span>
                  <span className={`ml-auto text-[10px] px-2 py-0.5 rounded font-medium ${
                    c.status === "resolved" ? "bg-green-50 text-green-600" :
                    c.status === "in_progress" ? "bg-blue-50 text-blue-600" :
                    "bg-amber-50 text-amber-600"
                  }`}>
                    {c.status === "in_progress" ? "In Progress" : c.status === "resolved" ? "Resolved" : "Pending"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{c.issue}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span>{categoryLabel[c.category] || c.category}</span>
                  <span>·</span>
                  <span>Ward {c.ward}</span>
                  {c.zone && <><span>·</span><span>{c.zone} Zone</span></>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

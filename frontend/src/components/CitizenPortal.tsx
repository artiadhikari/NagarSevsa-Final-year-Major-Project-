import { useState, useEffect } from "react";
import { trackGrievance } from "../data/tracking";
import type { TrackedComplaint } from "../data/tracking";
import { categoryLabel } from "../data/complaints";

const statusSteps = [
  { key: "pending", label: "Registered", desc: "Logged via AI Voice IVR" },
  { key: "assigned", label: "Assigned", desc: "Routed to Department" },
  { key: "in_progress", label: "Field Work", desc: "Work submitted / under review" },
  { key: "resolved", label: "Resolved", desc: "Ward Officer verified & closed" },
];

function getStepIndex(c: TrackedComplaint): number {
  if (c.status === "resolved") return 3;
  if (c.status === "in_progress" || c.status === "fixed") return 2;
  if (c.status === "assigned" || c.assignedTo) return 1;
  return 0;
}

function getStatusBadge(c: TrackedComplaint) {
  if (c.status === "resolved") {
    return {
      label: "Resolved",
      className: "bg-emerald-100 text-emerald-800 border-emerald-200",
    };
  }
  if (c.status === "fixed") {
    return {
      label: "Awaiting Approval",
      className: "bg-amber-100 text-amber-900 border-amber-300",
    };
  }
  if (c.status === "in_progress") {
    return {
      label: "In Progress",
      className: "bg-blue-100 text-blue-800 border-blue-200",
    };
  }
  if (c.status === "assigned" || c.assignedTo) {
    return {
      label: "Assigned",
      className: "bg-indigo-100 text-indigo-800 border-indigo-200",
    };
  }
  return {
    label: "Registered",
    className: "bg-amber-100 text-amber-900 border-amber-200",
  };
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
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

export default function CitizenPortal() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<TrackedComplaint[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trackParam = params.get("track");
    if (trackParam) {
      setQuery(trackParam);
      handleSearch(undefined, trackParam);
    }
  }, []);

  const handleSearch = async (e?: React.FormEvent, sampleQuery?: string) => {
    if (e) e.preventDefault();
    const searchTerm = sampleQuery || query;
    if (!searchTerm.trim()) return;

    if (sampleQuery) setQuery(sampleQuery);

    setLoading(true);
    setError("");
    setResults([]);
    setHasSearched(true);

    try {
      const data = await trackGrievance(searchTerm);
      setResults(data.complaints || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to track grievance.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Official Government Portal Header Banner */}
      <div className="bg-[#0a1e3d] rounded-2xl text-white shadow-md border border-slate-800 overflow-hidden">
        <div className="p-7 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-blue-200 block">
                Government of Gujarat · Vadodara Municipal Corporation
              </span>
              <span className="text-xs text-blue-300 font-medium">
                Public Grievance Redressal Portal
              </span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold mt-4 tracking-tight text-white">
            Track Your Grievance Status
          </h2>
          <p className="text-xs sm:text-sm text-blue-100/80 mt-1.5 leading-relaxed max-w-2xl">
            Real-time status tracking for municipal complaints. Enter your Case ID or registered Phone Number to check live investigation and field resolution progress.
          </p>

          {/* Search Input Bar */}
          <form onSubmit={handleSearch} className="mt-6 flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
              <input
                type="text"
                required
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter Case ID (e.g. VMC-2026-5739) or 10-digit Phone..."
                className="w-full bg-white text-gray-900 rounded-xl pl-12 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-200 shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 shrink-0"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Searching...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                  </svg>
                  Track Status
                </>
              )}
            </button>
          </form>

          {/* Sample query shortcuts */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs text-blue-200/90">
            <span className="font-medium text-white/80">Quick test:</span>
            <button
              type="button"
              onClick={() => handleSearch(undefined, "VMC-2026-5739")}
              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] transition-colors border border-white/15"
            >
              #VMC-2026-5739
            </button>
            <button
              type="button"
              onClick={() => handleSearch(undefined, "+919876543210")}
              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] transition-colors border border-white/15"
            >
              +919876543210
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-semibold">No Matching Grievance Found</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Results List */}
      {results.length > 0 && (
        <div className="space-y-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Found {results.length} Registered Grievance{results.length > 1 ? "s" : ""}:
          </p>

          {results.map((c) => {
            const currentStepIdx = getStepIndex(c);
            const statusBadge = getStatusBadge(c);
            const displayCategory = categoryLabel[c.category] || c.category || "General";

            return (
              <div
                key={c._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-6 animate-slide-in"
              >
                {/* Grievance Header Card */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-5">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                        {c.ticketId || `#VMC-${c._id.slice(-4)}`}
                      </span>
                      <span
                        className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full border ${statusBadge.className}`}
                      >
                        {statusBadge.label}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mt-2">{c.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Registered: {formatDate(c.createdAt)} {c.phone && `· Contact: ${c.phone}`}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                      {displayCategory}
                    </span>
                    <p className="text-xs text-gray-500 mt-2">
                      Ward {c.ward || "—"} {c.zone ? `· ${c.zone} Zone` : ""}
                    </p>
                  </div>
                </div>

                {/* Visual Progress Stepper */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                    Grievance Resolution Lifecycle
                  </p>
                  <div className="grid grid-cols-4 gap-2 relative">
                    {statusSteps.map((step, idx) => {
                      const isComplete = idx <= currentStepIdx;
                      const isCurrent = idx === currentStepIdx;

                      return (
                        <div key={step.key} className="text-center relative">
                          <div className="flex items-center justify-center">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                isComplete
                                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                                  : "bg-gray-100 text-gray-400"
                              } ${isCurrent ? "ring-4 ring-emerald-200 scale-105" : ""}`}
                            >
                              {isComplete ? (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                idx + 1
                              )}
                            </div>
                          </div>
                          <p className={`text-xs font-bold mt-2 ${isComplete ? "text-gray-900" : "text-gray-400"}`}>
                            {step.label}
                          </p>
                          <p className="text-[10px] text-gray-400 hidden sm:block mt-0.5">{step.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Grievance Details Summary */}
                <div className="bg-gray-50 rounded-xl p-4 text-xs space-y-2">
                  <div>
                    <span className="text-gray-400 font-semibold uppercase text-[10px] block">Location Address:</span>
                    <span className="text-gray-800 font-medium">{c.address || "Vadodara"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold uppercase text-[10px] block">Grievance Description:</span>
                    <span className="text-gray-700 italic">"{c.issue}"</span>
                  </div>
                  {c.assignedTo && typeof c.assignedTo === "object" && (
                    <div className="bg-blue-50/70 border border-blue-100 p-2.5 rounded-lg text-blue-900 mt-2">
                      <span className="font-bold block text-[10px] uppercase text-blue-700">
                        Assigned Field Personnel:
                      </span>
                      <span className="font-semibold text-gray-800">
                        {c.assignedTo.name}
                      </span>
                      <span className="text-gray-500 text-[11px] ml-1.5">
                        ({c.assignedTo.department ? c.assignedTo.department.replace("_", " ") : "Municipal"} Department · {c.assignedTo.zone || "Vadodara"} Zone)
                      </span>
                    </div>
                  )}
                  {c.notes && (
                    <div className="bg-blue-50/70 border border-blue-100 p-2.5 rounded-lg text-blue-900 mt-2">
                      <span className="font-bold block text-[10px] uppercase text-blue-600">Official Municipal Note:</span>
                      {c.notes}
                    </div>
                  )}
                </div>

                {/* Audit Timeline */}
                {c.timeline && c.timeline.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Activity Timeline
                    </p>
                    <div className="space-y-2.5 border-l-2 border-gray-100 pl-4 ml-2 text-xs">
                      {c.timeline.map((item, i) => (
                        <div key={item._id || i} className="relative">
                          <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white" />
                          <div className="flex items-baseline justify-between">
                            <span className="font-bold text-gray-800">{item.action.replace("_", " ")}</span>
                            <span className="text-[10px] text-gray-400">{formatDate(item.timestamp)}</span>
                          </div>
                          <p className="text-gray-500 text-[11px] mt-0.5">{item.details}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {hasSearched && !loading && results.length === 0 && !error && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
          No records found.
        </div>
      )}
    </div>
  );
}

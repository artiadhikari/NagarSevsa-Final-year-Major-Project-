import { useState, useEffect } from "react";
import type { Complaint } from "../data/complaints";
import { categoryLabel } from "../data/complaints";
import { fetchEmployees, assignComplaint, roleLabel } from "../data/employees";
import type { Employee } from "../data/employees";
import type { User } from "../data/auth";

interface Props {
  complaint: Complaint;
  onClose: () => void;
  onUpdate?: () => void;
  currentUser?: User | null;
}

const categoryBadgeStyles: Record<string, string> = {
  street_light: "bg-amber-50 text-amber-800 border-amber-200",
  water_supply: "bg-sky-50 text-sky-800 border-sky-200",
  garbage: "bg-emerald-50 text-emerald-800 border-emerald-200",
  drainage: "bg-indigo-50 text-indigo-800 border-indigo-200",
  road: "bg-orange-50 text-orange-800 border-orange-200",
  other: "bg-gray-50 text-gray-700 border-gray-200",
};

export default function ComplaintDetail({ complaint: c, onClose, onUpdate, currentUser }: Props) {
  const [assignedTo, setAssignedTo] = useState<string>(
    typeof c.assignedTo === "object" && c.assignedTo?._id ? c.assignedTo._id : c.assignedTo || ""
  );
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [saving, setSaving] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState(c.resolutionNotes || "");
  const [reworkReason, setReworkReason] = useState("");
  const [showReworkInput, setShowReworkInput] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const caseId = c.ticketId || `#VMC-2026-${c._id.slice(-4)}`;
  const currentStatus = c.status || "pending";

  const isFieldWorker = currentUser?.role === "field_worker";
  const canResolve =
    !currentUser ||
    currentUser.role === "ward_engineer" ||
    currentUser.role === "ward_officer" ||
    currentUser.role === "super_admin";

  useEffect(() => {
    fetchEmployees().then(setEmployees);
  }, []);

  const handleSaveAssignment = async () => {
    setSaving(true);
    setErrorMessage("");
    try {
      await assignComplaint(c._id, {
        status: assignedTo && currentStatus === "pending" ? "assigned" : currentStatus,
        assignedTo: assignedTo || null,
        performedBy: currentUser?.name || "Ward Officer",
      });
      setActionSuccess("Assignment saved");
      setTimeout(() => {
        setActionSuccess(null);
        onUpdate?.();
      }, 700);
    } catch (err) {
      console.error("Failed to save assignment:", err);
      setErrorMessage("Failed to save assignment.");
    } finally {
      setSaving(false);
    }
  };

  const handleStartWork = async () => {
    setSaving(true);
    setErrorMessage("");
    try {
      await assignComplaint(c._id, {
        status: "in_progress",
        performedBy: currentUser?.name || "Field Worker",
      });
      setActionSuccess("Work started");
      setTimeout(() => {
        setActionSuccess(null);
        onUpdate?.();
      }, 700);
    } catch (err) {
      console.error("Failed to start work:", err);
      setErrorMessage("Failed to update status to In Progress.");
    } finally {
      setSaving(false);
    }
  };

  const handleApproveResolution = async () => {
    if (!resolutionNotes.trim()) {
      setErrorMessage("Please provide Ward Engineer verification remarks before resolving.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    try {
      const resolverName = currentUser?.name || "Vikram Solanki (Ward 12 Engineer)";
      await assignComplaint(c._id, {
        status: "resolved",
        resolutionNotes: resolutionNotes.trim(),
        resolverName,
        performedBy: resolverName,
      });
      setActionSuccess("Complaint Verified & Resolved");
      setTimeout(() => {
        setActionSuccess(null);
        onUpdate?.();
        onClose();
      }, 800);
    } catch (err) {
      console.error("Failed to resolve complaint:", err);
      setErrorMessage("Failed to resolve complaint.");
    } finally {
      setSaving(false);
    }
  };

  const handleRequestRework = async () => {
    if (!reworkReason.trim()) {
      setErrorMessage("Please specify why rework is required.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    try {
      const engineerName = currentUser?.name || "Ward Engineer";
      await assignComplaint(c._id, {
        status: "in_progress",
        reworkReason: reworkReason.trim(),
        resolverName: engineerName,
        performedBy: engineerName,
      });
      setActionSuccess("Rework Requested");
      setTimeout(() => {
        setActionSuccess(null);
        onUpdate?.();
      }, 700);
    } catch (err) {
      console.error("Failed to request rework:", err);
      setErrorMessage("Failed to request rework.");
    } finally {
      setSaving(false);
    }
  };

  const handleReopen = async () => {
    setSaving(true);
    setErrorMessage("");
    try {
      await assignComplaint(c._id, {
        status: "in_progress",
        performedBy: currentUser?.name || "Ward Engineer",
      });
      setActionSuccess("Case Re-opened");
      setTimeout(() => {
        setActionSuccess(null);
        onUpdate?.();
      }, 700);
    } catch (err) {
      console.error("Failed to reopen case:", err);
      setErrorMessage("Failed to reopen case.");
    } finally {
      setSaving(false);
    }
  };

  const selectedEmp = employees.find((e) => e._id === assignedTo);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dim Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Centered Modal Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100 z-10 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-slate-50/60">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">Complaint Details</h2>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                  currentStatus === "resolved"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : currentStatus === "fixed"
                    ? "bg-teal-100 text-teal-800 border-teal-300"
                    : currentStatus === "in_progress"
                    ? "bg-blue-100 text-blue-800 border-blue-300"
                    : currentStatus === "assigned"
                    ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                    : "bg-amber-100 text-amber-800 border-amber-300"
                }`}
              >
                {currentStatus === "fixed" ? "Fixed · Awaiting Review" : currentStatus.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono mt-0.5">Ticket ID: {caseId}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {actionSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold">{actionSuccess}</span>
            </div>
          )}

          {/* Issue Type & Citizen Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Category
              </label>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                  categoryBadgeStyles[c.category] || categoryBadgeStyles.other
                }`}
              >
                {categoryLabel[c.category] || c.category}
              </span>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Citizen
              </label>
              <p className="text-xs font-semibold text-gray-800">{c.name || "Anonymous Citizen"}</p>
              {c.phone && <p className="text-[11px] text-gray-500 font-mono">{c.phone}</p>}
            </div>
          </div>

          {/* Address & Ward */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Location & Ward
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-800">
              <p className="font-medium text-gray-900">📍 {c.address || "No address specified"}</p>
              {(c.ward || c.zone) && (
                <p className="text-[11px] text-gray-500 mt-1">
                  {c.ward ? `Ward ${c.ward}` : ""}{c.ward && c.zone ? " • " : ""}{c.zone ? `${c.zone} Zone` : ""}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Grievance Description
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-700 leading-relaxed italic">
              "{c.issue || "No description provided"}"
            </div>
          </div>

          {/* Child Duplicates Notice */}
          {(c.linkedDuplicates && c.linkedDuplicates.length > 0) && (
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-900">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>Incident Cluster ({c.linkedDuplicates.length} Linked Reports)</span>
              </div>
              <p className="text-[11px] text-indigo-700">
                Resolving this primary grievance will automatically resolve all {c.linkedDuplicates.length} linked citizen duplicates.
              </p>
            </div>
          )}

          {/* Read-only Fix Photo Evidence (for non-officer viewers) */}
          {!canResolve && currentStatus !== "resolved" && c.afterImageUrl && (
            <div className="border border-teal-200 bg-teal-50/40 rounded-xl p-4 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-900 block">
                Field Worker Proof Photo
              </span>
              <div className="relative rounded-xl overflow-hidden border border-teal-200 max-h-52 bg-black flex items-center justify-center">
                <img
                  src={c.afterImageUrl}
                  alt="Field fix proof"
                  className="w-full h-48 object-cover hover:scale-105 transition-transform cursor-pointer"
                  onClick={() => window.open(c.afterImageUrl, "_blank")}
                />
                <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-xs font-mono">
                  Click to expand ↗
                </span>
              </div>
              {c.fixNotes && (
                <p className="text-xs text-gray-700 bg-white p-2 rounded-lg border border-teal-100">
                  <span className="font-semibold">Worker Notes:</span> {c.fixNotes}
                </p>
              )}
            </div>
          )}

          {/* Already Resolved Status Details */}
          {currentStatus === "resolved" ? (
            <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Resolved & Verified</span>
                </div>
                {c.resolvedAt && (
                  <span className="text-[10px] text-emerald-700 font-mono">
                    {new Date(c.resolvedAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>

              {c.afterImageUrl && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[11px] font-semibold text-gray-700">Verified Fix Photo Evidence:</p>
                  <div className="relative rounded-xl overflow-hidden border border-emerald-200 max-h-48 bg-black flex items-center justify-center">
                    <img
                      src={c.afterImageUrl}
                      alt="Verified field fix"
                      className="w-full h-44 object-cover hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => window.open(c.afterImageUrl, "_blank")}
                    />
                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-xs font-mono">
                      Click to expand ↗
                    </span>
                  </div>
                </div>
              )}

              {c.resolverName && (
                <p className="text-xs text-gray-800">
                  <span className="font-semibold">Sign-off Authority:</span> {c.resolverName}
                </p>
              )}

              {c.resolutionNotes && (
                <div className="bg-white border border-emerald-100 rounded-lg p-3 text-xs text-gray-800">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                    Formal Resolution Remarks:
                  </span>
                  {c.resolutionNotes}
                </div>
              )}

              {canResolve && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleReopen}
                    disabled={saving}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline"
                  >
                    Re-open Case (Request Re-inspection)
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Resolution Decision Controls for Ward Engineer / Officers */
            canResolve && (
              <div className="border border-indigo-100 bg-indigo-50/20 rounded-xl p-4 space-y-3.5">
                {/* Worker Fix Proof Photo (Stored via Cloudinary) */}
                {c.afterImageUrl ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                        📸 Worker Fix Proof Photo
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                        Proof from Field App
                      </span>
                    </div>
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 max-h-56 bg-black flex items-center justify-center">
                      <img
                        src={c.afterImageUrl}
                        alt="Field fix proof"
                        className="w-full h-52 object-cover hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => window.open(c.afterImageUrl, "_blank")}
                      />
                      <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-xs font-mono">
                        Click to expand ↗
                      </span>
                    </div>
                    {c.fixNotes && (
                      <div className="bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-gray-700">
                        <span className="font-semibold text-gray-900 block text-[11px]">Worker Field Notes:</span>
                        {c.fixNotes}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white border border-dashed border-gray-200 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 font-medium">📷 No proof photo uploaded yet by field worker.</p>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
                    Ward Engineer Verification Remarks <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="e.g., Inspected site, replacement confirmed, lux levels and electrical safety verified."
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>

                {/* Decision Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleApproveResolution}
                    disabled={saving}
                    className="flex-1 min-w-[170px] py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Approve & Mark Resolved</span>
                  </button>

                  {currentStatus === "fixed" && (
                    <button
                      type="button"
                      onClick={() => setShowReworkInput(!showReworkInput)}
                      className="py-2.5 px-4 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Request Rework
                    </button>
                  )}
                </div>

                {showReworkInput && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 animate-slide-in">
                    <label className="text-[11px] font-bold text-amber-900 block">
                      Rework Instructions for Field Staff:
                    </label>
                    <input
                      type="text"
                      value={reworkReason}
                      onChange={(e) => setReworkReason(e.target.value)}
                      placeholder="e.g. Debris not cleared properly, please re-visit pole 23."
                      className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-gray-800 outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowReworkInput(false)}
                        className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleRequestRework}
                        disabled={saving}
                        className="text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-lg"
                      >
                        Send Back to Worker
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          )}

          {/* Field Worker View Banner if logged in as Worker */}
          {isFieldWorker && currentStatus !== "resolved" && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                <span className="text-sm">👷</span>
                <span>Field Worker Mode</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Use your <strong>NagarSeva Engineer Mobile App</strong> on site to accept this task, take the after-fix photo, and submit the fix.
              </p>
              {currentStatus === "assigned" && (
                <button
                  onClick={handleStartWork}
                  disabled={saving}
                  className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Start Work (Mark In Progress)
                </button>
              )}
              <p className="text-[10px] text-gray-500 pt-1 border-t border-blue-150">
                🔒 Formal resolution decision is strictly reserved for the <strong>Ward Engineer</strong>.
              </p>
            </div>
          )}

          {/* Assignment Management (Accessible by Ward Engineer & Officers) */}
          {canResolve && (
            <div className="pt-2 border-t border-gray-150 space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                Assign / Re-dispatch Field Worker
              </label>
              <div className="flex gap-2">
                <select
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                >
                  <option value="">— Unassigned —</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} — {roleLabel[emp.role] || emp.role} ({emp.department.replace("_", " ")}, {emp.zone} Zone)
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSaveAssignment}
                  disabled={saving}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Save Staff
                </button>
              </div>
              {selectedEmp && (
                <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                  ✓ {selectedEmp.name} ({roleLabel[selectedEmp.role] || selectedEmp.role}) · {selectedEmp.zone} Zone
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Case: {caseId}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

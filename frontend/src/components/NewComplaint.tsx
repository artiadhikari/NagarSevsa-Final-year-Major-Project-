import { useState } from "react";
import { CATEGORIES, categoryLabel } from "../data/complaints";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const zones = ["West", "East", "North", "South"];

export default function NewComplaint({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState({
    name: "",
    address: "",
    ward: "",
    zone: "",
    category: "",
    issue: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/complaints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSuccess(true);
      setForm({ name: "", address: "", ward: "", zone: "", category: "", issue: "" });
      setTimeout(() => {
        setSuccess(false);
        onBack();
      }, 1500);
    } catch (err) {
      console.error("Failed to submit:", err);
      alert("Failed to submit complaint. Check if backend is running.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Register New Complaint</h2>
          <p className="text-sm text-gray-400 mt-0.5">Manually add a citizen complaint</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        {/* Name + Ward */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Citizen Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Ramesh Patel"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Ward Number</label>
            <input
              value={form.ward}
              onChange={(e) => set("ward", e.target.value)}
              placeholder="e.g. 7"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Address *</label>
          <input
            required
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            placeholder="e.g. Akota, B-42 Residency, near main road"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {/* Zone + Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Zone</label>
            <select
              value={form.zone}
              onChange={(e) => set("zone", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="">Select zone</option>
              {zones.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Category *</label>
            <select
              required
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="">Select category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{categoryLabel[c]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Issue */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Issue Description *</label>
          <textarea
            required
            rows={4}
            value={form.issue}
            onChange={(e) => set("issue", e.target.value)}
            placeholder="Describe the complaint in detail..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2 ${
              success ? "bg-green-600" : "bg-primary hover:bg-primary-dark"
            } ${submitting ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {success ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Submitted!
              </>
            ) : submitting ? "Submitting..." : "Register Complaint"}
          </button>
        </div>
      </form>
    </div>
  );
}

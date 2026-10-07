import { ZONES, CATEGORIES, WARDS, categoryLabel } from "../data/complaints";
import type { Category } from "../data/complaints";

export interface Filters {
  ward: string;
  zone: string;
  category: string;
  status: string;
  search: string;
}

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
  lockedWard?: string;
  lockedZone?: string;
}

export default function FilterBar({ filters, onChange, lockedWard, lockedZone }: Props) {
  const set = (key: keyof Filters, value: string) =>
    onChange({ ...filters, [key]: value });

  const resetFilters = () =>
    onChange({
      ward: lockedWard || "",
      zone: lockedZone || "",
      category: "",
      status: "",
      search: "",
    });

  const pillClass =
    "bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer";

  const hasActiveFilters = Boolean(
    (!lockedWard && filters.ward) ||
      (!lockedZone && filters.zone) ||
      filters.category ||
      filters.status ||
      filters.search
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Ward */}
      {lockedWard ? (
        <span className="bg-blue-50 border border-blue-200 rounded-full px-4 py-2 text-sm text-blue-800 font-semibold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          Ward {lockedWard}
        </span>
      ) : (
        <select className={pillClass} value={filters.ward} onChange={(e) => set("ward", e.target.value)}>
          <option value="">Ward (All)</option>
          {WARDS.map((w) => (
            <option key={w} value={w}>Ward {w}</option>
          ))}
        </select>
      )}

      {/* Zone */}
      {lockedZone ? (
        <span className="bg-gray-100 border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-700 font-medium">
          {lockedZone} Zone
        </span>
      ) : (
        <select className={pillClass} value={filters.zone} onChange={(e) => set("zone", e.target.value)}>
          <option value="">Zone (All)</option>
          {ZONES.map((z) => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>
      )}

      {/* Category */}
      <select className={pillClass} value={filters.category} onChange={(e) => set("category", e.target.value)}>
        <option value="">Category (All)</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{categoryLabel[c as Category]}</option>
        ))}
      </select>

      {/* Status */}
      <select className={pillClass} value={filters.status} onChange={(e) => set("status", e.target.value)}>
        <option value="">Status (All)</option>
        <option value="pending">Pending</option>
        <option value="in_progress">In Progress</option>
        <option value="fixed">Waiting for Approval</option>
        <option value="resolved">Resolved</option>
      </select>

      <div className="flex-1" />

      {/* Search */}
      <div className="relative min-w-[220px]">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <input
          type="text"
          placeholder="Search by ticket, citizen, issue..."
          className="w-full bg-white border border-gray-200 rounded-full pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
        />
      </div>

      {/* Reset / Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-full transition-colors flex items-center gap-1.5"
          title="Clear all active filters"
        >
          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Reset Filters
        </button>
      )}
    </div>
  );
}

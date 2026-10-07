import type { Complaint } from "./complaints";

export interface GrievanceTimelineItem {
  _id: string;
  action: string;
  details: string;
  timestamp: string;
  performedBy: string;
}

export interface TrackedComplaint extends Complaint {
  timeline?: GrievanceTimelineItem[];
}

export interface TrackingResponse {
  success: boolean;
  count: number;
  complaints: TrackedComplaint[];
}

const API_URL = import.meta.env.VITE_API_URL || "/api";

export async function trackGrievance(query: string): Promise<TrackingResponse> {
  const clean = query.trim().replace(/^#/, "");
  const res = await fetch(`${API_URL}/complaints/track/${encodeURIComponent(clean)}`);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error || `No grievance records found matching "${query}". Please check your Case ID or Phone Number.`
    );
  }

  return await res.json();
}

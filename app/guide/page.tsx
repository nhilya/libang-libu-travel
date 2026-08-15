import type { Metadata } from "next";
import { GuideDashboard } from "@/components/guide-dashboard";

export const metadata: Metadata = {
  title: "Guide Duty | Libang Libu Travel",
  description: "Assigned trips, GPS duty tracking and itinerary checkpoints for tour guides.",
};

export default function GuidePage() {
  return <GuideDashboard />;
}

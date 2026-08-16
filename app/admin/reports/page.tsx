import type { Metadata } from "next";
import { AdminTripReport } from "@/components/admin-trip-report";

export const metadata: Metadata = {
  title: "Operational Reports | Libang Libu Travel Admin",
  description: "Exportable trip, commercial, GPS, itinerary and compliance reporting.",
};

export default function AdminReportsPage() {
  return <AdminTripReport />;
}

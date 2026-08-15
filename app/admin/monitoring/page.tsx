import type { Metadata } from "next";
import { AdminMonitoringDashboard } from "@/components/admin-monitoring-dashboard";

export const metadata: Metadata = {
  title: "Trip Monitoring | Libang Libu Travel Admin",
  description: "Operational readiness, evidence review and live trip monitoring.",
};

export default function AdminMonitoringPage() {
  return <AdminMonitoringDashboard />;
}

import type { Metadata } from "next";
import { TeacherDashboard } from "@/components/teacher-dashboard";

export const metadata: Metadata = {
  title: "Teacher Trip View | Libang Libu Travel",
  description: "Live school trip status, guide location and itinerary progress for teachers.",
};

export default function TeacherPage() {
  return <TeacherDashboard />;
}

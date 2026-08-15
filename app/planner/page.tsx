import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { TripPlanner } from "@/components/trip-planner";

export const metadata: Metadata = {
  title: "Plan Your School Trip | Libang Libu Travel",
  description: "Build an indicative Ipoh school expedition brief in three short steps.",
};

export default function PlannerPage() {
  return (
    <div className="site-shell planner-page">
      <header className="site-header">
        <div className="container nav-wrap">
          <Link className="brand" href="/">
            <BrandLogo priority />
          </Link>
          <Link className="button button-outline button-small" href="/">Back to expeditions</Link>
        </div>
      </header>
      <main>
        <TripPlanner />
      </main>
    </div>
  );
}

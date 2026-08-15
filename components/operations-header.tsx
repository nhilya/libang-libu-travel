import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export function OperationsHeader({ active }: { active: "guide" | "teacher" | "admin" }) {
  return (
    <header className="operations-header">
      <div className="operations-header-inner">
        <Link className="operations-brand" href="/">
          <BrandLogo priority />
          <span><strong>Trip Operations</strong><small>Ipoh School Outing</small></span>
        </Link>
        <nav className="operations-switcher" aria-label="Operations applications">
          <Link className={active === "guide" ? "active" : ""} href="/guide">Guide</Link>
          <Link className={active === "teacher" ? "active" : ""} href="/teacher">Teacher</Link>
          <Link className={active === "admin" ? "active" : ""} href="/admin/monitoring">Admin</Link>
        </nav>
      </div>
    </header>
  );
}

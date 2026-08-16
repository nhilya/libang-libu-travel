import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { QuotationEmailPreview } from "@/components/quotation-email-preview";

export const metadata: Metadata = {
  title: "Quotation Email Preview | Libang Libu Travel",
  description: "Preview of the AI-generated itinerary and quotation email.",
};

export default function QuotationEmailPreviewPage() {
  return (
    <div className="email-preview-page">
      <header className="email-preview-header">
        <Link href="/"><BrandLogo priority /></Link>
        <Link href="/admin/monitoring">Back to admin</Link>
      </header>
      <main>
        <section className="email-preview-intro">
          <span className="eyebrow accent">Sales flow mockup</span>
          <h1>AI itinerary & quotation email</h1>
          <p>This preview shows what teachers receive after completing the landing-page quiz. Meeting and WhatsApp links are demo placeholders.</p>
        </section>
        <QuotationEmailPreview />
      </main>
    </div>
  );
}

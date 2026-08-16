import { renderQuotationEmail } from "@/lib/quotation-email-template";

export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const html = renderQuotationEmail({
    baseUrl: origin,
    teacherName: "Cikgu Aminah",
    schoolName: "SMK Raja Perempuan",
    proposalNumber: "Proposal LLT-2026-0184",
    tripTitle: "Ipoh Karst & Heritage Expedition",
    tripDate: "12–13 September 2026",
    students: 80,
    teachers: 6,
    duration: "2D1N",
    pricePerStudent: 245,
    meetingDate: "20 August 2026, 3:00 PM",
    meetingUrl: `${origin}/email-preview/quotation#meeting-demo`,
    proposalUrl: `${origin}/client/proposal`,
    whatsappUrl: "https://wa.me/60123456789?text=Assalamualaikum%2C%20I%20would%20like%20to%20discuss%20Proposal%20LLT-2026-0184.",
  });

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

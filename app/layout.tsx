import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ipoh School Outing — Educational Expeditions | Libang Libu Travel",
  description:
    "Curriculum-aligned school expeditions in Ipoh: limestone geology, tin-mining history and heritage. Licensed guides, full risk assessment. Plan your school trip.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

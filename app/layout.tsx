import type { Metadata } from "next";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ipoh School Outing — Educational Expeditions | Libang Libu Travel",
  description:
    "Curriculum-aligned school expeditions in Ipoh: limestone geology, tin-mining history and heritage. Licensed guides, full risk assessment. Plan your school trip.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LL Trip Ops",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}<PwaRegister /></body>
    </html>
  );
}

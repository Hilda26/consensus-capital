import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Fragment_Mono } from "next/font/google";
import "./globals.css";
import { CapitalDeskShell } from "@/components/CapitalDeskShell";

const body = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-body" });
const data = Fragment_Mono({ subsets: ["latin"], weight: "400", variable: "--font-data" });

export const metadata: Metadata = {
  title: "Consensus Capital",
  description: "Many minds. One capital consensus.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${data.variable}`}>
      <body className="min-h-screen bg-alice-blue text-deep-navy">
        <CapitalDeskShell>{children}</CapitalDeskShell>
      </body>
    </html>
  );
}

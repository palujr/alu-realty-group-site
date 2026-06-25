import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alu Realty Group | Fathom Realty Elite",
  description:
    "Search homes, monitor mortgage rates, and get local real estate insight from Alu Realty Group at Fathom Realty Elite."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

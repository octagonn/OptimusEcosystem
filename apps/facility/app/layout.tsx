import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Optimus Ecosystem",
  description: "Living-world dashboard for the AX-powered Optimus swarm",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CivicResolve | Smart civic grievance management",
  description: "Semantic duplicate detection and department routing for urban local bodies."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

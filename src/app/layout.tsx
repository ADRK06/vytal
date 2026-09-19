import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VYTAL",
  description: "Desk wellness, in real time.",
};

// TODO: wire up Space Grotesk / IBM Plex Mono via next/font.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

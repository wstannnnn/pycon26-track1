import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job and Skills Track",
  description: "Career pathways, skills maps, and learning actions for lifelong learners.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

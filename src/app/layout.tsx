import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Neon Syndicate",
  description:
    "A cyberpunk text-based web RPG. Hack the grid, climb street rep, stay out of system lockout.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}

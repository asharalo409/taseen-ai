
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TASEEN AI — Personal AI Agent",
  description: "Your personal intelligent AI assistant."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <body>{children}</body>
    </html>
  );
}

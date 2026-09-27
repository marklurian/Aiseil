import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Aiseil — Our Relationship Scrapbook",
  description:
    "A private scrapbook to capture every shared moment, memory, and milestone together.",
  keywords: ["relationship", "scrapbook", "memories", "love", "couple"],
  openGraph: {
    title: "Aiseil — Our Relationship Scrapbook",
    description: "A private scrapbook to capture every shared moment together.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

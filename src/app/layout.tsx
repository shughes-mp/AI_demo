import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { validateEnvironment } from "@/lib/env-check";
import { AppClerkProvider } from "@/components/app-clerk-provider";

validateEnvironment();

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "AI_thena",
  description:
    "An AI teaching, learning, and formative assessment tool for reading-based courses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${serif.variable} app-shell`}>
        <AppClerkProvider>{children}</AppClerkProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { CookieBanner } from "@/components/cookie-banner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MergeMint — Automated Changelogs, Public Roadmaps, CLI & IDE Ecosystem",
  description:
    "Turn messy git commits and PR diffs into Linear-grade changelogs, public voting roadmaps, and instant CLI & VS Code sync powered by Gemini AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <body className="min-h-screen bg-[#09090B] font-sans text-zinc-100 antialiased selection:bg-violet-500/30">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-radial-spotlight" />
        <Providers>
          {children}
          <CookieBanner />
        </Providers>
      </body>
    </html>
  );
}


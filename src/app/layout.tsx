import type { Metadata } from "next";
import { Newsreader, Manrope, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
  // Next.js doesn't have font metric overrides for Newsreader; disabling
  // suppresses the warning without any visual impact — display: swap handles FOUT.
  adjustFontFallback: false,
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://limelight.news";

export const metadata: Metadata = {
  title: {
    default: "Limelight",
    template: "%s · Limelight",
  },
  description:
    "See the world's news before you read it. An interactive heat map that shows global news coverage intensity by country.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "Limelight",
    description:
      "See the world's news before you read it. An interactive heat map that shows global news coverage intensity by country.",
    type: "website",
    url: SITE_URL,
    siteName: "Limelight",
  },
  twitter: {
    card: "summary_large_image",
    title: "Limelight",
    description: "See the world's news before you read it.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${newsreader.variable} ${manrope.variable} ${ibmPlexMono.variable}`}>
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}

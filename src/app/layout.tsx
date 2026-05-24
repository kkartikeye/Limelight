import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Limelight",
  description:
    "See the world's news before you read it. An interactive heat map that shows global news coverage intensity by country.",
  openGraph: {
    title: "Limelight",
    description:
      "See the world's news before you read it. An interactive heat map that shows global news coverage intensity by country.",
    type: "website",
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
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}

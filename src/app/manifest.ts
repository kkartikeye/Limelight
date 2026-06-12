import type { MetadataRoute } from "next";

// PWA manifest — served at /manifest.webmanifest, linked automatically by Next.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Limelight — Global News Intensity",
    short_name: "Limelight",
    description:
      "An interactive heat map that shows global news coverage intensity by country.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f3ec",
    theme_color: "#f6f3ec",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

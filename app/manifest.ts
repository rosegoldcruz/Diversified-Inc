import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Diversified OS",
    short_name: "Diversified",
    description: "Internal Operations Platform for Diversified Inc.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0b1a3a",
    theme_color: "#0b1a3a",
    icons: [
      {
        src: "/divco-static.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/divco-static.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
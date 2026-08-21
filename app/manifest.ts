import { generateSystemMetadata } from "@/lib/metadata";
import type { MetadataRoute } from "next";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const system = await generateSystemMetadata();
  return {
    name: `${system.companyName} POS` || "Your POS System",
    short_name: system.companyShortName || "POS",
    description: system.description || "Point of Sale Management System",

    start_url: "/",

    display: "standalone",

    background_color: system.theme.primaryColor || "#ffffff",

    theme_color: system.theme.primaryColor || "#ffffff",

    orientation: "any",

    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

import prisma from "@/lib/prisma";
import { SystemMetadata } from "@/types";

/**
 * Generates system metadata dynamically from database settings.
 * Used by both API endpoints and server components.
 * Automatically reflects changes when settings are updated via the settings hooks.
 */
export const generateSystemMetadata = async (): Promise<SystemMetadata> => {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsMap = Object.fromEntries(
      settings.map((s) => [s.key, s.value]),
    );

    // Extract database info from environment or settings
    const databaseUrl = process.env.DATABASE_URL || "";
    const dbType = databaseUrl.includes("postgresql")
      ? "PostgreSQL"
      : "Unknown";
    const dbName = process.env.DATABASE_NAME || "pos_database";

    // Build icons based on favicon setting
    const faviconUrl =
      settingsMap.favicon_url && settingsMap.favicon_url.trim() !== ""
        ? settingsMap.favicon_url
        : null;

    const icons = faviconUrl
      ? {
          icon: faviconUrl,
          shortcut: faviconUrl,
          apple: faviconUrl,
        }
      : {
          icon: "/favicon.ico",
          shortcut: "/favicon.ico",
          apple: "/apple-touch-icon.png",
        };

    // Check for feature enablement
    const mpesaKey = settingsMap.mpesa_consumer_key || "";
    const cloudinaryKey = settingsMap.cloudinary_cloud_name || "";

    const metadata: SystemMetadata = {
      title: settingsMap.company_short_name || "POS",
      description: settingsMap.app_description || "Point of Sale application",
      logoUrl: settingsMap.logo_url || null,
      databaseName: dbName,
      databaseType: dbType,
      databaseUrl: databaseUrl.replace(/:[^:]*@/, ":***@"), // mask password
      companyName: settingsMap.company_name || "Your Company",
      companyShortName: settingsMap.company_short_name || "POS",
      faviconUrl,
      icons,
      theme: {
        primaryColor: settingsMap.primary_color || "#22c55e",
        secondaryColor: settingsMap.secondary_color || "#64748b",
      },
      features: {
        mpesaEnabled: mpesaKey.length > 0,
        cloudinaryEnabled: cloudinaryKey.length > 0,
        inventoryEnabled:
          settingsMap.inventory_enabled !== "false" &&
          settingsMap.inventory_enabled !== "0",
      },
    };

    return metadata;
  } catch (error) {
    console.error("Failed to generate system metadata:", error);
    throw new Error(`Failed to generate system metadata: ${error}`);
  }
};

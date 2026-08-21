import { generateSystemMetadata } from "@/lib/metadata";
import { NextResponse } from "next/server";
import { SystemMetadata } from "@/types";

/**
 * API endpoint that dynamically generates system metadata from database settings.
 * Auto-refreshes whenever settings are updated via the settings hooks.
 * Cache-Control is set to no-cache to ensure fresh metadata on each request.
 */
export const GET = async (): Promise<
  NextResponse<SystemMetadata | { message: string }>
> => {
  try {
    const metadata = await generateSystemMetadata();

    // Cache-control: revalidate on every request to stay in sync with settings changes
    return NextResponse.json(metadata, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Failed to generate metadata:", error);
    return NextResponse.json(
      { message: "Failed to generate metadata" },
      { status: 500 },
    );
  }
};

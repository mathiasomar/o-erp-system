import { getCurrentUser } from "@/actions/profile.action";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const GET = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 },
      );
    }
    return NextResponse.json(user);
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch profile" },
      { status: 500 },
    );
  }
};

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement actual user authentication check with database
    // For now, return unauthorized for all requests
    return NextResponse.json(
      { error: "Authentication not yet implemented" },
      { status: 501 },
    );
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

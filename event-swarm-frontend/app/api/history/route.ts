import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = "https://bjpbbx0r-9000.inc1.devtunnels.ms";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/history`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error("History fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch history", details: err.message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = "https://bjpbbx0r-9000.inc1.devtunnels.ms";

export async function POST() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error("Reset error:", err);
    return NextResponse.json(
      { error: "Failed to reset chat", details: err.message },
      { status: 500 }
    );
  }
}

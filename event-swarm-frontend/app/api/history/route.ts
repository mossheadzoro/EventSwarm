import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://bjpbbx0r-9000.inc1.devtunnels.ms";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/history`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Backend error", status: res.status }, { status: res.status });
    }

    const text = await res.text();
    if (!text) {
      return NextResponse.json({ messages: [] }, { status: 200 });
    }
    
    const data = JSON.parse(text);
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error("History fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch history", details: err.message },
      { status: 500 }
    );
  }
}

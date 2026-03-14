import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = "https://bjpbbx0r-9000.inc1.devtunnels.ms";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "date parameter is required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/calendar/check?date=${date}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error("Calendar check error:", err);
    return NextResponse.json(
      { error: "Failed to check calendar", details: err.message },
      { status: 500 }
    );
  }
}

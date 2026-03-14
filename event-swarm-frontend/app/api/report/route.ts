import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://bjpbbx0r-9000.inc1.devtunnels.ms";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/report`, {
      method: "GET",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to generate report" }, { status: res.status });
    }

    // Forward the file as a blob download
    const blob = await res.blob();
    const headers = new Headers();
    headers.set("Content-Type", res.headers.get("Content-Type") || "application/octet-stream");
    headers.set("Content-Disposition", res.headers.get("Content-Disposition") || "attachment; filename=event_budget_report.pdf");

    return new NextResponse(blob, { status: 200, headers });
  } catch (err: any) {
    console.error("Report download error:", err);
    return NextResponse.json(
      { error: "Failed to download report", details: err.message },
      { status: 500 }
    );
  }
}

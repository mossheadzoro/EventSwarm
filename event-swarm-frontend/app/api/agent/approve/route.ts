// app/api/agent/approve/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { thread_id, message = "APPROVE" } = body; // Usually "APPROVE" [cite: 58, 59]

    if (!thread_id) {
      return NextResponse.json({ error: "Missing thread_id" }, { status: 400 });
    }

    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const response = await fetch(`${BACKEND_URL}/api/approve`, { // [cite: 54]
      method: "POST", // [cite: 55]
      headers: {
        "Content-Type": "application/json", // [cite: 56]
      },
      body: JSON.stringify({
        message: message, // [cite: 58]
        thread_id: thread_id, // [cite: 59]
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.detail || "Approval failed" }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Next.js Approve Proxy Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
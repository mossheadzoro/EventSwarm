// app/api/agent/chat/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, thread_id } = body;

    if (!message || !thread_id) {
      return NextResponse.json({ error: "Missing message or thread_id" }, { status: 400 });
    }

    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // Forward the standard chat message to the FastAPI backend [cite: 39, 43]
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: "POST", // [cite: 44]
      headers: {
        "Content-Type": "application/json", // 
      },
      body: JSON.stringify({
        message: message, // [cite: 47]
        thread_id: thread_id, // [cite: 48]
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("FastAPI Chat Error:", data);
      return NextResponse.json({ error: data.detail || "Chat failed" }, { status: response.status });
    }

    // Returns identical structure to /setup, including phase and messages [cite: 49]
    return NextResponse.json(data);
  } catch (error) {
    console.error("Next.js Chat Proxy Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
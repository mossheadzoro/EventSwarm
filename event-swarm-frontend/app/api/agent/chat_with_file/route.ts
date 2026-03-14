// app/api/agent/chat_with_file/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1. Extract the FormData containing the file and text from the frontend
    const formData = await req.formData();

    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // 2. Forward the FormData directly to the FastAPI backend [cite: 64, 65]
    const response = await fetch(`${BACKEND_URL}/api/chat_with_file`, {
      method: "POST",
      body: formData,
      // Remember: Let Node.js auto-set the Content-Type boundary for FormData!
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("FastAPI File Chat Error:", data);
      return NextResponse.json({ error: data.detail || "File upload failed" }, { status: response.status });
    }

    // 3. Return the swarm's response
    return NextResponse.json(data);
  } catch (error) {
    console.error("Next.js File Chat Proxy Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
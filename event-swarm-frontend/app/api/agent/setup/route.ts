// app/api/agent/setup/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1. Extract the FormData sent from your SwarmEngine component
    const formData = await req.formData();

    // 2. Define your Python FastAPI backend URL
    // Make sure to add NEXT_PUBLIC_API_URL to your .env.local file (e.g., http://localhost:8000)
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
console.log("Next.js Setup Proxy: Forwarding to backend at", BACKEND_URL);
    // 3. Forward the exact FormData to the FastAPI backend
    const response = await fetch(`${BACKEND_URL}/api/setup`, {
      method: "POST", // [cite: 15]
      body: formData,
      // IMPORTANT: Do NOT manually set the "Content-Type" header here. 
      // Node.js will automatically detect the FormData and set the correct 
      // 'multipart/form-data; boundary=...' header for you.
    });
  console.log("Next.js Setup Proxy: Received response from backend with status", response.status);
    // 4. Parse the response from the Python backend
    const data = await response.json();

    // 5. Handle errors if the Python backend rejects the request
    if (!response.ok) {
      console.error("FastAPI Error:", data);
      return NextResponse.json(
        { error: data.detail || "Failed to setup swarm" }, 
        { status: response.status }
      );
    }
console.log("Next.js Setup Proxy: Successfully forwarded setup request and received data:", data);
    // 6. Return the successful response back to the frontend
    // This will include the 'phase' (e.g., 'supervisor') and initial 'messages' [cite: 26, 36]
    return NextResponse.json(data);

  } catch (error) {
    console.error("Next.js Setup Proxy Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error in Next.js proxy" }, 
      { status: 500 }
    );
  }
}
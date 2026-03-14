import { NextResponse } from "next/server";
import SocialMedia from "../../../../lib/model/SocialMedia";
// Ensure DB connection here

export async function POST(req: Request) {
  const { jobId, tagline, platform } = await req.json();
  const post = await SocialMedia.create({ jobId, tagline, platform });
  return NextResponse.json({ success: true, post });
}
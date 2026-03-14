// app/api/social/save/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb"; // Adjust this import to point to your actual DB connection utility
import SocialPost from "@/lib/model/SocialPost"; // Adjust import path

export async function POST(req: Request) {
  try {
    // 1. Ensure the database is connected
    await connectDB();

    // 2. Parse the incoming JSON body from the SocialWidget
    const body = await req.json();
    const { jobId, caption, image_url, platform, status } = body;

    // 3. Basic validation
    if (!jobId || !caption || !platform) {
      return NextResponse.json(
        { error: "Missing required fields (jobId, caption, or platform)" },
        { status: 400 }
      );
    }

    // 4. Create and save the new post to MongoDB
    const newPost = new SocialPost({
      jobId,
      caption,
      image_url: image_url || null, // Handle cases where there is no image
      platform,
      status: status || "draft",
    });

    const savedPost = await newPost.save();

    // 5. Return success response
    return NextResponse.json({
      message: "Social post successfully saved to database",
      data: savedPost,
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error saving social post:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
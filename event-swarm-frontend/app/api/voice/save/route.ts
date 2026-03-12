import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import VoiceCommand from "@/lib/model/VoiceCommand"
import { getUserFromToken } from "../../../lib/auth"

export async function POST(req: Request) {

  const {title, text } = await req.json()

  const user = await getUserFromToken()

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  await connectDB()

  const command = await VoiceCommand.create({
    title,
    text,
    userId: user.id
  })

  return NextResponse.json(command)
}
import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import VoiceCommand from "@/lib/model/VoiceCommand"
import { getUserFromToken } from "../../../lib/auth"

export async function GET() {

  const user = await getUserFromToken()

  await connectDB()

  const commands = await VoiceCommand.find({
    userId: user?.id
  }).sort({ createdAt: -1 })

  return NextResponse.json(commands)
}
import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { connectDB } from "../../../../lib/mongodb"
import User from "@/lib/model/User"

const JWT_SECRET = process.env.JWT_SECRET || ""

export async function GET() {

  const cookieStore = cookies()
  const token = (await cookieStore).get("token")?.value

  if (!token) {
    return NextResponse.json({ user: null })
  }

  try {

    const decoded: any = jwt.verify(token, JWT_SECRET)

    await connectDB()

    const user = await User.findById(decoded.id).select("-password")

    return NextResponse.json({ user })

  } catch {
    return NextResponse.json({ user: null })
  }
}
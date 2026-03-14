import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectDB } from "../../../../lib/mongodb"
import User from "@/lib/model/User"


export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    await connectDB()

    const existing = await User.findOne({ email })

    if (existing) {
      return NextResponse.json({ error: "User exists" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    })

    return NextResponse.json({ message: "User created", user })

  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
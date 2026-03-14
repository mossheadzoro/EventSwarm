import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { connectDB } from "../../../../lib/mongodb"
import User from "@/lib/model/User"


const JWT_SECRET = process.env.JWT_SECRET || ""

export async function POST(req: Request) {

  const { email, password } = await req.json()

  await connectDB()

  const user = await User.findOne({ email })

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, user.password)

  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  const token = jwt.sign(
    { id: user._id },
    JWT_SECRET,
    { expiresIn: "7d" }
  )

  const res = NextResponse.json({ message: "Logged in" })

  res.cookies.set("token", token, {
    httpOnly: true,
    path: "/",
  })

  return res
}
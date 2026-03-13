import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Job from "../../../../lib/model/job"

export async function GET() {

 await connectDB()

const jobs = await Job.find()
 .populate("created_by","name email")
 .sort({ created_at:-1 })

 return NextResponse.json(jobs)
}




import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Job from "@/lib/model/job"
import { form } from "framer-motion/m"



function parseEvent(text: string) {

  const date = text.match(/\d{1,2}\s\w+\s\d{4}/)?.[0]

  const type = ["hackathon", "conference", "workshop"]
    .find(t => text.toLowerCase().includes(t))

  const name = text.match(/called\s(.+?)\son/i)?.[1]

  return {
    event_name: name,
    event_date: date,
    event_type: type
  }

}

export async function POST(req: Request) {

  await connectDB()

  const contentType = req.headers.get("content-type") || ""

  let jobData: any = {}

  /* -------------------------------- */
  /* FORM DATA (Manual Form + CSV) */
  /* -------------------------------- */

 if (contentType.includes("multipart/form-data")) {

  const form = await req.formData()

  const schedule = form.get("schedule_csv")
const participant = form.get("participant_csv")

let scheduleBuffer = null
let participantBuffer = null

if (schedule instanceof File) {
  scheduleBuffer = Buffer.from(await schedule.arrayBuffer())
}

if (participant instanceof File) {
  participantBuffer = Buffer.from(await participant.arrayBuffer())
}

jobData = {
  event_name: form.get("event_name"),
  event_date: form.get("event_date"),
  event_type: form.get("event_type"),
  created_by: form.get("created_by"),


  schedule_csv: scheduleBuffer,
  participant_csv: participantBuffer,

  status: "pending"
}

}

  /* -------------------------------- */
  /* JSON INPUT (Voice / Prompt) */
  /* -------------------------------- */

  else {

    const { transcript, userId } = await req.json()

    const parsed = parseEvent(transcript)

    jobData = {
      ...parsed,
      created_by: userId,
      status: "pending"
    }

  }

  const job = await Job.create(jobData)

  return NextResponse.json(job)

}
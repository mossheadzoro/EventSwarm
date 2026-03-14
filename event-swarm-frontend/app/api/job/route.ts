import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Job from "@/lib/model/job";

// Fallback logic added so it doesn't fail if the regex regex misses
function parseEvent(text: string) {
  const date = text.match(/\d{1,2}\s\w+\s\d{4}/)?.[0] || "TBD";
  const type = ["hackathon", "conference", "workshop"].find(t => 
    text.toLowerCase().includes(t)
  ) || "event";
  
  const nameMatch = text.match(/called\s(.+?)\son/i);
  const name = nameMatch ? nameMatch[1] : "Unnamed Event";

  return {
    event_name: name,
    event_date: date,
    event_type: type
  };
}

export async function POST(req: Request) {
  await connectDB();
  const contentType = req.headers.get("content-type") || "";
  let jobData: any = {};

  /* -------------------------------- */
  /* FORM DATA (Manual Form + CSV OR Prompt + CSV) */
  /* -------------------------------- */
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();

    const schedule = form.get("schedule_csv");
    const participant = form.get("participant_csv");
    const transcript = form.get("transcript"); // Check if it's coming from Prompt Mode

    let scheduleBuffer = null;
    let participantBuffer = null;

    if (schedule instanceof File && schedule.size > 0) {
      scheduleBuffer = Buffer.from(await schedule.arrayBuffer());
    }

    if (participant instanceof File && participant.size > 0) {
      participantBuffer = Buffer.from(await participant.arrayBuffer());
    }

    if (transcript) {
      // It came from Prompt Mode WITH files attached
      const parsed = parseEvent(transcript.toString());
      jobData = {
        ...parsed,
        created_by: form.get("created_by"),
        schedule_csv: scheduleBuffer,
        participant_csv: participantBuffer,
        status: "pending"
      };
    } else {
      // It came from standard Event Form Mode
      jobData = {
        event_name: form.get("event_name"),
        event_date: form.get("event_date"),
        event_type: form.get("event_type"),
        created_by: form.get("created_by"),
        schedule_csv: scheduleBuffer,
        participant_csv: participantBuffer,
        status: "pending"
      };
    }
  } 
  
  /* -------------------------------- */
  /* JSON INPUT (Voice / Prompt strictly without files) */
  /* -------------------------------- */
  else {
    const { transcript, userId } = await req.json();
    const parsed = parseEvent(transcript);

    jobData = {
      ...parsed,
      created_by: userId,
      status: "pending"
    };
  }

  const job = await Job.create(jobData);
  return NextResponse.json(job);
}
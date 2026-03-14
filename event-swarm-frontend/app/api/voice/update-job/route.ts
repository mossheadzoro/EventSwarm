import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Job from "../../../../lib/model/job"; // <-- Adjust this path to where your model file is located

export async function PUT(req: Request) {
  try {
    // 1. Ensure Database Connection
    // If you have a separate db connection utility, you can import and call it here.
    if (mongoose.connection.readyState !== 1) {
      if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not defined in your environment variables.");
      }
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // 2. Parse the incoming JSON payload
    const body = await req.json();
    const { 
      job_id, 
      event_name, 
      event_date, 
      event_type, 
      schedule_csv, 
      participant_csv 
    } = body;

    // 3. Validate the payload
    if (!job_id) {
      return NextResponse.json(
        { error: "Job ID is required to perform an update." }, 
        { status: 400 }
      );
    }

    // 4. Convert edited text back into Buffers to match your JobSchema
    const scheduleBuffer = schedule_csv ? Buffer.from(schedule_csv, "utf-8") : undefined;
    const participantBuffer = participant_csv ? Buffer.from(participant_csv, "utf-8") : undefined;

    // Build the update object dynamically so we don't overwrite with undefined
    const updateFields: any = {
      event_name,
      event_date,
      event_type,
    };

    if (scheduleBuffer) updateFields.schedule_csv = scheduleBuffer;
    if (participantBuffer) updateFields.participant_csv = participantBuffer;

    // 5. Execute the update
    const updatedJob = await Job.findByIdAndUpdate(
      job_id,
      { $set: updateFields },
      { new: true } // Returns the updated document instead of the old one
    );

    if (!updatedJob) {
      return NextResponse.json({ error: "Job not found in database." }, { status: 404 });
    }

    // 6. Return success response
    return NextResponse.json(
      { message: "Job updated successfully!", data: updatedJob }, 
      { status: 200 }
    );

  } catch (error) {
    console.error("Update Job Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while updating the job." }, 
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {

    const audioBuffer = await req.arrayBuffer()

    const response = await fetch(
      "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
          "Content-Type": "audio/webm",
        },
        body: audioBuffer,
      }
    )

    const data = await response.json()

    const text =
      data.results.channels[0].alternatives[0].transcript

    return NextResponse.json({ text })

  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 500 }
    )
  }
}
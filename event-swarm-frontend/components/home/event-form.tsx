"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EventForm() {

  const router = useRouter();

  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState("");

  const [scheduleFile, setScheduleFile] = useState<File | null>(null);
  const [participantFile, setParticipantFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const user = await fetch("/api/auth/me").then(r => r.json());

    
    if (!eventName || !eventDate || !eventType) {
      alert("Please fill all event fields");
      return;
    }

    const formData = new FormData();

    formData.append("event_name", eventName);
    formData.append("event_date", eventDate);
    formData.append("event_type", eventType);
formData.append("created_by", user.user._id)
    if (scheduleFile) {
      formData.append("schedule_csv", scheduleFile);
    }

    if (participantFile) {
      formData.append("participant_csv", participantFile);
    }

    try {

      setLoading(true);

      const res = await fetch("/api/voice/create", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      console.log("Created Job:", data);

      if (!res.ok) {
        console.error("Job creation failed");
        alert("Failed to create event");
        return;
      }

      router.push("/dashboard");

    } catch (err) {

      console.error("Upload error:", err);
      alert("Something went wrong");

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="bg-[#0f171e]/80 border border-[#1e293b] rounded-2xl p-6 w-full max-w-lg space-y-4">

      {/* EVENT NAME */}

      <input
        placeholder="Event Name"
        value={eventName}
        onChange={(e) => setEventName(e.target.value)}
        className="w-full bg-[#080d12] border border-[#1e293b] p-2 rounded text-white"
      />

      {/* EVENT DATE */}

      <input
        placeholder="Event Date (27/03/2026)"
        value={eventDate}
        onChange={(e) => setEventDate(e.target.value)}
        className="w-full bg-[#080d12] border border-[#1e293b] p-2 rounded text-white"
      />

      {/* EVENT TYPE */}

      <input
        placeholder="Event Type"
        value={eventType}
        onChange={(e) => setEventType(e.target.value)}
        className="w-full bg-[#080d12] border border-[#1e293b] p-2 rounded text-white"
      />

      {/* SCHEDULE CSV */}

      <div className="space-y-1">

        <label className="text-sm text-gray-400">
          Schedule CSV
        </label>

        <input
          type="file"
          accept=".csv"
          onChange={(e) => setScheduleFile(e.target.files?.[0] || null)}
          className="w-full text-sm text-gray-300"
        />

      </div>

      {/* PARTICIPANT CSV */}

      <div className="space-y-1">

        <label className="text-sm text-gray-400">
          Participant CSV
        </label>

        <input
          type="file"
          accept=".csv"
          onChange={(e) => setParticipantFile(e.target.files?.[0] || null)}
          className="w-full text-sm text-gray-300"
        />

      </div>

      {/* SUBMIT */}

      <button
        onClick={submit}
        disabled={loading}
        className="w-full bg-[#00e5ff] text-black py-2 rounded-lg hover:bg-[#00c8e0]"
      >
        {loading ? "Creating Event..." : "Create Event"}
      </button>

    </div>

  );

}
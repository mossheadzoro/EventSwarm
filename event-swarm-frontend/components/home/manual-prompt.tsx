"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileUp, Users, Calendar, Loader2 } from "lucide-react";

export default function ManualPrompt({ userId }: { userId?: string }) {
  const [prompt, setPrompt] = useState("");
  const [scheduleFile, setScheduleFile] = useState<File | null>(null);
  const [participantFile, setParticipantFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const scheduleRef = useRef<HTMLInputElement>(null);
  const participantRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!prompt) return;
    setIsSubmitting(true);

    try {
      let res;
      // If we have files, we must use FormData
      if (scheduleFile || participantFile) {
        const formData = new FormData();
        formData.append("transcript", prompt);
        if (userId) formData.append("created_by", userId);
        if (scheduleFile) formData.append("schedule_csv", scheduleFile);
        if (participantFile) formData.append("participant_csv", participantFile);

        res = await fetch("/api/job", {
          method: "POST",
          body: formData,
        });
      } else {
        // Standard JSON fetch for plain text
        res = await fetch("/api/job", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: prompt, userId }),
        });
      }

      if (res.ok) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[#1e293b]/50 p-6 rounded-xl border border-[#334155] space-y-4">
      <textarea
        className="w-full bg-[#0f172a] text-white border border-[#334155] rounded-lg p-4 h-32 focus:outline-none focus:border-[#00e5ff] resize-none"
        placeholder="e.g. Schedule a hackathon called 'CodeRamp' on 24 Dec 2026..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex gap-4">
          {/* Hidden inputs */}
          <input type="file" accept=".csv" ref={scheduleRef} className="hidden" onChange={(e) => setScheduleFile(e.target.files?.[0] || null)} />
          <input type="file" accept=".csv" ref={participantRef} className="hidden" onChange={(e) => setParticipantFile(e.target.files?.[0] || null)} />

          <button
            onClick={() => scheduleRef.current?.click()}
            className={`flex items-center text-sm px-3 py-2 rounded-md border transition-colors ${scheduleFile ? 'border-[#00e5ff] text-[#00e5ff] bg-[#00e5ff]/10' : 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-400'}`}
          >
            <Calendar className="w-4 h-4 mr-2" />
            {scheduleFile ? scheduleFile.name : "Attach Schedule CSV"}
          </button>

          <button
            onClick={() => participantRef.current?.click()}
            className={`flex items-center text-sm px-3 py-2 rounded-md border transition-colors ${participantFile ? 'border-[#00e5ff] text-[#00e5ff] bg-[#00e5ff]/10' : 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-400'}`}
          >
            <Users className="w-4 h-4 mr-2" />
            {participantFile ? participantFile.name : "Attach Participants CSV"}
          </button>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!prompt || isSubmitting}
          className="bg-[#00e5ff] text-black hover:bg-[#00cce6] min-w-[120px]"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Orchestrate"}
        </Button>
      </div>
    </div>
  );
}
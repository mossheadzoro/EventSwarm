"use client";

import { useState, useEffect } from "react";
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCcw, 
  CalendarCheck2
} from "lucide-react";
import { Button } from "../ui/button";
import { socket } from "@/lib/socket";

export default function SchedulingWidget({ activeJob, onComplete }: any) {
  // --- STATE ---
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  
  // Schedule Data
  const [status, setStatus] = useState<"checking" | "conflict" | "clear">("checking");
  const [proposedDate, setProposedDate] = useState(activeJob?.event_date || "");
  const [proposedTime, setProposedTime] = useState("10:00 AM"); // Default or from DB
  const [conflictReason, setConflictReason] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // --- LISTEN FOR AI CALENDAR UPDATES ---
  useEffect(() => {
    // The backend emits this when it checks the calendar OR after a voice command
    socket.on("ai_suggestions", (data: any) => {
      if (data.type === "schedule_update") {
        setProposedDate(data.date || proposedDate);
        setProposedTime(data.time || proposedTime);
        
        if (data.conflict) {
          setStatus("conflict");
          setConflictReason(data.reason || "Time slot is unavailable.");
          setSuggestions(data.suggestions || []);
        } else {
          setStatus("clear");
          setConflictReason("");
          setSuggestions([]);
        }
        setIsProcessing(false);
      }
    });

    // Simulate initial calendar check when component mounts
    setIsProcessing(true);
    socket.emit("supervisor_command", {
      jobId: activeJob?._id,
      command: `Check calendar for event: ${activeJob?.event_name} on ${proposedDate}`
    });

    return () => { socket.off("ai_suggestions"); };
  }, [activeJob]);

  // --- MANUAL TIME SELECTION (Clicking a suggestion) ---
  const handleSelectTime = (newTime: string) => {
    setIsProcessing(true);
    // Tell the AI we want this time, make it check for conflicts again
    socket.emit("supervisor_command", {
      jobId: activeJob?._id,
      command: `Lock in the time for ${newTime}. Check for conflicts.`
    });
  };

  // --- APPROVE & LOCK SCHEDULE ---
  const handleApproveSchedule = async () => {
    setIsProcessing(true);
    try {
      // 1. Save to your local DB
      const res = await fetch("/api/voice/update-job", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: activeJob._id,
          event_date: proposedDate,
          // You would add an event_time field to your schema if you haven't!
        }),
      });

      if (res.ok) {
        // 2. Tell the Swarm we are done scheduling
        socket.emit("agent_action", {
          jobId: activeJob._id,
          action: "approve_schedule",
          payload: { date: proposedDate, time: proposedTime }
        });
        
        setIsApproved(true);
        setTimeout(() => { if (onComplete) onComplete(); }, 3000); // Move to next phase
      }
    } catch (err) {
      console.error("Approval error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#0f171e] border border-[#1e293b] rounded-2xl p-6 mt-6 space-y-6 shadow-2xl relative overflow-hidden">
      
      {/* Success Overlay */}
      {isApproved && (
        <div className="absolute inset-0 z-10 bg-[#0f171e]/90 backdrop-blur-sm flex flex-col items-center justify-center">
          <CalendarCheck2 className="w-16 h-16 text-green-500 mb-4" />
          <h3 className="text-xl font-bold text-white">Schedule Locked</h3>
          <p className="text-gray-400 text-sm mt-2">{proposedDate} at {proposedTime}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between text-white font-semibold">
        <div className="flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-orange-400" />
          AI Scheduler Agent
        </div>
        <div className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-1 rounded uppercase tracking-widest">
          Phase: Logistics
        </div>
      </div>

      {/* Status Box */}
      <div className={`p-5 rounded-xl border transition-colors duration-500 ${
        isProcessing ? "bg-[#020617] border-[#1e293b]" :
        status === "conflict" ? "bg-red-500/10 border-red-500/30" : 
        "bg-green-500/10 border-green-500/30"
      }`}>
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="mt-1">
            {isProcessing ? <RefreshCcw className="w-6 h-6 text-gray-400 animate-spin" /> :
             status === "conflict" ? <AlertTriangle className="w-6 h-6 text-red-400" /> :
             <CheckCircle2 className="w-6 h-6 text-green-400" />}
          </div>
          
          {/* Details */}
          <div className="flex-1">
            <h4 className={`text-lg font-bold ${
              isProcessing ? "text-gray-300" :
              status === "conflict" ? "text-red-400" : 
              "text-green-400"
            }`}>
              {isProcessing ? "Checking Calendar..." :
               status === "conflict" ? "Schedule Conflict Detected" : 
               "Time Slot Available"}
            </h4>
            
            <div className="mt-2 flex items-center gap-2 text-2xl text-white font-light tracking-wide">
              <Calendar className="w-5 h-5 text-gray-500" /> {proposedDate}
              <ArrowRight className="w-4 h-4 text-gray-600 mx-2" />
              <Clock className="w-5 h-5 text-gray-500" /> {proposedTime}
            </div>

            {status === "conflict" && !isProcessing && (
              <p className="text-sm text-red-400/80 mt-2 font-medium">
                Reason: {conflictReason}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* AI Alternative Suggestions (Only show if conflict) */}
      {status === "conflict" && !isProcessing && suggestions.length > 0 && (
        <div className="space-y-3">
          <p className="text-gray-400 text-xs uppercase tracking-tight">AI Suggested Alternatives</p>
          <div className="grid grid-cols-2 gap-3">
            {suggestions.map((time, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectTime(time)}
                className="py-3 px-4 rounded-xl border border-[#1e293b] bg-[#020617] text-gray-300 hover:border-orange-500/50 hover:bg-orange-500/10 transition-all text-sm font-medium flex justify-between items-center"
              >
                {time}
                <ArrowRight className="w-4 h-4 text-gray-600" />
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-500 text-center mt-2 italic">
            Or use the Voice Orb to request a specific emergency time.
          </p>
        </div>
      )}

      {/* Action Button */}
      <Button
        onClick={handleApproveSchedule}
        disabled={status === "conflict" || isProcessing}
        className={`w-full h-12 font-bold text-sm uppercase tracking-wider rounded-xl transition-all ${
          status === "conflict" 
            ? "bg-[#1e293b] text-gray-500 cursor-not-allowed border border-[#334155]" 
            : "bg-green-500 hover:bg-green-400 text-[#0a1017] shadow-[0_0_20px_rgba(34,197,94,0.3)]"
        }`}
      >
        {isProcessing ? "Verifying..." : 
         status === "conflict" ? "Cannot Schedule - Resolve Conflict" : 
         "Lock Schedule & Notify Comms"}
      </Button>
    </div>
  );
}
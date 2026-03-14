// components/dashboard/agent-node.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { AgentNodeProps } from "../../app/type/swarm";

// Rich activity messages per agent title
const ACTIVITY_MESSAGES: Record<string, string[]> = {
  "User":               ["📤 Sending command...", "💬 Talking to supervisor...", "✅ Input received!"],
  "Supervisor":         ["🧠 Analyzing task scope...", "📋 Delegating to agents...", "🔍 Reviewing strategy...", "⚡ Coordinating swarm..."],
  "Content Strategist": ["✍️ Drafting captions...", "📸 Crafting social posts...", "🎯 Targeting audience...", "🔥 Writing engaging copy..."],
  "Art Director":       ["🎨 Generating visuals...", "🖼️ Composing layout...", "✨ Polishing design...", "🖌️ Applying brand palette..."],
  "Scheduler":          ["📅 Building timeline...", "⏰ Allocating time slots...", "🗓️ Syncing calendar...", "🚀 Finalizing schedule..."],
  "Communications":     ["✉️ Drafting email...", "📣 Personalizing message...", "📨 Preparing bulk send...", "💌 Polishing subject line..."],
};

const DEFAULT_MESSAGES = ["🤖 Processing request...", "⚙️ Working hard...", "🧮 Crunching data...", "💡 Thinking big..."];

export const AgentNode = ({ icon: Icon, title, data, glow, isRoot, phaseKey, currentPhase }: AgentNodeProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [taskHistory, setTaskHistory] = useState<string[]>([]);
  const [activityIdx, setActivityIdx] = useState(0);
  const cycleRef = useRef<NodeJS.Timeout | null>(null);

  // Real data task history
  useEffect(() => {
    if (data.task && data.task !== "Idle" && data.task !== "") {
      setTaskHistory((prev) => {
        if (prev[prev.length - 1] === data.task) return prev;
        return [...prev, data.task];
      });
    }
  }, [data.task]);

  // A node is "active" if:
  // 1. The current phase matches this node's key (persistent, whole-phase duration), OR
  // 2. The supervisor node is always active as long as any phase is running, OR
  // 3. The node is mid-run per its own status
  const PHASE_TO_KEY: Record<string, string> = {
    "content_strategist": "content",
    "content": "content",
    "art_director": "art",
    "art": "art",
    "scheduler": "scheduler",
    "communications": "comms",
    "comms": "comms",
    "supervisor": "supervisor",
  };
  const activePhaseKey = currentPhase ? PHASE_TO_KEY[currentPhase] : null;
  const isActive =
    glow ||
    data.status === "running" ||
    (phaseKey === "supervisor" && currentPhase !== null) || // supervisor always active during swarm
    activePhaseKey === phaseKey;

  // Cycle activity messages continuously while active
  useEffect(() => {
    if (isActive) {
      cycleRef.current = setInterval(() => {
        setActivityIdx((i) => i + 1);
      }, 1800);
    } else {
      if (cycleRef.current) clearInterval(cycleRef.current);
    }
    return () => { if (cycleRef.current) clearInterval(cycleRef.current); };
  }, [isActive]);

  const messages = ACTIVITY_MESSAGES[title] || DEFAULT_MESSAGES;
  const currentActivity = messages[activityIdx % messages.length];

  const isWaiting =
    data.status?.toLowerCase().includes("waiting") ||
    data.status?.toLowerCase().includes("approval") ||
    data.task?.toLowerCase().includes("approval");

  return (
    <div
      className={`flex flex-col items-center w-28 sm:w-32 relative group transition-all ${isHovered ? "z-50" : "z-10"}`}
      onMouseEnter={() => { setIsHovered(true); setActivityIdx(0); }}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Arrival ring animation */}
      {glow && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0.6 }}
          animate={{ scale: 2.8, opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute w-16 h-16 rounded-full border border-green-400 z-0 pointer-events-none"
        />
      )}

      {/* SOLID NODE UI */}
      <motion.div
        animate={
          glow
            ? { boxShadow: ["0 0 10px #22c55e", "0 0 30px #22c55e", "0 0 10px #22c55e"] }
            : data.status === "running"
            ? { boxShadow: ["0 0 15px #00e5ff", "0 0 35px #00e5ff", "0 0 15px #00e5ff"] }
            : isWaiting
            ? { boxShadow: ["0 0 15px #facc15", "0 0 30px #facc15", "0 0 15px #facc15"] }
            : {}
        }
        transition={{ duration: 1.2, repeat: Infinity }}
        className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-4 z-10 transition-colors duration-300 ${
          data.status === "running"
            ? "border-[#00e5ff] bg-[#00e5ff]"
            : isWaiting
            ? "border-yellow-400 bg-yellow-400/10"
            : "border-[#334155] bg-[#1e293b]"
        }`}
      >
        <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${data.status === "running" ? "text-black" : isWaiting ? "text-yellow-400" : "text-white"}`} />

        {isWaiting ? (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-[#0a1017] shadow-[0_0_10px_rgba(250,204,21,0.8)] animate-pulse z-20" />
        ) : (
          <Zap className={`absolute top-2 right-2 w-4 h-4 ${data.status === "running" ? "text-black" : "text-gray-500"}`} />
        )}

        {isRoot && <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-pulse pointer-events-none" />}
      </motion.div>

      {/* Labels */}
      <div className="flex flex-col items-center text-center mt-3 h-12 sm:h-15 z-10">
        <span className="text-white text-sm sm:text-base font-semibold whitespace-nowrap px-1 rounded-md">{title}</span>
        <span className={`text-[9px] sm:text-[10px] max-w-28 sm:max-w-32.5 line-clamp-1 bg-[#0a1017] px-2 mt-1 rounded-sm ${isWaiting ? "text-yellow-400" : "text-gray-400"}`}>
          {isWaiting ? "Waiting for Approval..." : data.task || "idle"}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 rounded mt-4 overflow-hidden z-10">
        <motion.div
          className={`h-full ${isWaiting ? "bg-yellow-400" : "bg-[#00e5ff]"}`}
          animate={{ width: `${data.progress}%` }}
          transition={{ duration: 0.2 }}
        />
      </div>

      {/* HOVER PROCESS TOOLTIP */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: -15, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute left-[75%] bottom-[50%] w-64 p-4 rounded-xl border border-[#00e5ff]/30 bg-[#0a1017]/95 backdrop-blur-xl shadow-[0_0_30px_rgba(0,229,255,0.15)] z-50 pointer-events-none origin-bottom-left"
          >
            <div className="flex items-center gap-2 border-b border-[#1e293b] pb-2 mb-3">
              <Icon className={`w-4 h-4 ${isWaiting ? "text-yellow-400" : "text-[#00e5ff]"}`} />
              <span className="text-white text-sm font-semibold tracking-wide">{title} Log</span>
            </div>

            <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-1">
              {isActive ? (
                <>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activityIdx}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center gap-2"
                    >
                      <Loader2 className="w-4 h-4 text-[#00e5ff] animate-spin mt-px shrink-0" />
                      <span className="text-xs text-white font-medium leading-relaxed">{currentActivity}</span>
                    </motion.div>
                  </AnimatePresence>
                  {taskHistory.slice(-2).map((t, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 mt-px shrink-0" />
                      <span className="text-xs text-gray-500 line-through leading-relaxed">{t}</span>
                    </div>
                  ))}
                </>
              ) : taskHistory.length === 0 ? (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500 italic">Waiting to be activated...</span>
                  <span className="text-[10px] text-gray-600">Start the swarm to see activity here.</span>
                </div>
              ) : (
                taskHistory.map((t, i) => {
                  const isLast = i === taskHistory.length - 1;
                  const isCurrent = isLast && data.status === "running";
                  return (
                    <div key={i} className="flex items-start gap-2">
                      {isWaiting && isLast ? (
                        <AlertCircle className="w-4 h-4 text-yellow-400 mt-px shrink-0 animate-pulse" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-[#00e5ff] animate-spin mt-px shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-green-400 mt-px shrink-0" />
                      )}
                      <span className={`text-xs leading-relaxed ${
                        isCurrent ? "text-white font-medium"
                        : isWaiting && isLast ? "text-yellow-400 font-medium"
                        : "text-gray-500 line-through"
                      }`}>
                        {isWaiting && isLast ? "Waiting for Approval" : t}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
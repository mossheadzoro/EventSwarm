// components/dashboard/agent-node.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { AgentNodeProps } from "../../app/type/swarm";

export const AgentNode = ({ icon: Icon, title, data, glow, isRoot }: AgentNodeProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [taskHistory, setTaskHistory] = useState<string[]>([]);

  // Automatically build a history of tasks as they come in from the socket
  useEffect(() => {
    if (data.task && data.task !== "Idle" && data.task !== "") {
      setTaskHistory((prev) => {
        if (prev[prev.length - 1] === data.task) return prev;
        return [...prev, data.task];
      });
    }
  }, [data.task]);

  // Detect if the agent is waiting for user approval
  const isWaiting = 
    data.status?.toLowerCase().includes("waiting") || 
    data.status?.toLowerCase().includes("approval") ||
    data.task?.toLowerCase().includes("approval");

  return (
    <div 
      className={`flex flex-col items-center w-40 relative group transition-all ${isHovered ? "z-50" : "z-10"}`}
      onMouseEnter={() => setIsHovered(true)}
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
        className={`relative w-18 h-18 rounded-full flex items-center justify-center border-4 z-10 transition-colors duration-300 ${
          data.status === "running"
            ? "border-[#00e5ff] bg-[#00e5ff]"
            : isWaiting
            ? "border-yellow-400 bg-yellow-400/10"
            : "border-[#334155] bg-[#1e293b]"
        }`}
      >
        <Icon className={`w-8 h-8 ${data.status === "running" ? "text-black" : isWaiting ? "text-yellow-400" : "text-white"}`} />
        
        {isWaiting ? (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-[#0a1017] shadow-[0_0_10px_rgba(250,204,21,0.8)] animate-pulse z-20" />
        ) : (
          <Zap className={`absolute top-2 right-2 w-4 h-4 ${data.status === "running" ? "text-black" : "text-gray-500"}`} />
        )}
        
        {isRoot && <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-pulse pointer-events-none" />}
      </motion.div>

      {/* Labels */}
      <div className="flex flex-col items-center text-center mt-3 h-15 z-10">
        <span className="text-white text-2xl font-semibold whitespace-nowrap px-2 rounded-md">{title}</span>
        <span className={`text-[10px] max-w-32.5 line-clamp-1 bg-[#0a1017] px-2 mt-1 rounded-sm ${isWaiting ? "text-yellow-400" : "text-gray-400"}`}>
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
              <span className="text-white text-xl font-semibold tracking-wide">{title} Log</span>
            </div>

            <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-1">
              {taskHistory.length === 0 ? (
                <span className="text-xs text-gray-500 italic">No activity yet...</span>
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
                      <span 
                        className={`text-xs leading-relaxed ${
                          isCurrent 
                            ? 'text-white font-medium' 
                            : isWaiting && isLast 
                            ? 'text-yellow-400 font-medium' 
                            : 'text-gray-500 line-through'
                        }`}
                      >
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
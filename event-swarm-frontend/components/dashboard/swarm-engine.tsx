
"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, Mail, Calendar, PenTool, Brain, Zap } from "lucide-react";
import { socket } from "@/lib/socket";
import { FlowLayer } from "./flow-animation";
import { AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
type AgentState = {
  status: string;
  progress: number;
  task: string;
};

type Packet = {
  id: string;
  from: string;
  to: string;
};

// const AgentNode = ({ icon: Icon, title, data, glow, isRoot }: any) => {
//   return (
//     <div className="flex flex-col items-center z-10 w-40 relative group">
//       {glow && (
//         <motion.div
//           initial={{ scale: 0.8, opacity: 0.6 }}
//           animate={{ scale: 2.8, opacity: 0 }}
//           transition={{ duration: 0.8 }}
//           className="absolute w-16 h-16 rounded-full border border-green-400 z-0"
//         />
//       )}

//       {/* SOLID NODE UI: Removed transparency */}
//       <motion.div
//         animate={
//           glow
//             ? { boxShadow: ["0 0 10px #22c55e", "0 0 30px #22c55e", "0 0 10px #22c55e"] }
//             : data.status === "running"
//             ? { boxShadow: ["0 0 15px #00e5ff", "0 0 35px #00e5ff", "0 0 15px #00e5ff"] }
//             : {}
//         }
//         transition={{ duration: 1.2, repeat: glow ? 1 : Infinity }}
//         className={`relative w-24 h-24 rounded-full flex items-center justify-center border-4 z-10 ${
//           data.status === "running"
//             ? "border-[#00e5ff] bg-[#00e5ff]"
//             : "border-[#334155] bg-[#1e293b]"
//         }`}
//       >
//         <Icon className={`w-8 h-8 ${data.status === "running" ? "text-black" : "text-white"}`} />
        
//         <Zap className={`absolute top-2 right-2 w-4 h-4 ${data.status === "running" ? "text-black" : "text-gray-500"}`} />
        
//         {isRoot && <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-pulse" />}
//       </motion.div>

//       <div className="flex flex-col items-center text-center mt-3 h-10 z-10">
//         <span className="text-white text-sm font-semibold whitespace-nowrap bg-[#0a1017] px-2 rounded-md">{title}</span>
//         <span className="text-[10px] text-gray-400 max-w-32.5 line-clamp-1 bg-[#0a1017] px-2 mt-1 rounded-sm">{data.task || "idle"}</span>
//       </div>

//       <div className="w-full h-1 bg-[#1e293b] rounded mt-1 overflow-hidden z-10">
//         <motion.div
//           className="h-full bg-[#00e5ff]"
//           animate={{ width: `${data.progress}%` }}
//           transition={{ duration: 0.2 }}
//         />
//       </div>
//     </div>
//   );
// };
const AgentNode = ({ icon: Icon, title, data, glow, isRoot }: any) => {
  const [isHovered, setIsHovered] = useState(false);
  const [taskHistory, setTaskHistory] = useState<string[]>([]);

  // Automatically build a history of tasks as they come in from the socket
  useEffect(() => {
    if (data.task && data.task !== "Idle" && data.task !== "") {
      setTaskHistory((prev) => {
        // Only add if it's a new task
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
      // FIX: Dynamically jump to z-50 on hover so it never hides behind other nodes
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
        className={`relative w-24 h-24 rounded-full flex items-center justify-center border-4 z-10 transition-colors duration-300 ${
          data.status === "running"
            ? "border-[#00e5ff] bg-[#00e5ff]"
            : isWaiting
            ? "border-yellow-400 bg-yellow-400/10"
            : "border-[#334155] bg-[#1e293b]"
        }`}
      >
        <Icon className={`w-8 h-8 ${data.status === "running" ? "text-black" : isWaiting ? "text-yellow-400" : "text-white"}`} />
        
        {/* Top Right Notification Dot */}
        {isWaiting ? (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-[#0a1017] shadow-[0_0_10px_rgba(250,204,21,0.8)] animate-pulse z-20" />
        ) : (
          <Zap className={`absolute top-2 right-2 w-4 h-4 ${data.status === "running" ? "text-black" : "text-gray-500"}`} />
        )}
        
        {isRoot && <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-pulse pointer-events-none" />}
      </motion.div>

      {/* Labels */}
      <div className="flex flex-col items-center text-center mt-3 h-15 z-10">
        <span className="text-white text-2xl font-semibold whitespace-nowrap  px-2  rounded-md">{title}</span>
        <span className={`text-[10px] max-w-32.5 line-clamp-1 bg-[#0a1017] px-2 mt-1 rounded-sm ${isWaiting ? "text-yellow-400" : "text-gray-400"}`}>
          {isWaiting ? "Waiting for Approval..." : data.task || "idle"}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1  rounded mt-4 overflow-hidden z-10">
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
            // FIX: Slide diagonally outward from the bottom-left of the card
            initial={{ opacity: 0, x: -15, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            // FIX: Positioned to the Top Right of the agent node (left-[80%] bottom-[60%])
            className="absolute left-[75%] bottom-[50%] w-64 p-4 rounded-xl border border-[#00e5ff]/30 bg-[#0a1017]/95 backdrop-blur-xl shadow-[0_0_30px_rgba(0,229,255,0.15)] z-50 pointer-events-none origin-bottom-left"
          >
            {/* Tooltip Header */}
            <div className="flex items-center gap-2 border-b border-[#1e293b] pb-2 mb-3">
              <Icon className={`w-4 h-4 ${isWaiting ? "text-yellow-400" : "text-[#00e5ff]"}`} />
              <span className="text-white text-xl font-semibold tracking-wide">{title} Log</span>
            </div>

            {/* Task List */}
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
export function SwarmEngine({ jobs, activeJob, setActiveJob }: any) {
  const containerRef = useRef<any>(null);

  const nodeRefs: any = {
    voice: useRef(null),
    supervisor: useRef(null),
    content: useRef(null),
    scheduler: useRef(null),
    comms: useRef(null),
  };

  const [agents, setAgents] = useState<any>({
    voice: { progress: 0, status: "idle", task: "" },
    supervisor: { progress: 0, status: "idle", task: "" },
    content: { progress: 0, status: "idle", task: "" },
    scheduler: { progress: 0, status: "idle", task: "" },
    comms: { progress: 0, status: "idle", task: "" },
  });

  const [packets, setPackets] = useState<Packet[]>([]);
  const [receiverGlow, setReceiverGlow] = useState<string | null>(null);

  useEffect(() => {
    socket.emit("join_job", "job-1");

    socket.on("agent_progress", (data: any) => {
      setAgents((prev: any) => ({
        ...prev,
        [data.agent]: {
          progress: data.progress,
          task: data.task,
          status: data.status
        }
      }));
    });

    socket.on("agent_flow", (data: any) => {
      // Create a truly unique ID by combining the timestamp with a random string
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      setPackets((p) => [...p, { id, ...data }]);

      setTimeout(() => {
        setPackets((p) => p.filter((x) => x.id !== id));
        setReceiverGlow(data.to);
      }, 1200);

      setTimeout(() => setReceiverGlow(null), 1800);
    });

    return () => {
      socket.off("agent_progress");
      socket.off("agent_flow");
    };
  }, []);

  return (
    <div className="mb-6 w-full max-w-8xl mx-auto px-4">
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {jobs?.map((job: any) => (
          <button
            key={job._id}
            onClick={() => setActiveJob(job)}
            className={`px-4 py-2 rounded-lg border text-sm whitespace-nowrap ${
              activeJob?._id === job._id
                ? "bg-[#00e5ff] text-black border-[#00e5ff]"
                : "bg-[#0f171e] border-[#1e293b] text-gray-400"
            }`}
          >
            {job.title}
          </button>
        ))}
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">Active Swarm Engine</h1>
        <p className="text-gray-400 text-sm mt-1">
          Real-time AI orchestration for
          <span className="text-[#00e5ff] ml-1 font-medium">
            {activeJob?.title || "No Active Job"}
          </span>
        </p>
      </div>

      <div
        ref={containerRef}
        className="relative bg-[#0a1017] mt-6 rounded-2xl pt-16 pb-32 px-10 min-h-150 overflow-hidden border border-[#1e293b] bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.03)_0,transparent_70%)]"
      >
        <FlowLayer packets={packets} nodeRefs={nodeRefs} containerRef={containerRef} />

        <div className="relative z-10 px-24 flex flex-col items-center space-y-12">
          
          {/* LEVEL 1: ROOT */}
          <div ref={nodeRefs.voice} >
            <AgentNode icon={Mic} title="Voice Parser" data={agents.voice} glow={receiverGlow === "voice"} isRoot={true} />
          </div>

          {/* LEVEL 2: PARENT */}
          <div ref={nodeRefs.supervisor}>
            <AgentNode icon={Brain} title="Supervisor" data={agents.supervisor} glow={receiverGlow === "supervisor"} />
          </div>

          {/* LEVEL 3: CHILDREN (Downward Arrow Formation) */}
          <div className="flex justify-between w-full px-2 md:px-12 max-w-5xl mx-auto pt-8">
            {/* Left Node (Shifted Up) */}
            <div ref={nodeRefs.content} className="flex-1 flex justify-center -mt-24">
              <AgentNode icon={PenTool} title="Content Strategist" data={agents.content} glow={receiverGlow === "content"} />
            </div>
            
            {/* Center Node (Shifted Down) */}
            <div ref={nodeRefs.scheduler} className="flex-1 flex justify-center mt-16">
              <AgentNode icon={Calendar} title="Scheduler" data={agents.scheduler} glow={receiverGlow === "scheduler"} />
            </div>
            
            {/* Right Node (Shifted Up) */}
            <div ref={nodeRefs.comms} className="flex-1 flex justify-center -mt-24">
              <AgentNode icon={Mail} title="Email Agent" data={agents.comms} glow={receiverGlow === "comms"} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
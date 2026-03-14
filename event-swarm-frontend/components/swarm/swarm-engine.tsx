
// "use client";

// import React, { useEffect, useRef, useState } from "react";
// import { Mic, Mail, Calendar, PenTool, Brain, Play } from "lucide-react";
// import { socket } from "@/lib/socket";
// import { FlowLayer } from "./flow-animation";
// import { AgentNode } from "./agent-node";
// import { Packet } from "../../app/type/swarm";
// import { Button } from "../ui/button";
// import { JobSelector } from "./job-selector";
// import { ExecuteModal } from "./execute-modal";
// import SocialWidget from "../dashboard/social-media-widget"; 
// import { FloatingVoice } from "../dashboard/voice-orb";

// const decodeBuffer = (dataArray: number[] | undefined) => {
//   if (!dataArray || !Array.isArray(dataArray)) return "";
//   return new TextDecoder("utf-8").decode(new Uint8Array(dataArray));
// };

// export function SwarmEngine({ jobs, setJobs, activeJob, setActiveJob }: any) {
//   const containerRef = useRef<any>(null);
//   const nodeRefs: any = {
//     voice: useRef(null),
//     supervisor: useRef(null),
//     content: useRef(null),
//     scheduler: useRef(null),
//     comms: useRef(null),
//   };

//   const [agents, setAgents] = useState<any>({
//     voice: { progress: 0, status: "idle", task: "" },
//     supervisor: { progress: 0, status: "idle", task: "" },
//     content: { progress: 0, status: "idle", task: "" },
//     scheduler: { progress: 0, status: "idle", task: "" },
//     comms: { progress: 0, status: "idle", task: "" },
//   });

//   const [packets, setPackets] = useState<Packet[]>([]);
//   const [receiverGlow, setReceiverGlow] = useState<string | null>(null);
//   const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  
//   // NEW STATE: Captures the initial AI greeting
//   const [initialAiMessage, setInitialAiMessage] = useState<string | null>(null);
  
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isUpdating, setIsUpdating] = useState(false);
//   const [formData, setFormData] = useState({
//     event_name: "", event_date: "", event_type: "", schedule_csv: "", participant_csv: "",
//   });

//   useEffect(() => {
//     socket.emit("join_job", activeJob?._id || "default_room");

//     socket.on("agent_progress", (data: any) => {
//       setAgents((prev: any) => ({
//         ...prev,
//         [data.agent]: { progress: data.progress, task: data.task, status: data.status },
//       }));
//     });

//     socket.on("agent_flow", (data: any) => {
//       const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
//       setPackets((p) => [...p, { id, ...data }]);
//       setTimeout(() => {
//         setPackets((p) => p.filter((x) => x.id !== id));
//         setReceiverGlow(data.to);
//       }, 1200);
//       setTimeout(() => setReceiverGlow(null), 1800);
//     });

//     socket.on("phase_update", (data: any) => {
//       setCurrentPhase(data.phase);
//     });

//     return () => {
//       socket.off("agent_progress");
//       socket.off("agent_flow");
//       socket.off("phase_update");
//     };
//   }, [activeJob]);

//   // Phase looping animation (Updated to match content_strategist phase)
//   useEffect(() => {
//     let hypeInterval: NodeJS.Timeout;
//     if (currentPhase === "content_strategist") {
//       hypeInterval = setInterval(() => {
//         const id = `hype-${Date.now()}`;
//         setPackets((p) => [...p, { id, from: "supervisor", to: "content" }]);
//         setTimeout(() => {
//           setPackets((p) => p.filter((x) => x.id !== id));
//           setReceiverGlow("content");
//         }, 1200);
//         setTimeout(() => setReceiverGlow(null), 1800);
//       }, 2500);
//     }
//     return () => clearInterval(hypeInterval);
//   }, [currentPhase]);

//   const handleOpenModal = () => {
//     if (!activeJob) return;
//     setFormData({
//       event_name: activeJob.event_name || "",
//       event_date: activeJob.event_date || "",
//       event_type: activeJob.event_type || "",
//       schedule_csv: decodeBuffer(activeJob.schedule_csv?.data),
//       participant_csv: decodeBuffer(activeJob.participant_csv?.data),
//     });
//     setIsModalOpen(true);
//   };

//   const handleConfirmExecute = async () => {
//     setIsUpdating(true);
//     try {
//       // 1. Update your JS database API
//       const updateRes = await fetch("/api/voice/update-job", {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ job_id: activeJob._id, ...formData }),
//       });
//       if (!updateRes.ok) throw new Error("Failed to update job");
//       const { data: updatedJob } = await updateRes.json();
      
//       if (updatedJob) {
//         setActiveJob(updatedJob);
//         if (setJobs) setJobs((prev: any[]) => prev.map((job) => (job._id === updatedJob._id ? updatedJob : job)));
//       }

//       // 2. Build Form Data for Python Backend Setup
//       const fd = new FormData();
//       fd.append("event_name", formData.event_name);
//       fd.append("event_date", formData.event_date); 
//       fd.append("event_type", formData.event_type); 
//       fd.append("thread_id", `thread_${activeJob._id}`);

//       if (formData.schedule_csv?.trim()) {
//         const scheduleBlob = new Blob([formData.schedule_csv], { type: "text/csv" });
//         fd.append("schedule_csv", scheduleBlob, "schedule.csv");
//       }
      
//       if (formData.participant_csv?.trim()) {
//         const participantBlob = new Blob([formData.participant_csv], { type: "text/csv" });
//         fd.append("participant_csv", participantBlob, "participants.csv");
//       }

//       // 3. Hit the setup route in your Next.js backend
//       const aiRes = await fetch("/api/agent/setup", { method: "POST", body: fd });
      
//       if (aiRes.ok) {
//         const aiData = await aiRes.json();
//         setCurrentPhase(aiData.phase || "supervisor"); 
        
//         // Extract the first message from the API response and save it to state
//         const firstAiMsg = aiData.messages?.find((m: any) => m.role === "AIMessage");
//         if (firstAiMsg) {
//           setInitialAiMessage(firstAiMsg.content);
//         }

//         setReceiverGlow("supervisor");
//         setTimeout(() => setReceiverGlow(null), 2000);
//       }
//       setIsModalOpen(false);
//     } catch (error) {
//       console.error("Execution error:", error);
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   return (
//     <div className="mb-6 w-5xl -mt-5 mx-auto px-4 flex flex-col relative">
//       <JobSelector jobs={jobs} activeJob={activeJob} setActiveJob={setActiveJob} />

//       <div className="flex flex-row gap-12">
//         <h1 className="text-3xl font-bold text-white">Active Swarm Engine</h1>
//         <p className="text-gray-400 text-xl mt-1">
//           Real-time AI orchestration for <span className="text-[#00e5ff] ml-1 font-medium">{activeJob?.event_name || "No Active Job"}</span>
//         </p>
//       </div>

//       <div ref={containerRef} className="relative bg-[#0a1017] mt-6 rounded-2xl pt-16 pb-32 px-10 min-h-150 overflow-hidden border border-[#1e293b] bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.03)_0,transparent_70%)]">
        
//         <FlowLayer packets={packets} nodeRefs={nodeRefs} containerRef={containerRef} />
        
//         {/* Voice Orb (Now receives initialAiMessage to auto-open) */}
//         <FloatingVoice activeJob={activeJob} initialAiMessage={initialAiMessage} />
        
//         <div className="relative z-10 px-24 flex flex-col items-center space-y-12">
//           <Button
//             onClick={handleOpenModal}
//             // Disables the button once the swarm enters any phase
//             disabled={!activeJob || currentPhase !== null}
//             className="group relative flex items-center justify-center gap-2 w-60 h-12 -mt-10 -ml-4 bg-green-500 hover:bg-green-400 text-[#0a1017] font-bold text-lg uppercase tracking-wider rounded-lg transition-all"
//           >
//             <Play className="w-5 h-5 fill-current" />
//             {currentPhase ? "Swarm Active" : "Execute Swarm"}
//           </Button>
//           <div ref={nodeRefs.voice}><AgentNode icon={Mic} title="Voice Parser" data={agents.voice} glow={receiverGlow === "voice"} isRoot={true} /></div>
//           <div ref={nodeRefs.supervisor}><AgentNode icon={Brain} title="Supervisor" data={agents.supervisor} glow={receiverGlow === "supervisor"} /></div>
//           <div className="flex justify-between w-full px-2 md:px-12 max-w-5xl mx-auto pt-8">
//             <div ref={nodeRefs.content} className="flex-1 flex justify-center -mt-24"><AgentNode icon={PenTool} title="Content Strategist" data={agents.content} glow={receiverGlow === "content"} /></div>
//             <div ref={nodeRefs.scheduler} className="flex-1 flex justify-center mt-16"><AgentNode icon={Calendar} title="Scheduler" data={agents.scheduler} glow={receiverGlow === "scheduler"} /></div>
//             <div ref={nodeRefs.comms} className="flex-1 flex justify-center -mt-24"><AgentNode icon={Mail} title="Email Agent" data={agents.comms} glow={receiverGlow === "comms"} /></div>
//           </div>
//         </div>
//       </div>

//       {/* Automatically show the Social Widget when content_strategist is active */}
//       {currentPhase === "content_strategist" && (
//         <SocialWidget activeJob={activeJob} onComplete={() => setCurrentPhase("scheduler")} />
//       )}

//       <ExecuteModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} formData={formData} setFormData={setFormData} onConfirm={handleConfirmExecute} isUpdating={isUpdating} />
//     </div>
//   );
// }

"use client";

import React, { useEffect, useRef, useState } from "react";
import { Mic, Mail, Calendar, PenTool, Brain, Play } from "lucide-react";
import { socket } from "@/lib/socket";
import { FlowLayer } from "./flow-animation";
import { AgentNode } from "./agent-node";
import { Packet } from "../../app/type/swarm";
import { Button } from "../ui/button";
import { JobSelector } from "./job-selector";
import { ExecuteModal } from "./execute-modal";
import SocialWidget from "../dashboard/social-media-widget";
import { FloatingVoice } from "../dashboard/voice-orb";

const decodeBuffer = (dataArray: number[] | undefined) => {
  if (!dataArray || !Array.isArray(dataArray)) return "";
  return new TextDecoder("utf-8").decode(new Uint8Array(dataArray));
};

export function SwarmEngine({ jobs, setJobs, activeJob, setActiveJob }: any) {
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
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);

  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [formData, setFormData] = useState({
    event_name: "",
    event_date: "",
    event_type: "",
    schedule_csv: "",
    participant_csv: "",
  });

  /* ---------------- SOCKET EVENTS ---------------- */

  useEffect(() => {
    socket.emit("join_job", activeJob?._id || "default_room");

    socket.on("agent_progress", (data: any) => {
      setAgents((prev: any) => ({
        ...prev,
        [data.agent]: {
          progress: data.progress,
          task: data.task,
          status: data.status,
        },
      }));
    });

    socket.on("phase_update", (data: any) => {
      setCurrentPhase(data.phase);
    });

    return () => {
      socket.off("agent_progress");
      socket.off("phase_update");
    };
  }, [activeJob]);

  /* ---------------- MODAL HANDLER ---------------- */

  const handleOpenModal = () => {
    if (!activeJob) return;

    setFormData({
      event_name: activeJob.event_name || "",
      event_date: activeJob.event_date || "",
      event_type: activeJob.event_type || "",
      schedule_csv: decodeBuffer(activeJob.schedule_csv?.data),
      participant_csv: decodeBuffer(activeJob.participant_csv?.data),
    });

    setIsModalOpen(true);
  };

  /* ---------------- EXECUTE SWARM ---------------- */

  const handleConfirmExecute = async () => {
    setIsUpdating(true);

    try {
      const threadId = `thread_${Date.now()}`;
      setActiveThreadId(threadId);

      const fd = new FormData();
      fd.append("event_name", formData.event_name);
      fd.append("event_date", formData.event_date);
      fd.append("event_type", formData.event_type);
      fd.append("thread_id", threadId);

      if (formData.schedule_csv.trim()) {
        fd.append(
          "schedule_csv",
          new Blob([formData.schedule_csv], { type: "text/csv" }),
          "schedule.csv"
        );
      }

      if (formData.participant_csv.trim()) {
        fd.append(
          "participant_csv",
          new Blob([formData.participant_csv], { type: "text/csv" }),
          "participants.csv"
        );
      }

      const aiRes = await fetch("/api/agent/setup", {
        method: "POST",
        body: fd,
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        setCurrentPhase(aiData.phase);
        setInitialMessages(aiData.messages || []);
        
        setReceiverGlow("supervisor");
        setTimeout(() => setReceiverGlow(null), 2000);
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="mb-6 w-5xl -mt-5 mx-auto px-4 flex flex-col relative">
      <JobSelector jobs={jobs} activeJob={activeJob} setActiveJob={setActiveJob} />

      <div className="flex flex-row gap-12">
        <h1 className="text-3xl font-bold text-white">Active Swarm Engine</h1>
        <p className="text-gray-400 text-xl mt-1">
          Real-time AI orchestration for
          <span className="text-[#00e5ff] ml-1 font-medium">
            {activeJob?.event_name || "No Active Job"}
          </span>
        </p>
      </div>

      <div
        ref={containerRef}
        className="relative bg-[#0a1017] mt-6 rounded-2xl pt-16 pb-32 px-10 min-h-150 overflow-hidden border border-[#1e293b]"
      >
        <FlowLayer packets={packets} nodeRefs={nodeRefs} containerRef={containerRef} />

        <FloatingVoice
          activeJob={activeJob}
          initialAiMessage={initialMessages}
          threadId={activeThreadId}
        />

        <div className="relative z-10 px-24 flex flex-col items-center space-y-12">
          <Button
            onClick={handleOpenModal}
            disabled={!activeJob || currentPhase !== null}
            className="w-60 h-12 bg-green-500 hover:bg-green-400 text-[#0a1017] font-bold"
          >
            <Play className="w-5 h-5 mr-2" />
            {currentPhase ? "Swarm Active" : "Execute Swarm"}
          </Button>

          <div ref={nodeRefs.voice}>
            <AgentNode icon={Mic} title="Voice Parser" data={agents.voice} glow={false} />
          </div>

          <div ref={nodeRefs.supervisor}>
            <AgentNode icon={Brain} title="Supervisor" data={agents.supervisor} glow={false} />
          </div>

          <div className="flex justify-between w-full max-w-5xl mx-auto pt-8">
            <div ref={nodeRefs.content}>
              <AgentNode icon={PenTool} title="Content Strategist" data={agents.content} glow={false} />
            </div>

            <div ref={nodeRefs.scheduler}>
              <AgentNode icon={Calendar} title="Scheduler" data={agents.scheduler} glow={false} />
            </div>

            <div ref={nodeRefs.comms}>
              <AgentNode icon={Mail} title="Email Agent" data={agents.comms} glow={false} />
            </div>
          </div>
        </div>
      </div>

      {currentPhase === "content_strategist" && (
        <SocialWidget
          activeJob={activeJob}
          onComplete={() => setCurrentPhase("scheduler")}
        />
      )}

      <ExecuteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formData={formData}
        setFormData={setFormData}
        onConfirm={handleConfirmExecute}
        isUpdating={isUpdating}
      />
    </div>
  );
}
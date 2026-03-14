
"use client";

import React, { useEffect, useRef, useState } from "react";
import { User, Mail, Calendar, PenTool, Brain, Play, Palette } from "lucide-react";
import { socket } from "@/lib/socket";
import { FlowLayer } from "./flow-animation";
import { AgentNode } from "./agent-node";
import { Packet } from "../../app/type/swarm";
import { Button } from "../ui/button";
import { JobSelector } from "./job-selector";
import { ExecuteModal } from "./execute-modal";
import { FloatingVoice } from "../dashboard/voice-orb";

const decodeBuffer = (dataArray: number[] | undefined) => {
  if (!dataArray || !Array.isArray(dataArray)) return "";
  return new TextDecoder("utf-8").decode(new Uint8Array(dataArray));
};

export function SwarmEngine({ jobs, setJobs, activeJob, setActiveJob, onThreadCreated }: any) {
  const containerRef = useRef<any>(null);

  const nodeRefs: any = {
    voice: useRef(null),
    supervisor: useRef(null),
    content: useRef(null),
    art: useRef(null), 
    scheduler: useRef(null),
    comms: useRef(null),
  };

  const [agents, setAgents] = useState<any>({
    voice: { progress: 0, status: "idle", task: "" },
    supervisor: { progress: 0, status: "idle", task: "" },
    content: { progress: 0, status: "idle", task: "" },
    art: { progress: 0, status: "idle", task: "" }, 
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

  /* ---------------- CATCH PHASE UPDATES FROM CHAT ORB ---------------- */
  // ---> THIS IS THE NEW FIX <---
  // It listens to the API payload dispatched by FloatingVoice 
  // and instantly switches the phase without a refresh.
  useEffect(() => {
    const handleChatUpdate = (e: any) => {
      const payload = e.detail;
      if (payload && payload.phase) {
        setCurrentPhase(payload.phase);
      }
    };

    window.addEventListener("ai_chat_update", handleChatUpdate);
    return () => window.removeEventListener("ai_chat_update", handleChatUpdate);
  }, []);

  /* ---------------- DYNAMIC FLOW ANIMATION ---------------- */
  
  useEffect(() => {
    let flowInterval: NodeJS.Timeout;
    let sourceNode: string = "supervisor";
    let targetNode: string | null = null;

    // Determine which node should receive the packets based on the new phase
    if (currentPhase === "supervisor") {
      sourceNode = "voice";
      targetNode = "supervisor";
    } else if (currentPhase === "content_strategist" || currentPhase === "content") {
      targetNode = "content";
    } else if (currentPhase === "art_director" || currentPhase === "art") {
      targetNode = "art";
    } else if (currentPhase === "scheduler") {
      targetNode = "scheduler";
    } else if (currentPhase === "communications" || currentPhase === "comms") {
      targetNode = "comms";
    }

    if (targetNode) {
      // Fire instantly
      const sendPacket = () => {
        const id = `flow-${Date.now()}-${Math.random()}`; 
        setPackets((p) => [...p, { id, from: sourceNode, to: targetNode as string }]);
        
        setTimeout(() => {
          setPackets((p) => p.filter((x) => x.id !== id));
          setReceiverGlow(targetNode);
        }, 1200);
        
        setTimeout(() => setReceiverGlow(null), 1800);
      };

      sendPacket(); // Fire immediately!
      flowInterval = setInterval(sendPacket, 2500); 
    }

    return () => clearInterval(flowInterval);
  }, [currentPhase]);

  /* ---------------- MODAL & EXECUTE HANDLERS ---------------- */

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

  const handleConfirmExecute = async () => {
    setIsUpdating(true);
    try {
      const threadId = `thread_${Date.now()}`;
      setActiveThreadId(threadId);
      
      if (onThreadCreated) {
        onThreadCreated(threadId);
      }

      const fd = new FormData();
      fd.append("event_name", formData.event_name);
      fd.append("event_date", formData.event_date);
      fd.append("event_type", formData.event_type);
      fd.append("thread_id", threadId);

      if (formData.schedule_csv.trim()) {
        fd.append("schedule_csv", new Blob([formData.schedule_csv], { type: "text/csv" }), "schedule.csv");
      }
      if (formData.participant_csv.trim()) {
        fd.append("participant_csv", new Blob([formData.participant_csv], { type: "text/csv" }), "participants.csv");
      }

      const aiRes = await fetch("/api/agent/setup", { method: "POST", body: fd });

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
    <div className="mb-4 w-full max-w-4xl mx-auto px-2 flex flex-col relative scale-[0.90] xl:scale-100 origin-top">
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
        className="relative bg-[#0a1017] mt-4 rounded-2xl pt-10 pb-20 px-6 min-h-[450px] overflow-hidden border border-[#1e293b]"
      >
        <FlowLayer packets={packets} nodeRefs={nodeRefs} containerRef={containerRef} />

        <FloatingVoice
          activeJob={activeJob}
          initialAiMessage={initialMessages}
          threadId={activeThreadId}
        />

        <div className="relative z-10 px-12 flex flex-col items-center space-y-8">
          <Button
            id="step-execute-btn"
            onClick={handleOpenModal}
            disabled={!activeJob || currentPhase !== null}
            className="w-60 h-12 bg-green-500 hover:bg-green-400 text-[#0a1017] font-bold"
          >
            <Play className="w-5 h-5 mr-2" />
            {currentPhase ? "Swarm Active" : "Execute Swarm"}
          </Button>

          <div ref={nodeRefs.voice}>
            <AgentNode icon={User} title="User" data={agents.voice} glow={receiverGlow === "voice"} phaseKey="voice" currentPhase={currentPhase} />
          </div>

          <div ref={nodeRefs.supervisor}>
            <AgentNode icon={Brain} title="Supervisor" data={agents.supervisor} glow={receiverGlow === "supervisor"} phaseKey="supervisor" currentPhase={currentPhase} />
          </div>

          <div className="flex justify-between w-full max-w-4xl mx-auto pt-4">
            <div ref={nodeRefs.content}>
              <AgentNode icon={PenTool} title="Content Strategist" data={agents.content} glow={receiverGlow === "content"} phaseKey="content" currentPhase={currentPhase} />
            </div>

            <div ref={nodeRefs.art}>
              <AgentNode icon={Palette} title="Art Director" data={agents.art} glow={receiverGlow === "art"} phaseKey="art" currentPhase={currentPhase} />
            </div>

            <div ref={nodeRefs.scheduler}>
              <AgentNode icon={Calendar} title="Scheduler" data={agents.scheduler} glow={receiverGlow === "scheduler"} phaseKey="scheduler" currentPhase={currentPhase} />
            </div>

            <div ref={nodeRefs.comms}>
              <AgentNode icon={Mail} title="Email Agent" data={agents.comms} glow={receiverGlow === "comms"} phaseKey="comms" currentPhase={currentPhase} />
            </div>
          </div>
        </div>
      </div>

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
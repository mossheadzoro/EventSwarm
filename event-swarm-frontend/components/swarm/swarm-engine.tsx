// components/dashboard/swarm-engine.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Mic, Mail, Calendar, PenTool, Brain, Play } from "lucide-react";
import { socket } from "@/lib/socket";
import { FlowLayer } from "./flow-animation";
import { AgentNode } from "./agent-node";
import { Packet } from "../../app/type/swarm";
import { Button } from "../ui/button";

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
    <div className="mb-6 w-5xl -mt-5 mx-auto px-4 flex flex-col">
      {/* JOB SELECTOR BUTTONS */}
      <div className="flex gap-3 mb-4 overflow-x-auto pb-2 scrollbar-hide">
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
            {job.event_name}
          </button>
        ))}
      </div>

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
        className="relative bg-[#0a1017] mt-6 rounded-2xl pt-16 pb-32 px-10 min-h-150 overflow-hidden border border-[#1e293b] bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.03)_0,transparent_70%)]"
      >
        <Button 
  className="group relative flex items-center justify-center gap-2 w-60 h-12 -mt-10 -ml-4 bg-green-500 hover:bg-green-400 text-[#0a1017] font-bold text-lg uppercase tracking-wider rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.6)] hover:-translate-y-0.5"
>
  <Play className="w-5 h-5 fill-current" />
  Execute Swarm
</Button>
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
            <div ref={nodeRefs.content} className="flex-1 flex justify-center -mt-24">
              <AgentNode icon={PenTool} title="Content Strategist" data={agents.content} glow={receiverGlow === "content"} />
            </div>
            
            <div ref={nodeRefs.scheduler} className="flex-1 flex justify-center mt-16">
              <AgentNode icon={Calendar} title="Scheduler" data={agents.scheduler} glow={receiverGlow === "scheduler"} />
            </div>
            
            <div ref={nodeRefs.comms} className="flex-1 flex justify-center -mt-24">
              <AgentNode icon={Mail} title="Email Agent" data={agents.comms} glow={receiverGlow === "comms"} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
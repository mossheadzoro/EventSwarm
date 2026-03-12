

// "use client";

// import React, { useEffect, useRef, useState } from "react";
// import { motion } from "framer-motion";
// import { Mic, Mail, Calendar, LineChart, PenTool } from "lucide-react";
// import { socket } from "@/lib/socket";

// type AgentState = {
//   status: string;
//   progress: number;
//   task: string;
// };

// type Packet = {
//   id: number;
//   from: string;
//   to: string;
// };

// const AgentNode = ({ icon: Icon, title, data, glow }: any) => {
//   return (
//     <div className="flex flex-col items-center z-10 w-32">

//       <motion.div
//         animate={
//           glow
//             ? { boxShadow: ["0 0 8px #22c55e", "0 0 25px #22c55e", "0 0 8px #22c55e"] }
//             : data.status === "running"
//             ? { boxShadow: ["0 0 20px #00e5ff", "0 0 40px #00e5ff", "0 0 20px #00e5ff"] }
//             : {}
//         }
//         transition={{ duration: 1.2, repeat: glow ? 1 : Infinity }}
//         className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-2 border ${
//           data.status === "running"
//             ? "bg-[#00e5ff] border-[#00e5ff]"
//             : "bg-[#0f171e] border-[#1e293b]"
//         }`}
//       >
//         <Icon className={`w-6 h-6 ${data.status === "running" ? "text-black" : "text-gray-400"}`} />
//       </motion.div>

//       <span className="text-white text-sm font-semibold">{title}</span>

//       <span className="text-[10px] text-gray-400 mb-1">
//         {data.task || "Idle"}
//       </span>

//       <div className="w-full h-1 bg-[#1e293b] rounded">
//         <motion.div
//           className="h-full bg-[#00e5ff]"
//           animate={{ width: `${data.progress}%` }}
//         />
//       </div>

//     </div>
//   );
// };

// const FlowLayer = ({ packets, nodeRefs, containerRef }: any) => {

//   const [paths, setPaths] = useState<any[]>([]);

//   useEffect(() => {

//     const containerRect = containerRef.current?.getBoundingClientRect();
//     if (!containerRect) return;

//     const newPaths = packets.map((p: any) => {

//       const from = nodeRefs[p.from]?.current;
//       const to = nodeRefs[p.to]?.current;

//       if (!from || !to) return null;

//       const r1 = from.getBoundingClientRect();
//       const r2 = to.getBoundingClientRect();

//       const x1 = r1.left + r1.width / 2 - containerRect.left;
//       const y1 = r1.top + r1.height / 2 - containerRect.top;

//       const x2 = r2.left + r2.width / 2 - containerRect.left;
//       const y2 = r2.top + r2.height / 2 - containerRect.top;

//       const path = `M ${x1} ${y1}
//         C ${(x1 + x2) / 2} ${y1 - 120},
//           ${(x1 + x2) / 2} ${y2 - 120},
//           ${x2} ${y2}`;

//       return { id: p.id, path };

//     }).filter(Boolean);

//     setPaths(newPaths);

//   }, [packets]);

//   return (
//     <svg className="absolute inset-0 w-full h-full pointer-events-none">

//       {paths.map((p: any) => (

//         <g key={p.id}>

//           <motion.path
//             d={p.path}
//             stroke="#00e5ff"
//             strokeWidth="2"
//             fill="transparent"
//             strokeDasharray="6 6"
//             initial={{ pathLength: 0 }}
//             animate={{ pathLength: 1 }}
//             transition={{ duration: 0.3 }}
//           />

//           <motion.circle
//             r="6"
//             fill="#00e5ff"
//             initial={{ offsetDistance: "0%" }}
//             animate={{ offsetDistance: "100%" }}
//             transition={{ duration: 1.1, ease: "easeInOut" }}
//             style={{
//               offsetPath: `path("${p.path}")`
//             }}
//           />

//         </g>

//       ))}

//     </svg>
//   );
// };

// export function SwarmEngine({ jobs, activeJob, setActiveJob }: any) {

//   const containerRef = useRef<any>(null);

//   const nodeRefs: any = {
//     voice: useRef(null),
//     scheduler: useRef(null),
//     content: useRef(null),
//     comms: useRef(null),
//     analytics: useRef(null)
//   };

//   const [agents, setAgents] = useState<any>({
//     voice: { progress: 0, status: "idle", task: "" },
//     scheduler: { progress: 0, status: "idle", task: "" },
//     content: { progress: 0, status: "idle", task: "" },
//     comms: { progress: 0, status: "idle", task: "" },
//     analytics: { progress: 0, status: "idle", task: "" }
//   });

//   const [packets, setPackets] = useState<Packet[]>([]);
//   const [receiverGlow, setReceiverGlow] = useState<string | null>(null);

//   useEffect(() => {

//     socket.emit("join_job", "job-1");

//     socket.on("agent_progress", (data: any) => {

//       setAgents((prev: any) => ({
//         ...prev,
//         [data.agent]: {
//           progress: data.progress,
//           task: data.task,
//           status: data.status
//         }
//       }));

//     });

//     socket.on("agent_flow", (data: any) => {

//       const id = Date.now();

//       setPackets((p) => [...p, { id, ...data }]);

//       setTimeout(() => {

//         setPackets((p) => p.filter((x) => x.id !== id));
//         setReceiverGlow(data.to);

//       }, 900);

//       setTimeout(() => setReceiverGlow(null), 1500);

//     });

//     return () => {
//       socket.off("agent_progress");
//       socket.off("agent_flow");
//     };

//   }, []);

//   return (
//     <div className="mb-6">

//       <div className="flex gap-3 mb-6 overflow-x-auto">

//         {jobs?.map((job: any) => (
//           <button
//             key={job._id}
//             onClick={() => setActiveJob(job)}
//             className={`px-4 py-2 rounded-lg border text-sm ${
//               activeJob?._id === job._id
//                 ? "bg-[#00e5ff] text-black border-[#00e5ff]"
//                 : "bg-[#0f171e] border-[#1e293b] text-gray-400"
//             }`}
//           >
//             {job.title}
//           </button>
//         ))}

//       </div>


//   <div>
//            <h1 className="text-2xl font-bold text-white">
//              Active Swarm Engine
//            </h1>

//            <p className="text-gray-400 text-sm">
//              Real-time AI orchestration for
//              <span className="text-[#00e5ff] ml-2">
//                {activeJob?.title || "No Active Job"}
//              </span>
//            </p>
//        </div>

//       <div
//         ref={containerRef}
//         className="relative bg-[#0a1017] mt-4 border border-[#1e293b] rounded-2xl p-12 overflow-hidden"
//       >

//         <FlowLayer packets={packets} nodeRefs={nodeRefs} containerRef={containerRef} />

//         <div className="relative flex flex-col space-y-12">

//           <div className="flex justify-between px-12">

//             <div ref={nodeRefs.voice}>
//               <AgentNode icon={Mic} title="Voice Parser" data={agents.voice} glow={receiverGlow === "voice"} />
//             </div>

//             <div ref={nodeRefs.scheduler}>
//               <AgentNode icon={Calendar} title="Scheduler Agent" data={agents.scheduler} glow={receiverGlow === "scheduler"} />
//             </div>

//             <div ref={nodeRefs.content}>
//               <AgentNode icon={PenTool} title="Content Strategist" data={agents.content} glow={receiverGlow === "content"} />
//             </div>

//           </div>

//           <div className="flex justify-center space-x-48">

//             <div ref={nodeRefs.comms}>
//               <AgentNode icon={Mail} title="Comms Agent" data={agents.comms} glow={receiverGlow === "comms"} />
//             </div>

//             <div ref={nodeRefs.analytics}>
//               <AgentNode icon={LineChart} title="Analytics Agent" data={agents.analytics} glow={receiverGlow === "analytics"} />
//             </div>

//           </div>

//         </div>

//       </div>

//     </div>
//   );
// }

"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, Mail, Calendar, LineChart, PenTool } from "lucide-react";
import { socket } from "@/lib/socket";

type AgentState = {
  status: string;
  progress: number;
  task: string;
};

type Packet = {
  id: number;
  from: string;
  to: string;
};

const AgentNode = ({ icon: Icon, title, data, glow }: any) => {
  return (
    <div className="flex flex-col items-center z-10 w-32 relative">

      {/* Arrival ring animation */}
      {glow && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0.6 }}
          animate={{ scale: 2.4, opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute w-16 h-16 rounded-full border border-green-400"
        />
      )}

      <motion.div
        animate={
          glow
            ? { boxShadow: ["0 0 8px #22c55e", "0 0 25px #22c55e", "0 0 8px #22c55e"] }
            : data.status === "running"
            ? { boxShadow: ["0 0 20px #00e5ff", "0 0 40px #00e5ff", "0 0 20px #00e5ff"] }
            : {}
        }
        transition={{ duration: 1.2, repeat: glow ? 1 : Infinity }}
        className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-2 border ${
          data.status === "running"
            ? "bg-[#00e5ff] border-[#00e5ff]"
            : "bg-[#0f171e] border-[#1e293b]"
        }`}
      >
        <Icon className={`w-6 h-6 ${data.status === "running" ? "text-black" : "text-gray-400"}`} />
      </motion.div>

      <span className="text-white text-sm font-semibold">{title}</span>

      <span className="text-[10px] text-gray-400 mb-1">
        {data.task || "Idle"}
      </span>

      <div className="w-full h-1 bg-[#1e293b] rounded">
        <motion.div
          className="h-full bg-[#00e5ff]"
          animate={{ width: `${data.progress}%` }}
        />
      </div>

    </div>
  );
};

const FlowLayer = ({ packets, nodeRefs, containerRef }: any) => {

  const [paths, setPaths] = useState<any[]>([]);

  useEffect(() => {

    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const newPaths = packets.map((p: any) => {

      const from = nodeRefs[p.from]?.current;
      const to = nodeRefs[p.to]?.current;

      if (!from || !to) return null;

      const r1 = from.getBoundingClientRect();
      const r2 = to.getBoundingClientRect();

      const x1 = r1.left + r1.width / 2 - containerRect.left;
      const y1 = r1.top + r1.height / 2 - containerRect.top;

      const x2 = r2.left + r2.width / 2 - containerRect.left;
      const y2 = r2.top + r2.height / 2 - containerRect.top;

      const path = `M ${x1} ${y1}
        C ${(x1 + x2) / 2} ${y1 - 120},
          ${(x1 + x2) / 2} ${y2 - 120},
          ${x2} ${y2}`;

      return { id: p.id, path };

    }).filter(Boolean);

    setPaths(newPaths);

  }, [packets]);

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">

      {/* Glow filter */}
      <defs>
        <filter id="packetGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {paths.map((p: any) => (

        <g key={p.id}>

          {/* dotted communication line */}
          <motion.path
            d={p.path}
            stroke="#00e5ff"
            strokeWidth="2"
            fill="transparent"
            strokeDasharray="6 6"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3 }}
          />

          {/* pulse traveling along line */}
          <motion.circle
            r="10"
            fill="rgba(0,229,255,0.15)"
            initial={{ offsetDistance: "0%" }}
            animate={{ offsetDistance: "100%" }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
            style={{ offsetPath: `path("${p.path}")` }}
          />

          {/* main packet */}
          <motion.circle
            r="6"
            fill="#00e5ff"
            filter="url(#packetGlow)"
            initial={{ offsetDistance: "0%" }}
            animate={{ offsetDistance: "100%" }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
            style={{ offsetPath: `path("${p.path}")` }}
          />

        </g>

      ))}

    </svg>
  );
};

export function SwarmEngine({ jobs, activeJob, setActiveJob }: any) {

  const containerRef = useRef<any>(null);

  const nodeRefs: any = {
    voice: useRef(null),
    scheduler: useRef(null),
    content: useRef(null),
    comms: useRef(null),
    analytics: useRef(null)
  };

  const [agents, setAgents] = useState<any>({
    voice: { progress: 0, status: "idle", task: "" },
    scheduler: { progress: 0, status: "idle", task: "" },
    content: { progress: 0, status: "idle", task: "" },
    comms: { progress: 0, status: "idle", task: "" },
    analytics: { progress: 0, status: "idle", task: "" }
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

      const id = Date.now();

      setPackets((p) => [...p, { id, ...data }]);

      setTimeout(() => {

        setPackets((p) => p.filter((x) => x.id !== id));
        setReceiverGlow(data.to);

      }, 900);

      setTimeout(() => setReceiverGlow(null), 1500);

    });

    return () => {
      socket.off("agent_progress");
      socket.off("agent_flow");
    };

  }, []);

  return (
    <div className="mb-6">

      <div className="flex gap-3 mb-6 overflow-x-auto">

        {jobs?.map((job: any) => (
          <button
            key={job._id}
            onClick={() => setActiveJob(job)}
            className={`px-4 py-2 rounded-lg border text-sm ${
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
        <h1 className="text-2xl font-bold text-white">
          Active Swarm Engine
        </h1>

        <p className="text-gray-400 text-sm">
          Real-time AI orchestration for
          <span className="text-[#00e5ff] ml-2">
            {activeJob?.title || "No Active Job"}
          </span>
        </p>
      </div>

      <div
        ref={containerRef}
        className="relative bg-[#0a1017] mt-4 border border-[#1e293b] rounded-2xl p-12 overflow-hidden
        bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.03)_0,transparent_70%)]"
      >

        <FlowLayer packets={packets} nodeRefs={nodeRefs} containerRef={containerRef} />

        <div className="relative flex flex-col space-y-12">

          <div className="flex justify-between px-12">

            <div ref={nodeRefs.voice}>
              <AgentNode icon={Mic} title="Voice Parser" data={agents.voice} glow={receiverGlow === "voice"} />
            </div>

            <div ref={nodeRefs.scheduler}>
              <AgentNode icon={Calendar} title="Scheduler Agent" data={agents.scheduler} glow={receiverGlow === "scheduler"} />
            </div>

            <div ref={nodeRefs.content}>
              <AgentNode icon={PenTool} title="Content Strategist" data={agents.content} glow={receiverGlow === "content"} />
            </div>

          </div>

          <div className="flex justify-center mt-8 space-x-48">

            <div ref={nodeRefs.comms}>
              <AgentNode icon={Mail} title="Comms Agent" data={agents.comms} glow={receiverGlow === "comms"} />
            </div>

            <div ref={nodeRefs.analytics}>
              <AgentNode icon={LineChart} title="Analytics Agent" data={agents.analytics} glow={receiverGlow === "analytics"} />
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
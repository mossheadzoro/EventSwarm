// "use client";

// import React, { useEffect, useState } from "react";
// import { motion } from "framer-motion";

// type Packet = {
//   id: number;
//   from: string;
//   to: string;
// };

// export const FlowLayer = ({ packets, nodeRefs, containerRef }: any) => {
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

//       // PERFECT TREE MATH: Smooth vertical S-curve avoiding crisscrosses
//       const path = `M ${x1} ${y1}
//         C ${x1} ${(y1 + y2) / 2},
//           ${x2} ${(y1 + y2) / 2},
//           ${x2} ${y2}`;

//       return { id: p.id, path };
//     }).filter(Boolean);

//     setPaths(newPaths);
//   }, [packets, nodeRefs, containerRef]);

//   return (
//     <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
//       <defs>
//         <filter id="packetGlow">
//           <feGaussianBlur stdDeviation="3" result="coloredBlur" />
//           <feMerge>
//             <feMergeNode in="coloredBlur" />
//             <feMergeNode in="SourceGraphic" />
//           </feMerge>
//         </filter>
//       </defs>

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
//             r="10"
//             fill="rgba(0,229,255,0.15)"
//             initial={{ offsetDistance: "0%" }}
//             animate={{ offsetDistance: "100%" }}
//             transition={{ duration: 1.1, ease: "easeInOut" }}
//             style={{ offsetPath: `path("${p.path}")` }}
//           />
//           <motion.circle
//             r="6"
//             fill="#00e5ff"
//             filter="url(#packetGlow)"
//             initial={{ offsetDistance: "0%" }}
//             animate={{ offsetDistance: "100%" }}
//             transition={{ duration: 1.1, ease: "easeInOut" }}
//             style={{ offsetPath: `path("${p.path}")` }}
//           />
//         </g>
//       ))}
//     </svg>
//   );
// };
"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Packet = {
  id: number;
  from: string;
  to: string;
};

export const FlowLayer = ({ packets, nodeRefs, containerRef }: any) => {
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

      // FORCED CURVE: Exits straight down 100px, then bends to the target
      const path = `M ${x1} ${y1}
        C ${x1} ${y1 + 100},
          ${x2} ${y2 - 100},
          ${x2} ${y2}`;

      return { id: p.id, path };
    }).filter(Boolean);

    setPaths(newPaths);
  }, [packets, nodeRefs, containerRef]);

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
      <defs>
        <filter id="packetGlow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {paths.map((p: any) => (
        <g key={p.id}>
          {/* Faint background wire (always visible) */}
          <path
            d={p.path}
            stroke="#1e293b"
            strokeWidth="2"
            fill="transparent"
            strokeDasharray="4 4"
          />

          {/* Glowing dotted line that animates across */}
          <motion.path
            d={p.path}
            stroke="#00e5ff"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray="8 8" // Makes the passing line dotted
            initial={{ pathLength: 0, opacity: 1 }}
            animate={{ pathLength: 1, opacity: [1, 1, 0] }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            filter="url(#packetGlow)"
          />
        </g>
      ))}
    </svg>
  );
};
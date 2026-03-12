"use client";

import { Mic } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export function FloatingVoice() {

  const [position, setPosition] = useState({ x: 20, y: 300 });

  const handleDragEnd = (event:any, info:any) => {

    const screenWidth = window.innerWidth;

    const snapX =
      info.point.x < screenWidth / 2
        ? 20
        : screenWidth - 80;

    setPosition({
      x: snapX,
      y: info.point.y
    });

  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      animate={position}
      className="fixed z-50"
      style={{
        left: 0,
        top: 0
      }}
    >

      <div className="w-16 h-16 rounded-full bg-[#00e5ff] flex items-center justify-center">

        <Mic className="text-black w-7 h-7"/>

      </div>

    </motion.div>
  );
}
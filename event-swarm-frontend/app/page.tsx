
"use client";

import HandwritingText from "@/components/transition/handwritten";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/login");
    }, 5000); // slower redirect

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main
      style={{ fontFamily: "var(--font-geist-sans), Geist, sans-serif" }}
      className="relative h-screen w-screen bg-black flex flex-col items-center justify-center overflow-hidden gap-6"
    >

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{ fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)" }}
        className="text-white text-6xl font-semibold tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.25)]"
      >
        EventSwarm
      </motion.h1>

      <HandwritingText  />

      <motion.div
        initial={{ y: "-100%" }}
        animate={{ y: "100%" }}
        transition={{
          duration: 1.6,
          delay: 3,
          ease: "easeInOut",
        }}
        className="absolute top-0 left-0 w-full h-full bg-white"
      />

    </main>
  );
}
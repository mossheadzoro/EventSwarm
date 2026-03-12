
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);

    const endpoint =
      mode === "login" ? "/api/auth/login" : "/api/auth/register";

    const body =
      mode === "login"
        ? { email, password }
        : { name, email, password };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setTimeout(() => {
        router.push("/home");
      }, 700);
    } else {
      alert("Authentication failed");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#080d12] text-white px-6 overflow-hidden">

      {/* Animated Gradient Background */}
      <motion.div
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute inset-0 opacity-20"
        style={{
          background:
            "linear-gradient(120deg, #00e5ff, #0ea5e9, #38bdf8, #00e5ff)",
          backgroundSize: "400% 400%",
        }}
      />

      {/* Glow Orb */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-125 h-125 bg-[#00e5ff] blur-[180px] rounded-full"
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md bg-[#0f172a]/95 border border-[#1e293b] rounded-lg p-8 shadow-[0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-xl"
      >

        {/* Logo */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-3xl font-semibold tracking-tight mb-6"
        >
          EventSwarm
        </motion.h1>

        {/* Tabs */}
        <div className="flex mb-8 border-b border-[#1e293b]">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 pb-3 font-medium transition ${
              mode === "login"
                ? "border-b-2 border-[#00e5ff] text-white"
                : "text-gray-400"
            }`}
          >
            Login
          </button>

          <button
            onClick={() => setMode("signup")}
            className={`flex-1 pb-3 font-medium transition ${
              mode === "signup"
                ? "border-b-2 border-[#00e5ff] text-white"
                : "text-gray-400"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Name */}
        {mode === "signup" && (
          <input
            className="w-full mb-4 p-3 bg-[#020617] border border-[#1e293b] rounded-md focus:outline-none focus:border-[#00e5ff]"
            placeholder="Full Name"
            onChange={(e) => setName(e.target.value)}
          />
        )}

        {/* Email */}
        <input
          className="w-full mb-4 p-3 bg-[#020617] border border-[#1e293b] rounded-md focus:outline-none focus:border-[#00e5ff]"
          placeholder="Email Address"
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password */}
        <input
          type="password"
          className="w-full mb-6 p-3 bg-[#020617] border border-[#1e293b] rounded-md focus:outline-none focus:border-[#00e5ff]"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Button */}
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            onClick={submit}
            disabled={loading}
            className="w-full bg-[#00e5ff] text-black hover:bg-[#00c8e0] transition shadow-[0_0_20px_rgba(0,229,255,0.5)]"
          >
            {loading
              ? "Accessing..."
              : mode === "login"
              ? "Access Command Center"
              : "Create Account"}
          </Button>
        </motion.div>
      </motion.div>

      {/* Page Transition */}
      {loading && (
        <motion.div
          initial={{ y: "-100%" }}
          animate={{ y: "0%" }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="absolute top-0 left-0 w-full h-full bg-white z-50"
        />
      )}
    </div>
  );
}
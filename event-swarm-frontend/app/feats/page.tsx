"use client";

import { motion } from "framer-motion";
import {
  Zap, Brain, PenTool, Palette, Calendar, Mail,
  Mic, MessageSquare, Upload, CheckCircle2,
  BarChart3, Globe, Shield, Sparkles,
} from "lucide-react";
import { DashboardHeader } from "../../components/dashboard/header";
import StarfieldBackground from "../../components/dashboard/swarm-background";

const features = [
  {
    icon: Brain,
    title: "AI Supervisor Agent",
    description: "A central orchestrator that delegates tasks to specialized agents, reviews output, and coordinates the entire swarm workflow in real-time.",
    color: "#00e5ff",
  },
  {
    icon: Mic,
    title: "Voice Command Interface",
    description: "Speak naturally to control the swarm. Voice commands are transcribed and processed by the AI supervisor for hands-free event management.",
    color: "#a78bfa",
  },
  {
    icon: PenTool,
    title: "Content Strategist Agent",
    description: "Automatically generates social media captions, taglines, and marketing copy tailored to your event's audience and brand.",
    color: "#f472b6",
  },
  {
    icon: Palette,
    title: "Art Director Agent",
    description: "Creates AI-generated visuals, posters, and brand assets using prompt engineering and image generation APIs.",
    color: "#fb923c",
  },
  {
    icon: Calendar,
    title: "Scheduler Agent",
    description: "Builds event timelines from CSV uploads, checks calendar availability via API, and flags scheduling conflicts automatically.",
    color: "#facc15",
  },
  {
    icon: Mail,
    title: "Communications Agent",
    description: "Drafts and sends personalized email campaigns to participants with auto-attached event posters.",
    color: "#34d399",
  },
  {
    icon: MessageSquare,
    title: "Real-Time Chat Interface",
    description: "ChatGPT-style chat panel with typewriter animations, markdown rendering, and file upload support for seamless AI interaction.",
    color: "#60a5fa",
  },
  {
    icon: Upload,
    title: "CSV & File Processing",
    description: "Upload event schedules, contact lists, and data files directly in chat. The AI parses and processes them into actionable workflows.",
    color: "#c084fc",
  },
  {
    icon: CheckCircle2,
    title: "Human-in-the-Loop Approvals",
    description: "Every AI output goes through a widget approval flow. Edit captions, email drafts, and schedules before they go live.",
    color: "#22c55e",
  },
  {
    icon: BarChart3,
    title: "Budget Report Generation",
    description: "Download AI-generated budget reports with cost breakdowns, resource allocation, and financial summaries.",
    color: "#f97316",
  },
  {
    icon: Globe,
    title: "Multi-Platform Publishing",
    description: "Publish content across Twitter, Instagram, and LinkedIn from a single dashboard with platform-specific formatting.",
    color: "#06b6d4",
  },
  {
    icon: Shield,
    title: "Calendar Conflict Detection",
    description: "Real-time calendar API integration that checks date availability and prevents double-booking across your events.",
    color: "#ef4444",
  },
];

export default function FeatsPage() {
  return (
    <div className="h-screen flex flex-col bg-[#080d12] text-white overflow-hidden">
      <StarfieldBackground />

      <div className="relative z-20">
        <DashboardHeader />
      </div>

      <div className="flex-1 overflow-y-auto relative z-10 px-8 py-12 rocket-scrollbar">
        <div className="max-w-5xl mx-auto space-y-10">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1
              className="text-4xl font-bold text-white mb-3"
              style={{ fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)" }}
            >
              <Sparkles className="w-8 h-8 inline-block text-[#00e5ff] mr-2 -mt-1" />
              EventSwarm Features
            </h1>
            <p className="text-gray-400 text-sm max-w-xl mx-auto">
              A multi-agent AI swarm that automates every aspect of event management — from content creation to scheduling to communications.
            </p>
          </motion.div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feat, idx) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="bg-[#0a1017] border border-[#1e293b] rounded-2xl p-5 hover:border-opacity-50 transition-all group hover:shadow-[0_0_30px_rgba(0,229,255,0.08)]"
                style={{ ["--feat-color" as any]: feat.color }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${feat.color}15`, border: `1px solid ${feat.color}30` }}
                  >
                    <feat.icon className="w-5 h-5" style={{ color: feat.color }} />
                  </div>
                  <h3 className="text-white font-semibold text-sm">{feat.title}</h3>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed">{feat.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Bottom */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center pb-12"
          >
            <p className="text-gray-600 text-xs">
              Built with Next.js • LangGraph • Socket.IO • Google Calendar API
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

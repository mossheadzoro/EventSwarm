"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { History as HistoryIcon, User, Brain, Calendar, Clock, RefreshCcw } from "lucide-react";
import { DashboardHeader } from "../../components/dashboard/header";
import StarfieldBackground from "../../components/dashboard/swarm-background";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatMessage = {
  id: string;
  role: string;
  content: string;
  timestamp?: string; // If your backend provides it
};

export default function HistoryPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/history");
        const data = await res.json();

        if (data && data.messages) {
          const parsed = data.messages
            .filter((m: any) => m.role === "HumanMessage" || m.role === "AIMessage")
            .map((m: any, idx: number) => ({
              id: m.id || `msg-${idx}`,
              role: m.role,
              content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
              // If backend doesn't send time, we gracefully fallback
              timestamp: m.createdAt || m.timestamp || new Date().toISOString(),
            }))
            .reverse(); // Show newest first, or oldest first depending on preference. Let's keep chronological.
            
          setMessages(parsed.reverse()); // Keep oldest -> newest flow
        }
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { date: "", time: "" };

    const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    return { date, time };
  };

  return (
    <div className="h-screen flex flex-col bg-[#080d12] text-white overflow-hidden">
      <StarfieldBackground />

      <div className="relative z-20">
        <DashboardHeader />
      </div>

      <div className="flex-1 overflow-y-auto relative z-10 px-4 sm:px-8 py-12 rocket-scrollbar">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3" style={{ fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)" }}>
                <HistoryIcon className="w-8 h-8 text-[#00e5ff]" />
                Swarm History
              </h1>
              <p className="text-gray-400 text-sm">Full activity log of your interactions with the AI Swarm.</p>
            </div>
            
            <div className="text-xs bg-[#1e293b] text-gray-400 px-3 py-1.5 rounded-full border border-[#334155] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live Database Sync
            </div>
          </motion.div>

          {/* Chat History View */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-[#0a1017] border border-[#1e293b] rounded-2xl shadow-[0_0_40px_rgba(0,229,255,0.05)] overflow-hidden flex flex-col min-h-[600px]"
          >
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-4">
                <RefreshCcw className="w-8 h-8 animate-spin text-[#00e5ff]/50" />
                <p>Loading swarm chronicals...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-4">
                <HistoryIcon className="w-12 h-12 opacity-20" />
                <p>No chat history found for this session.</p>
              </div>
            ) : (
              <div className="flex-1 p-6 space-y-8">
                {messages.map((msg, idx) => {
                  const isAI = msg.role === "AIMessage";
                  const { date, time } = formatDate(msg.timestamp!);

                  return (
                    <div key={msg.id} className={`flex gap-4 ${isAI ? "" : "flex-row-reverse"}`}>
                      {/* Avatar */}
                      <div className="shrink-0 mt-1">
                        {isAI ? (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00e5ff]/20 to-[#00e5ff]/5 border border-[#00e5ff]/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.15)]">
                            <Brain className="w-5 h-5 text-[#00e5ff]" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#1e293b] border border-[#334155] flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                      </div>

                      {/* Message Content */}
                      <div className={`flex flex-col max-w-[80%] ${isAI ? "items-start" : "items-end"}`}>
                        {/* Meta row: Name + Time */}
                        <div className={`flex items-center gap-3 mb-1.5 text-xs ${isAI ? "flex-row" : "flex-row-reverse"}`}>
                          <span className="font-bold tracking-wider uppercase text-gray-300">
                            {isAI ? "Event Swarm" : "You"}
                          </span>
                          
                          {/* Time Badge */}
                          {date && time && (
                            <span className="flex items-center gap-1.5 text-gray-500 bg-[#020617] px-2 py-0.5 rounded border border-[#1e293b]">
                              <Calendar className="w-3 h-3" /> {date}
                              <span className="opacity-50">•</span>
                              <Clock className="w-3 h-3" /> {time}
                            </span>
                          )}
                        </div>

                        {/* Speech Bubble */}
                        <div
                          className={`px-5 py-3.5 text-sm leading-relaxed ${
                            isAI
                              ? "bg-[#0d1117]/80 text-gray-200 border border-[#30363d] rounded-2xl rounded-tl-sm shadow-md"
                              : "bg-[#020617] text-gray-200 border border-[#30363d] rounded-2xl rounded-tr-sm"
                          }`}
                        >
                          {isAI ? (
                            <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-[#161b22] prose-pre:border prose-pre:border-[#30363d] prose-a:text-[#00e5ff]">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

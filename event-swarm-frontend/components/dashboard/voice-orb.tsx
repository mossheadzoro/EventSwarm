

"use client";

import { Mic, X, Send, Brain, Loader2, Square, Paperclip } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { socket } from "@/lib/socket";

type Message = {
  id: string;
  sender: "user" | "supervisor";
  text: string;
};

export function FloatingVoice({
  activeJob,
  initialAiMessage,
  threadId,
}: {
  activeJob?: any;
  initialAiMessage?: any[];
  threadId?: string | null;
}) {
  const currentThreadId = threadId || activeJob?.thread_id || `thread_${activeJob?._id || "default"}`;

  /* ---------------- CHAT STATE ---------------- */

  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      sender: "supervisor",
      text: "System initialized. Waiting for swarm execution...",
    },
  ]);

  /* ---------------- REFS ---------------- */

  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const isDragging = useRef(false);

  /* ---------------- AUTO SCROLL ---------------- */

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---------------- POSITION ---------------- */

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const orbSize = 64;
    const padding = 24;

    const saved = localStorage.getItem("voiceOrbPosition");

    if (saved) {
      try {
        setPosition(JSON.parse(saved));
        setIsMounted(true);
        return;
      } catch {}
    }

    setPosition({
      x: window.innerWidth - orbSize - padding,
      y: window.innerHeight - orbSize - padding,
    });

    setIsMounted(true);
  }, []);

  /* ---------------- INITIAL MESSAGE ---------------- */

  useEffect(() => {
    if (!initialAiMessage || initialAiMessage.length === 0) return;

    const aiMessages = initialAiMessage
      .filter(
        (m: any) =>
          (m.role === "AIMessage" || m.role === "ToolMessage") &&
          !m.content.includes("ROUTE_TO")
      )
      .map((m: any) => ({
        id: Date.now().toString() + Math.random(),
        sender: "supervisor" as const,
        text: m.content,
      }));

    setMessages((prev) => [...prev, ...aiMessages]);
    setIsOpen(true);
  }, [initialAiMessage]);

  /* ---------------- SOCKET ---------------- */

  useEffect(() => {
    socket.on("supervisor_reply", (data: { text: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "supervisor",
          text: data.text,
        },
      ]);

      setIsTyping(false);
    });

    return () => {
      socket.off("supervisor_reply");
    };
  }, []);

  /* ---------------- EXTERNAL DASHBOARD COMMANDS ---------------- */

  useEffect(() => {
    function handleExternalCommand(e: any) {
      const commandText = e.detail;

      // Instantly add the user bubble to the chat window
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), sender: "user", text: commandText },
      ]);

      // Show typing indicator because SwarmEngine fired the API request
      setIsTyping(true);
    }

    window.addEventListener("external_chat_command", handleExternalCommand);
    return () => window.removeEventListener("external_chat_command", handleExternalCommand);
  }, []);

  /* ---------------- DRAG ---------------- */

  const handleDragStart = () => {
    isDragging.current = true;
  };

  const handleDragEnd = (_: any, info: any) => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const orbSize = 64;
    const padding = 24;

    const snapX =
      info.point.x < screenWidth / 2
        ? padding
        : screenWidth - orbSize - padding;

    let snapY = info.point.y;

    if (snapY < padding) snapY = padding;

    if (snapY > screenHeight - orbSize - padding)
      snapY = screenHeight - orbSize - padding;

    const newPos = { x: snapX, y: snapY };

    setPosition(newPos);

    localStorage.setItem("voiceOrbPosition", JSON.stringify(newPos));

    setTimeout(() => {
      isDragging.current = false;
    }, 150);
  };

  const toggleChat = () => {
    if (!isDragging.current) setIsOpen(!isOpen);
  };

  /* ---------------- RECORDING ---------------- */

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    const recorder = new MediaRecorder(stream);

    mediaRecorderRef.current = recorder;
    audioChunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      setIsTranscribing(true);

      const blob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });

      try {
        const res = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "audio/webm" },
          body: blob,
        });

        const data = await res.json();

        if (data.text) setInputText(data.text);
      } catch (e) {
        console.error("Transcription error", e);
      }

      setIsTranscribing(false);
      stream.getTracks().forEach((t) => t.stop());
    };

    recorder.start();
    setIsRecording(true);
  };

  /* ---------------- FILE UPLOAD ---------------- */

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "user",
        text: `📎 Uploaded: ${file.name}`,
      },
    ]);

    setIsTyping(true);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("thread_id", currentThreadId);

    if (inputText.trim()) {
      fd.append("message", inputText);
      setInputText("");
    }

    try {
      const res = await fetch("/api/agent/chat_with_file", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      // ---> NEW: Broadcast the data to the widgets! <---
      window.dispatchEvent(new CustomEvent("ai_chat_update", { detail: data }));

      const aiMessages =
        data.messages?.filter((m: any) => m.role === "AIMessage") || [];

      setMessages((prev) => [
        ...prev,
        ...aiMessages.map((m: any) => ({
          id: Date.now().toString() + Math.random(),
          sender: "supervisor",
          text: m.content,
        })),
      ]);
    } catch (err) {
      console.error("File upload error", err);
    } finally {
      setIsTyping(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* ---------------- SEND MESSAGE ---------------- */

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!inputText.trim()) return;

    const text = inputText;

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: "user", text },
    ]);

    setInputText("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          thread_id: currentThreadId,
        }),
      });

      const data = await res.json();

      // ---> NEW: Broadcast the data to the widgets! <---
      window.dispatchEvent(new CustomEvent("ai_chat_update", { detail: data }));

      const aiMessages =
        data.messages?.filter((m: any) => m.role === "AIMessage") || [];

      setMessages((prev) => [
        ...prev,
        ...aiMessages.map((m: any) => ({
          id: Date.now().toString() + Math.random(),
          sender: "supervisor",
          text: m.content,
        })),
      ]);
    } catch (err) {
      console.error("Message send error", err);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isMounted) return null;

  const isLeftSide = position.x < window.innerWidth / 2;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed bottom-28 z-40 w-105 sm:w-130 flex flex-col bg-[#0a1017]/95 border border-[#1e293b] rounded-2xl backdrop-blur-xl shadow-2xl ${
              isLeftSide ? "left-6" : "right-6"
            }`}
            style={{ height: "600px" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e293b]">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-[#00e5ff]" />
                <span className="text-white font-semibold text-[15px]">
                  EventSwarm Supervisor
                </span>
              </div>

              <button onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${
                    m.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap ${
                      m.sender === "user"
                        ? "bg-[#00e5ff] text-black"
                        : "bg-[#1e293b] text-white"
                    }`}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.text}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}

              {isTyping && (
                <Loader2 className="w-5 h-5 animate-spin text-[#00e5ff]" />
              )}

              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[#1e293b]">
              <form
                onSubmit={handleSendMessage}
                className="flex gap-2 items-center"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2"
                >
                  <Paperclip className="w-4 h-4 text-gray-400" />
                </button>

                <button type="button" onClick={toggleRecording}>
                  {isRecording ? (
                    <Square className="w-4 h-4 text-red-500" />
                  ) : (
                    <Mic className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                <input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask supervisor..."
                  className="flex-1 bg-[#0a1017] border border-[#1e293b] rounded-full px-4 py-2 text-white text-[14px]"
                />

                <button type="submit">
                  <Send className="w-4 h-4 text-[#00e5ff]" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Orb */}
      <motion.div
        drag
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={toggleChat}
        animate={position}
        className="fixed z-50 cursor-grab"
        style={{ left: 0, top: 0 }}
      >
        <div className="w-16 h-16 rounded-full bg-[#00e5ff] flex items-center justify-center shadow-lg">
          <Mic className="w-7 h-7 text-black" />
        </div>
      </motion.div>
    </>
  );
}
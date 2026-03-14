

"use client";

import { Mic, X, Send, Brain, Loader2, Square, Paperclip } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { socket } from "@/lib/socket";
import { createPortal } from "react-dom";

type Message = {
  id: string;
  sender: "user" | "supervisor";
  text: string;
};

/* Typewriter component — reveals text char-by-char like ChatGPT */
function TypingMessage({ text, onDone }: { text: string; onDone: () => void }) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed("");
    const interval = setInterval(() => {
      const next = indexRef.current + 1;
      setDisplayed(text.slice(0, next));
      indexRef.current = next;
      if (next >= text.length) {
        clearInterval(interval);
        onDone();
      }
    }, 10); // ~10ms per char — fast but visible
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {displayed || " "}
    </ReactMarkdown>
  );
}

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
  const [typingIds, setTypingIds] = useState<Set<string>>(new Set());

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

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  /* ---------------- INITIAL MESSAGE ---------------- */

  useEffect(() => {
    if (!initialAiMessage || initialAiMessage.length === 0) return;

    const aiMessages = initialAiMessage
      .filter((m: any) => m.role === "AIMessage" || m.role === "ToolMessage")
      .map((m: any) => {
        // Strip the routing commands so the user still sees the core message
        let cleanText = m.content || "";
        cleanText = cleanText.replace(/ROUTE_TO:.*$/, "").trim();

        return {
          id: Date.now().toString() + Math.random(),
          sender: "supervisor" as const,
          text: cleanText,
        };
      })
      .filter((m: any) => m.text.length > 0);

    const newMsgs = aiMessages;
    setMessages((prev) => [...prev, ...newMsgs]);
    // Trigger typewriter animation for newly added messages
    setTypingIds(new Set(newMsgs.map((m: any) => m.id)));
    setIsOpen(true);
  }, [initialAiMessage]);

  /* ---------------- SOCKET ---------------- */

  useEffect(() => {
    socket.on("supervisor_reply", (data: { text: string }) => {
      const newId = Date.now().toString();
      setMessages((prev) => [
        ...prev,
        {
          id: newId,
          sender: "supervisor" as const,
          text: data.text,
        },
      ]);
      // Trigger typewriter for this message
      setTypingIds((prev) => new Set([...prev, newId]));
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

  const toggleChat = () => {
    setIsOpen(!isOpen);
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

      const newMsgs = aiMessages.map((m: any) => ({
        id: Date.now().toString() + Math.random(),
        sender: "supervisor" as const,
        text: m.content,
      }));

      setMessages((prev) => [...prev, ...newMsgs]);
      // Trigger typewriter animation for each new AI message
      setTypingIds(new Set(newMsgs.map((m: any) => m.id)));
    } catch (err) {
      console.error("Message send error", err);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isMounted) return null;

  const content = (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-40 w-[90vw] sm:w-[520px] max-w-full flex flex-col bg-[#0d1117] border border-[#30363d] rounded-2xl shadow-2xl"
            style={{ height: "600px", fontFamily: "var(--font-geist-sans, 'Inter', ui-sans-serif, system-ui, sans-serif)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#30363d]">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-[#00e5ff]" />
                <span
                  className="text-white font-bold text-[15px] tracking-wider"
                  style={{ fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)", letterSpacing: "0.05em" }}
                >
                  Event Swarm
                </span>
              </div>

              <button onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
              {messages.map((m, idx) => (
                <div
                  key={m.id}
                  className={`flex ${
                    m.sender === "user" ? "justify-end" : "justify-start items-end gap-2"
                  }`}
                >
                  {m.sender === "supervisor" && (
                    <div className="w-7 h-7 rounded-full bg-[#00e5ff] flex-shrink-0 flex items-center justify-center mb-1">
                      <Brain className="w-3.5 h-3.5 text-black" />
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] px-4 py-3 rounded-2xl text-[13.5px] leading-relaxed ${
                      m.sender === "user"
                        ? "bg-[#1f6feb] text-white rounded-br-sm"
                        : "bg-[#161b22] text-[#e6edf3] rounded-bl-sm border border-[#30363d]"
                    }`}
                  >
                    {/* Animate fresh supervisor messages with typewriter effect */}
                    {m.sender === "supervisor" && typingIds.has(m.id) ? (
                      <TypingMessage
                        text={m.text}
                        onDone={() => setTypingIds((prev) => {
                          const next = new Set(prev);
                          next.delete(m.id);
                          return next;
                        })}
                      />
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.text}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}

              {/* ChatGPT-style typing animation */}
              {isTyping && (
                <div className="flex items-end gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#00e5ff] flex-shrink-0 flex items-center justify-center">
                    <Brain className="w-3.5 h-3.5 text-black" />
                  </div>
                  <div className="bg-[#161b22] border border-[#30363d] px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#8b949e] animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
                    <span className="w-2 h-2 rounded-full bg-[#8b949e] animate-bounce" style={{ animationDelay: '160ms', animationDuration: '1s' }} />
                    <span className="w-2 h-2 rounded-full bg-[#8b949e] animate-bounce" style={{ animationDelay: '320ms', animationDuration: '1s' }} />
                  </div>
                </div>
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

      {/* Floating Orb fixed to Top Center, just below header */}
      <motion.div
        id="step-voice-orb"
        onClick={toggleChat}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed z-50 top-4 left-1/2 -translate-x-1/2 cursor-pointer"
      >
        <div className="w-14 h-14 rounded-full bg-[#00e5ff] flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.5)]">
          <Mic className="w-6 h-6 text-black" />
        </div>
      </motion.div>
    </>
  );

  return createPortal(content, document.body);
}
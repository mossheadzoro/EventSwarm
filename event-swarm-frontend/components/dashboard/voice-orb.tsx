// "use client";

// import { Mic, X, Send, Brain, User, Loader2, Square, Paperclip } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import { useState, useEffect, useRef } from "react";
// import { socket } from "@/lib/socket"; 

// type Message = {
//   id: string;
//   sender: "user" | "supervisor";
//   text: string;
// };

// // We pass activeJob and initialAiMessage from the Swarm Engine
// export function FloatingVoice({ activeJob, initialAiMessage }: { activeJob?: any, initialAiMessage?: string | null }) {
//   // --- LAYOUT & DRAG STATE ---
//   const [position, setPosition] = useState({ x: 0, y: 0 });
//   const [isMounted, setIsMounted] = useState(false);
//   const isDragging = useRef(false);
  
//   // --- CHAT UI STATE ---
//   const [isOpen, setIsOpen] = useState(false);
//   const [inputText, setInputText] = useState("");
//   const [isTyping, setIsTyping] = useState(false);
//   const [messages, setMessages] = useState<Message[]>([
//     { id: "1", sender: "supervisor", text: "System initialized. Waiting for swarm execution..." }
//   ]);

//   // --- AUDIO RECORDING STATE & REFS ---
//   const [isRecording, setIsRecording] = useState(false);
//   const [isTranscribing, setIsTranscribing] = useState(false); 
//   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
//   const audioChunksRef = useRef<BlobPart[]>([]);
  
//   // --- FILE UPLOAD REF ---
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   // 1. Initial Positioning (Check memory first, fallback to Bottom Right)
//   useEffect(() => {
//     const orbSize = 64;
//     const padding = 24;

//     const savedPosition = localStorage.getItem("voiceOrbPosition");
    
//     if (savedPosition) {
//       try {
//         const parsedPos = JSON.parse(savedPosition);
//         setPosition(parsedPos);
//         setIsMounted(true);
//         return; // Exit early so we don't overwrite it
//       } catch (e) {
//         console.error("Failed to parse saved orb position", e);
//       }
//     }

//     // Fallback if no saved position exists
//     setPosition({
//       x: window.innerWidth - orbSize - padding,
//       y: window.innerHeight - orbSize - padding,
//     });
//     setIsMounted(true);
//   }, []);

//   // 2. Listen for the initial AI message from the Swarm Engine Setup
//   useEffect(() => {
//     if (initialAiMessage) {
//       setMessages((prev) => [
//         ...prev,
//         { id: Date.now().toString(), sender: "supervisor", text: initialAiMessage }
//       ]);
//       // Pop open the chat automatically so the user knows the AI is talking
//       setIsOpen(true);
//     }
//   }, [initialAiMessage]);

//   // 3. Listen for replies from the Python Supervisor via Socket
//   useEffect(() => {
//     socket.on("supervisor_reply", (data: { text: string }) => {
//       setMessages((prev) => [
//         ...prev, 
//         { id: Date.now().toString(), sender: "supervisor", text: data.text }
//       ]);
//       setIsTyping(false); // Turn off typing indicator
//     });

//     return () => { 
//       socket.off("supervisor_reply"); 
//     };
//   }, []);

//   // --- DRAG HANDLERS ---
//   const handleDragStart = () => { 
//     isDragging.current = true; 
//   };

//   const handleDragEnd = (event: any, info: any) => {
//     const screenWidth = window.innerWidth;
//     const screenHeight = window.innerHeight;
//     const orbSize = 64;
//     const padding = 24;

//     // Snap to left or right edges
//     const snapX = info.point.x < screenWidth / 2 ? padding : screenWidth - orbSize - padding;
    
//     // Keep vertically inside the screen
//     let snapY = info.point.y;
//     if (snapY < padding) snapY = padding;
//     if (snapY > screenHeight - orbSize - padding) snapY = screenHeight - orbSize - padding;

//     const newPosition = { x: snapX, y: snapY };
//     setPosition(newPosition);
    
//     // SAVE THE NEW POSITION TO MEMORY HERE
//     localStorage.setItem("voiceOrbPosition", JSON.stringify(newPosition));
    
//     // Prevent accidental click right after dropping
//     setTimeout(() => { isDragging.current = false; }, 150);
//   };

//   const toggleChat = () => {
//     if (!isDragging.current) setIsOpen(!isOpen);
//   };

//   // --- AUDIO RECORDING LOGIC (Using your Deepgram API) ---
//   const toggleRecording = async () => {
//     if (isRecording) {
//       mediaRecorderRef.current?.stop();
//       setIsRecording(false);
//       return;
//     }

//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       const mediaRecorder = new MediaRecorder(stream);
//       mediaRecorderRef.current = mediaRecorder;
//       audioChunksRef.current = [];

//       mediaRecorder.ondataavailable = (event) => {
//         if (event.data.size > 0) {
//           audioChunksRef.current.push(event.data);
//         }
//       };

//       mediaRecorder.onstop = async () => {
//         setIsTranscribing(true);
//         const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        
//         try {
//           const res = await fetch("/api/transcribe", {
//             method: "POST",
//             headers: {
//               "Content-Type": "audio/webm",
//             },
//             body: audioBlob,
//           });
          
//           const data = await res.json();
          
//           if (data.text) {
//             setInputText(data.text);
//           }
//         } catch (error) {
//           console.error("Transcription error:", error);
//         } finally {
//           setIsTranscribing(false);
//           stream.getTracks().forEach(track => track.stop());
//         }
//       };

//       mediaRecorder.start();
//       setIsRecording(true);
//     } catch (err) {
//       console.error("Microphone access denied or failed:", err);
//       alert("Please allow microphone permissions to use voice commands.");
//     }
//   };

//   // --- FILE UPLOAD HANDLER ---
//   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     // Add user message to UI immediately
//     setMessages((prev) => [
//       ...prev, 
//       { id: Date.now().toString(), sender: "user", text: `📎 Uploaded: ${file.name}` }
//     ]);
//     setIsTyping(true);

//     try {
//       const fd = new FormData();
//       fd.append("file", file); // The actual CSV file
      
//       // Send the current input text if they typed something, otherwise leave blank
//       if (inputText.trim()) {
//         fd.append("message", inputText); 
//         setInputText(""); // Clear input
//       }
      
//       // CRITICAL: Ensure we are using the newly generated thread_id
//       const currentThread = activeJob?.thread_id || "default_thread";
//       console.log("📎 Voice Orb uploading file to Swarm on Thread:", currentThread);
//       fd.append("thread_id", currentThread);

//       const res = await fetch("/api/agent/chat_with_file", {
//         method: "POST",
//         body: fd,
//       });

//       const data = await res.json();

//       if (res.ok && data.messages) {
//         const aiMessage = data.messages.filter((m: any) => m.role === "AIMessage").pop();
//         if (aiMessage) {
//           setMessages((prev) => [
//             ...prev, 
//             { id: Date.now().toString(), sender: "supervisor", text: aiMessage.content }
//           ]);
//         }
//       } else {
//         console.error("Agent file error:", data.error);
//       }
//     } catch (error) {
//       console.error("File Upload Error:", error);
//     } finally {
//       setIsTyping(false);
//       // Reset the input so they can upload the same file again if needed
//       if (fileInputRef.current) fileInputRef.current.value = ""; 
//     }
//   };

//   // --- SEND MESSAGE TO AGENT API ---
//   const handleSendMessage = async (e?: React.FormEvent) => {
//     e?.preventDefault();
//     if (!inputText.trim()) return;

//     const textToSend = inputText;
    
//     // 1. Add user message to UI immediately
//     setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "user", text: textToSend }]);
//     setInputText("");
//     setIsTyping(true); 

//     try {
//       // CRITICAL: Define and log the thread ID to prove frontend isn't dropping it
//       const currentThread = activeJob?.thread_id || "default_thread";
//       console.log("🗣️ Voice Orb sending to Swarm on Thread:", currentThread);

//       // 2. Call the Next.js proxy endpoint
//       const res = await fetch("/api/agent/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           message: textToSend,
//           thread_id: currentThread, 
//         }),
//       });

//       const data = await res.json();

//       if (res.ok && data.messages) {
//         // 3. Extract the AI's reply from the response and add to UI
//         const aiMessage = data.messages.filter((m: any) => m.role === "AIMessage").pop();
        
//         if (aiMessage) {
//           setMessages((prev) => [
//             ...prev, 
//             { id: Date.now().toString(), sender: "supervisor", text: aiMessage.content }
//           ]);
//         }
//       } else {
//         console.error("Failed to get agent response:", data.error);
//       }
//     } catch (error) {
//       console.error("Chat Error:", error);
//     } finally {
//       setIsTyping(false);
//     }
//   };

//   if (!isMounted) return null;
  
//   // Decide which side the chat window should spawn so it doesn't go off-screen
//   const isLeftSide = position.x < window.innerWidth / 2;

//   return (
//     <>
//       <AnimatePresence>
//         {isOpen && (
//           <motion.div
//             initial={{ opacity: 0, scale: 0.8, y: 20 }}
//             animate={{ opacity: 1, scale: 1, y: 0 }}
//             exit={{ opacity: 0, scale: 0.8, y: 20, transition: { duration: 0.2 } }}
//             className={`fixed z-40 bottom-28 w-80 sm:w-96 flex flex-col bg-[#0a1017]/95 backdrop-blur-xl border border-[#1e293b] rounded-2xl shadow-[0_0_40px_rgba(0,229,255,0.1)] overflow-hidden ${
//               isLeftSide ? "left-6" : "right-6"
//             }`}
//             style={{ height: "450px" }}
//           >
//             {/* Header */}
//             <div className="flex items-center justify-between px-4 py-3 bg-[#0d141f] border-b border-[#1e293b]">
//               <div className="flex items-center gap-2">
//                 <Brain className="w-5 h-5 text-[#00e5ff]" />
//                 <span className="text-white font-semibold tracking-wide">Supervisor Agent</span>
//               </div>
//               <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             {/* Messages Area */}
//             <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
//               {messages.map((msg) => (
//                 <div key={msg.id} className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
//                   <div className={`flex items-start gap-2 max-w-[85%] ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
//                     <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 ${
//                       msg.sender === "user" ? "bg-purple-500/20 text-purple-400" : "bg-[#00e5ff]/20 text-[#00e5ff]"
//                     }`}>
//                       {msg.sender === "user" ? <User className="w-3 h-3" /> : <Brain className="w-3 h-3" />}
//                     </div>
//                     <div className={`p-3 rounded-2xl text-sm ${
//                       msg.sender === "user" 
//                         ? "bg-[#1e293b] text-white rounded-tr-none border border-[#334155]" 
//                         : "bg-[#00e5ff]/10 text-gray-200 rounded-tl-none border border-[#00e5ff]/20"
//                     }`}>
//                       {msg.text}
//                     </div>
//                   </div>
//                 </div>
//               ))}
              
//               {/* Typing Indicator */}
//               {isTyping && (
//                 <div className="flex w-full justify-start">
//                   <div className="flex items-center gap-2 bg-[#00e5ff]/10 border border-[#00e5ff]/20 rounded-2xl rounded-tl-none p-3">
//                     <Loader2 className="w-4 h-4 text-[#00e5ff] animate-spin" />
//                     <span className="text-xs text-[#00e5ff]">Supervisor is thinking...</span>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Input Area */}
//             <div className="p-3 bg-[#0d141f] border-t border-[#1e293b]">
//               <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                
//                 {/* HIDDEN FILE INPUT */}
//                 <input 
//                   type="file" 
//                   accept=".csv" // The API expects CSVs
//                   ref={fileInputRef} 
//                   onChange={handleFileUpload} 
//                   className="hidden" 
//                 />

//                 {/* ATTACH FILE BUTTON */}
//                 <button 
//                   type="button"
//                   onClick={() => fileInputRef.current?.click()}
//                   className="p-2 rounded-full transition-all flex items-center justify-center shrink-0 w-9 h-9 bg-[#1e293b] text-gray-400 hover:text-white"
//                   title="Upload CSV"
//                 >
//                   <Paperclip className="w-4 h-4" />
//                 </button>

//                 {/* RECORDING BUTTON */}
//                 <button 
//                   type="button"
//                   onClick={toggleRecording}
//                   className={`p-2 rounded-full transition-all flex items-center justify-center shrink-0 w-9 h-9 ${
//                     isRecording 
//                       ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse" 
//                       : "bg-[#1e293b] text-gray-400 hover:text-white"
//                   }`}
//                 >
//                   {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
//                 </button>
                
//                 <input 
//                   type="text"
//                   value={inputText}
//                   onChange={(e) => setInputText(e.target.value)}
//                   placeholder={
//                     isRecording ? "Listening..." : 
//                     isTranscribing ? "Transcribing..." : 
//                     "Command the swarm..."
//                   }
//                   disabled={isRecording || isTranscribing}
//                   className="flex-1 bg-[#0a1017] border border-[#1e293b] rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-[#00e5ff] transition-colors disabled:opacity-50"
//                 />
                
//                 <button 
//                   type="submit"
//                   disabled={!inputText.trim() || isRecording || isTranscribing}
//                   className="p-2 bg-[#00e5ff] text-black rounded-full hover:bg-cyan-400 disabled:opacity-50 disabled:hover:bg-[#00e5ff] transition-colors shrink-0 w-9 h-9 flex items-center justify-center"
//                 >
//                   {isTranscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
//                 </button>
//               </form>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* --- DRAGGABLE ORB --- */}
//       <motion.div
//         drag
//         dragMomentum={false}
//         onDragStart={handleDragStart}
//         onDragEnd={handleDragEnd}
//         onClick={toggleChat}
//         initial={position} 
//         animate={position}
//         className="fixed z-50 cursor-grab active:cursor-grabbing"
//         style={{ left: 0, top: 0 }}
//       >
//         <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
//           isOpen 
//             ? "bg-[#0a1017] border-2 border-[#00e5ff] shadow-[0_0_30px_rgba(0,229,255,0.6)]" 
//             : "bg-[#00e5ff] shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:shadow-[0_0_30px_rgba(0,229,255,0.6)]"
//         }`}>
//           <Mic className={`w-7 h-7 transition-colors ${isOpen ? "text-[#00e5ff]" : "text-black"}`} />
//         </div>
//       </motion.div>
//     </>
//   );
// }



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
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
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
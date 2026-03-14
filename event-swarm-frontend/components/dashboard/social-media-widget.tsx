// components/dashboard/social-widget.tsx
"use client";

import { useState, useEffect } from "react";
import { ImageIcon, Sparkles, RefreshCcw, CheckCircle2, Send } from "lucide-react";
import { Button } from "../ui/button";
import { socket } from "@/lib/socket";

export default function SocialWidget({ activeJob, onComplete }: any) {
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [platform, setPlatform] = useState("Twitter");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    socket.on("ai_suggestions", (data: any) => {
      if (data.type === "social_hype") {
        setCaption(data.caption || (data.suggestions ? data.suggestions[0] : ""));
        setImage(data.image || null);
        setIsProcessing(false);
        setIsApproved(false);
      }
    });
    return () => { socket.off("ai_suggestions"); };
  }, []);

  const handleRecreate = () => {
    setIsProcessing(true);
    socket.emit("supervisor_command", {
      jobId: activeJob?._id,
      command: "Recreate the social media post. Give me a new variation."
    });
  };

  const handleApproveAndPost = async () => {
    if (!caption || !activeJob) return;
    setIsProcessing(true);
    try {
      // Your JS Backend API for saving the approved post
      const res = await fetch("/api/social/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: activeJob._id, tagline: caption, image_url: image, platform }),
      });

      if (res.ok) {
        socket.emit("agent_action", {
          jobId: activeJob._id, action: "approve_hype", payload: { caption, image, platform }
        });
        setIsApproved(true);
        setTimeout(() => { if(onComplete) onComplete(); }, 3000); // Move to next phase
      }
    } catch (err) {
      console.error("Approval error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#0f171e] border border-[#1e293b] rounded-2xl p-6 mt-6 space-y-6 shadow-2xl relative overflow-hidden">
      {isApproved && (
        <div className="absolute inset-0 z-10 bg-[#0f171e]/90 backdrop-blur-sm flex flex-col items-center justify-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
          <h3 className="text-xl font-bold text-white">Deployed to {platform}</h3>
        </div>
      )}

      <div className="flex items-center justify-between text-white font-semibold">
        <div className="flex items-center"><Sparkles className="w-5 h-5 mr-2 text-purple-400" /> AI Social Orchestrator</div>
        <div className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-1 rounded uppercase tracking-widest">Phase: Hype</div>
      </div>

      <div className="relative bg-[#020617] border border-[#1e293b] rounded-xl overflow-hidden h-48 w-full flex items-center justify-center group">
        {isProcessing ? (
          <div className="flex flex-col items-center text-[#00e5ff] animate-pulse"><Sparkles className="w-6 h-6 mb-2" /><span className="text-xs">AI Generating Asset...</span></div>
        ) : image ? (
          <img src={image} alt="AI Asset" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <span className="text-gray-500 text-sm flex items-center gap-2"><ImageIcon className="w-4 h-4" />Waiting for AI Image...</span>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-2"><p className="text-gray-400 text-xs uppercase">AI Tagline</p><span className="text-[10px] text-[#00e5ff]/50">Editable</span></div>
        <textarea rows={3} value={caption} onChange={(e) => setCaption(e.target.value)} disabled={isProcessing} placeholder="Waiting for AI to draft caption..." className="w-full bg-[#020617] border border-[#1e293b] text-gray-200 text-sm p-4 rounded-xl focus:outline-none focus:border-[#00e5ff]" />
      </div>

      <div className="flex gap-2">
        {["Twitter", "Instagram", "Facebook"].map((p) => (
          <button key={p} onClick={() => setPlatform(p)} disabled={isProcessing} className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase border transition-all ${platform === p ? "bg-white text-black border-white" : "bg-transparent text-gray-500 border-[#1e293b]"}`}>{p}</button>
        ))}
      </div>

      <div className="flex gap-3">
        <Button onClick={handleRecreate} disabled={isProcessing || (!caption && !image)} className="bg-[#1e293b] hover:bg-[#334155] text-white border border-[#334155] h-12 px-4 rounded-xl"><RefreshCcw className={`w-5 h-5 ${isProcessing ? "animate-spin" : ""}`} /></Button>
        <Button onClick={handleApproveAndPost} disabled={!caption || isProcessing} className="flex-1 h-12 bg-[#00e5ff] hover:bg-cyan-400 text-black font-bold text-sm uppercase rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.2)]">
          {isProcessing ? "Processing..." : "Approve & Deploy"} {!isProcessing && <Send className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { ImageIcon, Sparkles, CheckCircle2, Save } from "lucide-react";
import { Button } from "../ui/button";

export default function SocialWidget({ activeJob, onComplete }: any) {
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [platform, setPlatform] = useState("Twitter");

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  /* ---------------- CATCH AI CHAT DATA ---------------- */
  useEffect(() => {
    const handleChatUpdate = (e: any) => {
      const payload = e.detail;

      if (payload && payload.messages) {
        // Find all AI messages in the recent response
        const aiMessages = payload.messages.filter((m: any) => m.role === "AIMessage");

        let foundNewImage = null;
        let foundNewCaption = "";

        aiMessages.forEach((msg: any) => {
          const content = msg.content;

          // 1. Extract Image URL: Looks for ![alt](url)
          const imgMatch = content.match(/!\[.*?\]\((.*?)\)/);
          if (imgMatch && imgMatch[1]) {
            foundNewImage = imgMatch[1];
          }

          // 2. Extract Tagline: Hunts for a colon, newlines, and then text inside ""
          // Example target: :\n\n"This is the tagline"
          const exactQuoteMatch = content.match(/:\s*\n+"([^"]+)"/);

          if (exactQuoteMatch && exactQuoteMatch[1]) {
            foundNewCaption = exactQuoteMatch[1]; // Grabs just the text inside the quotes
          } else {
            // Fallback: If it just uses quotes anywhere in the message (and it's longer than 15 chars)
            const fallbackMatch = content.match(/"([^"]{15,})"/);
            if (!foundNewCaption && fallbackMatch && fallbackMatch[1]) {
              foundNewCaption = fallbackMatch[1];
            }
          }
        });

        // Update states if we found new data
        if (foundNewImage) {
          setImage(foundNewImage);
        }

        if (foundNewCaption) {
          setCaption(foundNewCaption.trim());
          setIsSaved(false); // Reset save state since we have a new caption
        }
      }
    };

    window.addEventListener("ai_chat_update", handleChatUpdate);
    return () => window.removeEventListener("ai_chat_update", handleChatUpdate);
  }, []);

  /* ---------------- PHYSICAL APPROVAL & DB SAVE ---------------- */
  const handleApproveAndSave = async () => {
    if (!caption || !activeJob) return;
    setIsProcessing(true);

    try {
      // Physically save the post to your MongoDB
      const res = await fetch("/api/social/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: activeJob._id,
          caption: caption,
          image_url: image,
          platform,
          status: "draft" // Saving for later manual publishing
        }),
      });

      if (res.ok) {
        setIsSaved(true);

        // Tell the Chat Orb that we approved it so it can move on
        window.dispatchEvent(
          new CustomEvent("external_chat_command", { detail: "APPROVED" })
        );

        // Notify parent (Dashboard) to scroll to the next widget
        setTimeout(() => { if (onComplete) onComplete(); }, 2000);
      }
    } catch (err) {
      console.error("Database save error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#0a1017] border border-[#1e293b] rounded-2xl p-6 mt-6 shadow-[0_0_40px_rgba(0,229,255,0.05)] relative overflow-hidden transition-all duration-500 ease-in-out">

      {/* Success Overlay with Smooth Fade */}
      <div
        className={`absolute inset-0 z-10 bg-[#0a1017]/90 backdrop-blur-md flex flex-col items-center justify-center transition-opacity duration-500 ${isSaved ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        <CheckCircle2 className={`w-16 h-16 text-green-500 mb-4 ${isSaved ? "animate-bounce" : ""}`} />
        <h3 className="text-xl font-bold text-white">Saved to Database!</h3>
        <p className="text-gray-400 text-sm mt-2">Ready for scheduled posting.</p>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between text-white font-semibold mb-6">
        <div className="flex items-center text-[#00e5ff]">
          <Sparkles className="w-5 h-5 mr-2" />
          AI Art & Social Director
        </div>
      </div>

      {/* Image Preview Box with Smooth Fade-in */}
      <div className="relative bg-[#020617] border border-[#1e293b] rounded-xl overflow-hidden h-72 w-full flex items-center justify-center group mb-6">
        {image ? (
          <img
            src={image}
            alt="AI Generated Asset"
            className="w-full h-full object-contain animate-in fade-in zoom-in duration-700"
          />
        ) : (
          <div className="flex flex-col items-center text-gray-500 transition-opacity">
            <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-sm">Awaiting Visual Assets...</span>
          </div>
        )}
      </div>

      {/* Caption Box */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Social Caption</p>
          <span className="text-[10px] text-[#00e5ff]/50">Editable</span>
        </div>
        <textarea
          rows={4}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          disabled={isProcessing}
          placeholder="Awaiting AI copy..."
          className="w-full bg-[#020617] border border-[#1e293b] text-gray-200 text-sm p-4 rounded-xl focus:outline-none focus:border-[#00e5ff] transition-all resize-none shadow-inner"
        />
      </div>

      {/* Platform Selector */}
      <div className="flex gap-2 mb-6">
        {["Twitter", "Instagram", "LinkedIn"].map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            disabled={isProcessing}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase transition-all border ${platform === p
                ? "bg-[#00e5ff] text-black border-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.4)]"
                : "bg-transparent text-gray-500 border-[#1e293b] hover:border-gray-500"
              }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Save Button */}
      <Button
        onClick={handleApproveAndSave}
        disabled={!caption || isProcessing}
        className="w-full h-12 bg-green-500 hover:bg-green-400 text-black font-bold text-lg uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-green-500"
      >
        {isProcessing ? "Saving to DB..." : "Approve & Save"}
        {!isProcessing && <Save className="w-5 h-5 ml-2" />}
      </Button>

    </div>
  );
}
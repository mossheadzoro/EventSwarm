"use client";

import { useState, useEffect } from "react";
import { Mail, CheckCircle2, Send, Paperclip, ImageIcon } from "lucide-react";
import { Button } from "../ui/button";

export default function EmailWidget({ activeJob, onComplete, activeThreadId }: any) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  /* ---------------- CATCH AI CHAT DATA ---------------- */
  useEffect(() => {
    const handleChatUpdate = (e: any) => {
      const payload = e.detail;

      if (payload && payload.messages) {
        // We only care about AIMessages
        const aiMessages = payload.messages.filter((m: any) => m.role === "AIMessage");

        let foundSubject = "";
        let foundBody = "";
        let foundAttachment = null;

        aiMessages.forEach((msg: any) => {
          const content = msg.content;

          // 1. Extract Subject
          const subjectMatch = content.match(/Subject:\s*([^\n]+)/i);
          if (subjectMatch && subjectMatch[1]) {
            foundSubject = subjectMatch[1].trim();
          }

          // 2. Extract Body using "Dear" as the anchor point
          if (content.includes("Dear")) {
            const splitByDear = content.split(/(?=Dear)/);

            if (splitByDear.length > 1) {
              let extractedBody = splitByDear.slice(1).join("").trim();

              // Clean up the end of the email
              extractedBody = extractedBody.split("---")[0];
              extractedBody = extractedBody.split("Please review")[0];

              foundBody = extractedBody.trim();
            }
          }

          // 3. Extract Attachment (Poster URL)
          const imgMatch = content.match(/(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif))\b/i);
          if (imgMatch && imgMatch[1]) {
            foundAttachment = imgMatch[1];
          }
        });

        // Update states
        if (foundSubject) setSubject(foundSubject);
        if (foundBody) setBody(foundBody);
        if (foundAttachment) setAttachment(foundAttachment);

        if (foundSubject || foundBody) {
          setIsApproved(false);
        }
      }
    };

    window.addEventListener("ai_chat_update", handleChatUpdate);
    return () => window.removeEventListener("ai_chat_update", handleChatUpdate);
  }, []);

  /* ---------------- PHYSICAL APPROVAL & SEND EDITS ---------------- */
  const handleApproveAndSend = async () => {
    if (!subject || !body || isProcessing) return;
    setIsProcessing(true);

    try {
      // 1. Construct a command that forces the AI to use your exact (potentially edited) text.
      // If there is an attachment, we tell the AI to include it.
      let overrideCommand = `APPROVE. Please send the emails using exactly this subject:\n"${subject}"\n\nAnd exactly this body:\n"${body}"`;

      if (attachment) {
        overrideCommand += `\n\nMake sure to include this image link as the attachment: ${attachment}`;
      }

      // 2. Send the override command back to the AI backend
      await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: overrideCommand,
          thread_id: activeThreadId || (activeJob && activeJob.thread_id)
        }),
      });

      // 3. Sync with the Voice Orb UI. 
      // We just show "APPROVE (with manual edits)" in the chat UI so the user knows what happened,
      // without dumping the massive wall of text into the chat bubble.
      window.dispatchEvent(
        new CustomEvent("external_chat_command", { detail: "APPROVE (with manual edits applied)" })
      );

      setIsApproved(true);

      // 4. Notify parent to move to the next phase
      setTimeout(() => { if (onComplete) onComplete(); }, 2000);

    } catch (err) {
      console.error("Failed to approve and send emails:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#0a1017] border border-[#1e293b] rounded-2xl p-6 mt-6 shadow-[0_0_40px_rgba(0,229,255,0.05)] relative overflow-hidden transition-all duration-500 ease-in-out">

      {/* Success Overlay with Smooth Fade */}
      <div
        className={`absolute inset-0 z-10 bg-[#0a1017]/90 backdrop-blur-md flex flex-col items-center justify-center transition-opacity duration-500 ${isApproved ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        <CheckCircle2 className={`w-16 h-16 text-green-500 mb-4 ${isApproved ? "animate-bounce" : ""}`} />
        <h3 className="text-xl font-bold text-white">Campaign Dispatched!</h3>
        <p className="text-gray-400 text-sm mt-2">Emails are being sent to all participants.</p>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between text-white font-semibold mb-6">
        <div className="flex items-center text-[#00e5ff]">
          <Mail className="w-5 h-5 mr-2" />
          AI Communications Director
        </div>
      </div>

      {/* Subject Line */}
      <div className="mb-4">
        <p className="text-gray-400 text-xs mb-2 uppercase font-bold tracking-wider">
          Email Subject <span className="text-[10px] text-[#00e5ff]/50 ml-2 normal-case font-normal">Editable</span>
        </p>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Awaiting AI subject line..."
          disabled={isProcessing}
          className="w-full bg-[#020617] border border-[#1e293b] text-white p-3 rounded-lg focus:border-[#00e5ff] outline-none transition-colors"
        />
      </div>

      {/* Email Body */}
      <div className="mb-4">
        <p className="text-gray-400 text-xs mb-2 uppercase font-bold tracking-wider">
          Email Body Template <span className="text-[10px] text-[#00e5ff]/50 ml-2 normal-case font-normal">Editable</span>
        </p>
        <textarea
          rows={14}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Awaiting AI email draft..."
          disabled={isProcessing}
          className="w-full bg-[#020617] border border-[#1e293b] text-white p-3 rounded-lg focus:border-[#00e5ff] outline-none transition-colors resize-none custom-scrollbar"
        />
      </div>

      {/* Attachment Preview (If poster exists) */}
      {attachment && (
        <div className="mb-6 bg-[#020617] border border-[#1e293b] p-3 rounded-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded bg-[#0a1017] border border-[#1e293b] overflow-hidden flex-shrink-0 flex items-center justify-center">
            {attachment ? (
              <img src={attachment} alt="Attachment Preview" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-5 h-5 text-gray-500" />
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm text-gray-200 font-medium flex items-center gap-2">
              <Paperclip className="w-3 h-3 text-[#00e5ff]" />
              Event_Poster_Attachment.png
            </p>
            <p className="text-xs text-gray-500 truncate">{attachment}</p>
          </div>
        </div>
      )}

      {/* Save / Approve Button */}
      <Button
        onClick={handleApproveAndSend}
        disabled={!subject || !body || isProcessing}
        className="w-full h-12 bg-green-500 hover:bg-green-400 text-black font-bold text-lg uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-green-500"
      >
        {isProcessing ? "Dispatching..." : "Approve & Send Emails"}
        {!isProcessing && <Send className="w-5 h-5 ml-2" />}
      </Button>

    </div>
  );
}
"use client";

import React from "react";
import { PenTool, CheckCircle } from "lucide-react";
import { Button } from "../ui/button";

export function TaglineWidget({ taglines, onApprove }: { taglines: string[]; onApprove: () => void }) {
  if (!taglines || taglines.length === 0) return null;

  return (
    <div className="bg-[#0a1017] border border-[#1e293b] rounded-2xl p-6 shadow-[0_0_40px_rgba(0,229,255,0.05)] w-full relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-[#00e5ff] opacity-10 blur-[80px] pointer-events-none"></div>
      
      <div className="relative z-10">
        <h3 className="text-[#00e5ff] text-xl font-bold mb-6 flex items-center gap-3">
          <div className="p-2 bg-[#00e5ff]/10 rounded-lg">
            <PenTool className="w-5 h-5" />
          </div>
          Content Strategist: Tagline Generation
        </h3>
        
        <div className="space-y-4 mb-8">
          {taglines.map((t, i) => (
            <div 
              key={i} 
              className="p-4 bg-[#1e293b]/50 hover:bg-[#1e293b] transition-colors rounded-xl text-gray-200 text-lg border border-[#334155] border-l-4 border-l-[#00e5ff]"
            >
              {t}
            </div>
          ))}
        </div>
        
        <Button 
          onClick={onApprove} 
          className="w-full h-12 bg-green-500 hover:bg-green-400 text-black font-bold text-lg rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          <CheckCircle className="w-5 h-5" />
          Approve Taglines
        </Button>
      </div>
    </div>
  );
}
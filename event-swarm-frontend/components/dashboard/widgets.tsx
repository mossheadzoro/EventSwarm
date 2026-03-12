"use client";

import React from 'react';
import { Clock, CheckCircle, Share2, Mail, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';


export const ScheduleWidget = ({activeJob}:{activeJob:any[]}) => (
  <div className="bg-[#0f171e] border border-[#1e293b] rounded-2xl p-6 flex flex-col h-full">
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center text-white font-semibold">
        <Clock className="w-5 h-5 mr-2 text-[#00e5ff]" />
        Event Schedule
      </div>
      <span className="text-gray-500 text-xs">v2.1 Draft</span>
    </div>
    <div className="relative border-l border-[#1e293b] ml-2 space-y-6 flex-1">
      <div className="relative pl-6">
        <div className="absolute w-2 h-2 bg-[#00e5ff] rounded-full -left-[4.5px] top-1.5" />
        <p className="text-[#00e5ff] text-xs font-bold mb-1">09:00 AM</p>
        <p className="text-white text-sm">Keynote: Future of AI</p>
      </div>
      <div className="relative pl-6">
        <div className="absolute w-2 h-2 bg-gray-500 rounded-full -left-[4.5px] top-1.5" />
        <p className="text-gray-400 text-xs font-bold mb-1">11:30 AM</p>
        <p className="text-gray-300 text-sm">Swarm Intelligence Panel</p>
      </div>
      <div className="relative pl-6">
        <div className="absolute w-2 h-2 bg-gray-500 rounded-full -left-[4.5px] top-1.5" />
        <p className="text-gray-500 text-xs font-bold mb-1">02:00 PM</p>
        <p className="text-gray-500 text-sm italic">Networking Workshop (Draft)</p>
      </div>
    </div>
  </div>
);

export const ApprovalWidget = () => (
  <div className="bg-[#0f171e] border border-[#1e293b] rounded-2xl p-6 mt-6">
    <div className="flex items-center text-white font-semibold mb-6">
      <CheckCircle className="w-5 h-5 mr-2 text-[#00e5ff]" />
      Approval Control
    </div>
    <Button className="w-full mb-3 bg-linear-to-r from-[#00e5ff] to-[#00bfff] text-[#080d12] hover:opacity-90 shadow-[0_0_20px_rgba(0,229,255,0.3)]">
      🚀 Approve Plan & Launch
    </Button>
    <div className="flex space-x-3">
      <Button variant="outline" className="flex-1 text-gray-300">✎ Edit</Button>
      <Button variant="outline" className="flex-1 text-gray-300">✉ Queue Mail</Button>
    </div>
  </div>
);




export const AnalyticsWidget = () => {
  const bars = [30, 45, 60, 80, 100, 75, 50, 40, 35]; // Mock heights
  
  return (
    <div className="bg-[#0f171e] border border-[#1e293b] rounded-2xl p-6 h-full flex flex-col">
      <div className="flex items-center text-white font-semibold mb-6">
        <TrendingUp className="w-5 h-5 mr-2 text-[#00e5ff]" />
        Predictive Analytics
      </div>
      
      <div className="flex justify-between items-end mb-6">
        <span className="text-gray-500 text-xs font-bold tracking-widest uppercase">Predicted Engagement</span>
        <span className="text-[#00e5ff] text-xl font-bold">84%</span>
      </div>

      {/* Bar Chart */}
      <div className="flex items-end justify-between h-32 mb-8 space-x-1">
        {bars.map((height, i) => (
          <div 
            key={i} 
            style={{ height: `${height}%` }} 
            className={`w-full rounded-t-sm transition-all duration-500 ${height === 100 ? 'bg-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.4)]' : 'bg-[#1e293b] hover:bg-[#2a374a]'}`}
          />
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#0a1017] rounded-xl p-4 border border-[#1e293b]">
          <span className="text-gray-500 text-[10px] font-bold tracking-widest uppercase block mb-1">Total Reach</span>
          <div className="flex items-end space-x-2">
            <span className="text-white text-xl font-bold">245k</span>
            <span className="text-emerald-500 text-xs mb-1">↗ +12%</span>
          </div>
        </div>
        <div className="bg-[#0a1017] rounded-xl p-4 border border-[#1e293b]">
          <span className="text-gray-500 text-[10px] font-bold tracking-widest uppercase block mb-1">Conversion</span>
          <div className="flex items-end space-x-2">
            <span className="text-white text-xl font-bold">4.2%</span>
            <span className="text-emerald-500 text-xs mb-1">↗ +0.8%</span>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <p className="text-gray-400 text-xs italic leading-relaxed border-l-2 border-[#00e5ff] pl-3">
          "The Analytics Agent suggests moving the email blast to Tuesday at 9:00 AM for maximum B2B open rates."
        </p>
      </div>
    </div>
  );
};
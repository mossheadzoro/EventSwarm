

"use client";

import React from 'react';
import Link from 'next/link';
import { Search, Bell, User } from 'lucide-react';

export function DashboardHeader() {
  return (
    <header className="flex items-center justify-between px-8 py-4 bg-[#080d12]">
      <div className="flex items-center space-x-12">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-[#00e5ff] flex items-center justify-center">
            <div className="w-3 h-3 bg-[#080d12] rounded-full" />
          </div>
          <span className="text-white text-xl font-bold tracking-tight">EventSwarm</span>
        </div>

        {/* Navigation */}
        <nav className="flex items-center space-x-8">
          <Link href="/dashboard" className="text-[#00e5ff] text-sm font-medium border-b-2 border-[#00e5ff] pb-1">
            Orchestrator
          </Link>
          <Link href="/downloads" className="text-gray-400 hover:text-white text-sm font-medium pb-1 transition-colors">
            Downloads
          </Link>
          <Link href="/feats" className="text-gray-400 hover:text-white text-sm font-medium pb-1 transition-colors">
            Feats
          </Link>
          <Link href="/history" className="text-gray-400 hover:text-white text-sm font-medium pb-1 transition-colors">
            History
          </Link>
        </nav>
      </div>

      {/* Utilities */}
      <div className="flex items-center space-x-6">
        <div className="bg-[#0f171e] rounded-full px-4 py-2 flex items-center border border-[#1e293b] w-64">
          <Search className="text-gray-500 w-4 h-4 mr-2" />
          <input
            type="text"
            placeholder="Search agents..."
            className="bg-transparent text-white placeholder-gray-500 outline-none w-full text-sm"
          />
        </div>
        <button className="text-gray-400 hover:text-white transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#00e5ff] rounded-full" />
        </button>
        <button className="w-8 h-8 rounded-full bg-[#1e293b] flex items-center justify-center hover:bg-[#2a374a] transition-colors border border-[#00e5ff]/30 text-[#00e5ff]">
          <User className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
// "use client";
// import React from "react";
// import Link from "next/link";
// import { Play, Sparkles, Megaphone, BarChart3 } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { VoiceCommand } from "@/components/voice/voice-command";
// import { FeatureCard } from "@/components/cards/feature-card";
// import { useEffect, useState } from "react";
// import ManualPrompt from "@/components/home/manual-prompt";
// import EventForm from "@/components/home/event-form";
// export default function HomePage() {
//   const [mode, setMode] = useState<"voice" | "prompt" | "form">("voice");
//   const [user, setUser] = useState<any>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchUser = async () => {
//       const res = await fetch("/api/auth/me");
//       const data = await res.json();
//       setUser(data.user);
//       setLoading(false);
//     };

//     fetchUser();
//   }, []);

//   const logout = async () => {
//     await fetch("/api/auth/logout", { method: "POST" });
//     setUser(null);
//   };
//   return (
//     <main className="min-h-screen bg-[#080d12] selection:bg-[#00e5ff]/30 text-white">
//       <div className="max-w-7xl mx-auto px-6 py-8 md:py-12">
//         {/* Navigation Header */}
//         <header className="flex items-center justify-between mb-24">
//           <div className="flex items-center space-x-3">
//             <div className="w-8 h-8 rounded-full bg-[#00e5ff] flex items-center justify-center">
//               <div className="w-3 h-3 bg-[#080d12] rounded-full" />
//             </div>
//             <span className="text-white text-2xl font-bold tracking-tight">
//               EventSwarm
//             </span>
//           </div>

//           <nav className="flex items-center space-x-8">
//             <div className="hidden md:flex items-center space-x-8 text-sm text-gray-300 font-medium">
//               <Link
//                 href="#features"
//                 className="hover:text-white transition-colors"
//               >
//                 Features
//               </Link>
//               <Link
//                 href="#solutions"
//                 className="hover:text-white transition-colors"
//               >
//                 Solutions
//               </Link>
//               <Link
//                 href="#pricing"
//                 className="hover:text-white transition-colors"
//               >
//                 Pricing
//               </Link>
//               <Link href="#docs" className="hover:text-white transition-colors">
//                 Documentation
//               </Link>
//             </div>

//             <div className="flex items-center space-x-6">
//               {loading ? null : user ? (
//                 <div className="relative group">
//                   <button className="text-gray-300 hover:text-white font-medium">
//                     {user.name}
//                   </button>

//                   <div className="absolute right-0 mt-2 w-40 bg-[#0f172a] border border-[#1e293b] rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition">
//                     <Link
//                       href="/dashboard"
//                       className="block px-4 py-2 text-sm hover:bg-[#1e293b]"
//                     >
//                       Dashboard
//                     </Link>

//                     <button
//                       onClick={logout}
//                       className="w-full text-left px-4 py-2 text-sm hover:bg-[#1e293b]"
//                     >
//                       Logout
//                     </button>
//                   </div>
//                 </div>
//               ) : (
//                 <Link
//                   href="/login"
//                   className="text-gray-300 font-medium hover:text-white transition-colors"
//                 >
//                   Login
//                 </Link>
//               )}

//               <Link href="/dashboard">
//                 <Button variant="default" className="bg-[#00e5ff] p-4">
//                   Launch Dashboard
//                 </Button>
//               </Link>
//             </div>
//           </nav>
//         </header>

//         {/* Hero Section */}
//         <section className="flex flex-col items-center w-full max-w-4xl mx-auto">
//           <div className="bg-[#1e293b]/40 border border-[#1e293b] rounded-full px-4 py-1.5 flex items-center mb-8 backdrop-blur-sm">
//             <div className="w-2 h-2 rounded-full bg-[#00e5ff] mr-3 animate-pulse" />
//             <span className="text-[#00e5ff] text-xs font-bold tracking-widest uppercase">
//               Autonomous Event Logistics V2.0
//             </span>
//           </div>

//           <h1 className="text-5xl md:text-7xl font-black mb-6 text-center tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-white to-gray-400">
//             EventSwarm
//           </h1>

//           <p className="text-gray-400 text-lg md:text-xl text-center max-w-2xl leading-relaxed mb-8">
//             Your Autonomous Event Organizing Committee. Orchestrate logistics,
//             speakers, and outreach with a single voice command.
//           </p>

//           <div className="flex bg-[#0f171e] border border-[#1e293b] rounded-xl p-1 mb-6">
//             {[
//               { id: "voice", label: "Voice Command" },
//               { id: "prompt", label: "Prompt" },
//               { id: "form", label: "Event Form" },
//             ].map((item) => (
//               <button
//                 key={item.id}
//                 onClick={() => setMode(item.id as any)}
//                 className={`px-5 py-2 rounded-lg text-sm transition-all ${
//                   mode === item.id
//                     ? "bg-[#00e5ff] text-black shadow-[0_0_20px_rgba(0,229,255,0.6)]"
//                     : "text-gray-400 hover:text-white"
//                 }`}
//               >
//                 {item.label}
//               </button>
//             ))}
//           </div>
//           {/* Core Interactive Visual */}
//           {mode === "voice" && <VoiceCommand />}

// {mode === "prompt" && <ManualPrompt />}

// {mode === "form" && <EventForm />}

//           {/* Action Row */}
//           <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mt-8 mb-32">
//             <Button
//               variant="outline"
//               className="px-8 py-4 bg-blue-400 flex items-center"
//             >
//               <Play className="text-white w-4 h-4 mr-2" fill="currentColor" />
//               Watch Demo
//             </Button>
//             <Button variant="default" className="px-8">
//               Get Started Free
//             </Button>
//           </div>
//         </section>

//         {/* Feature Highlights Grid */}
//         <section className="flex flex-wrap justify-center -mx-3 mb-24">
//           <FeatureCard
//             icon={Sparkles}
//             title="Autonomous Logic"
//             description="EventSwarm agents handle venue booking, catering logistics, and vendor communications without human intervention."
//           />
//           <FeatureCard
//             icon={Megaphone}
//             title="Multi-Channel Outreach"
//             description="Instantly blast updates across Twitter, LinkedIn, Discord, and Email through integrated swarm communication nodes."
//           />
//           <FeatureCard
//             icon={BarChart3}
//             title="Real-time RSVP Sync"
//             description="Smart contracts and neural tracking ensure your guest lists and logistics scale automatically with attendance."
//           />
//         </section>

//         {/* Footer */}
//         <footer className="border-t border-[#1e293b] pt-8 flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
//           <div className="flex items-center space-x-2">
//             <div className="w-4 h-4 rounded-full bg-[#00e5ff]" />
//             <span className="text-gray-500 text-sm">
//               © 2026 EventSwarm AI. All rights reserved.
//             </span>
//           </div>
//           <div className="flex space-x-6">
//             <Link
//               href="#"
//               className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
//             >
//               Privacy Policy
//             </Link>
//             <Link
//               href="#"
//               className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
//             >
//               Terms of Service
//             </Link>
//             <Link
//               href="#"
//               className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
//             >
//               Contact Support
//             </Link>
//           </div>
//         </footer>
//       </div>
//     </main>
//   );
// }





"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Play, Sparkles, Megaphone, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceCommand } from "@/components/voice/voice-command";
import { FeatureCard } from "@/components/cards/feature-card";
import ManualPrompt from "@/components/home/manual-prompt";
import EventForm from "@/components/home/event-form";

export default function HomePage() {
  const [mode, setMode] = useState<"voice" | "prompt" | "form">("voice");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        setUser(data.user);
      } catch (error) {
        console.error("Failed to fetch user", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  return (
    <main className="min-h-screen bg-[#080d12] selection:bg-[#00e5ff]/30 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8 md:py-12">
        {/* Navigation Header */}
        <header className="flex items-center justify-between mb-24">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#00e5ff] flex items-center justify-center">
              <div className="w-3 h-3 bg-[#080d12] rounded-full" />
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">
              EventSwarm
            </span>
          </div>

          <nav className="flex items-center space-x-8">
            <div className="hidden md:flex items-center space-x-8 text-sm text-gray-300 font-medium">
              <Link href="#features" className="hover:text-white transition-colors">Features</Link>
              <Link href="#solutions" className="hover:text-white transition-colors">Solutions</Link>
              <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="#docs" className="hover:text-white transition-colors">Documentation</Link>
            </div>

            <div className="flex items-center space-x-6">
              {loading ? null : user ? (
                <div className="relative group z-50">
                  <button className="text-gray-300 hover:text-white font-medium">
                    {user.name}
                  </button>

                  <div className="absolute right-0 mt-2 w-40 bg-[#0f172a] border border-[#1e293b] rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none group-hover:pointer-events-auto">
                    <Link href="/dashboard" className="block px-4 py-2 text-sm hover:bg-[#1e293b]">
                      Dashboard
                    </Link>
                    <button onClick={logout} className="w-full text-left px-4 py-2 text-sm hover:bg-[#1e293b]">
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Link href="/login" className="text-gray-300 font-medium hover:text-white transition-colors">
                  Login
                </Link>
              )}

              <Link href="/dashboard">
                <Button variant="default" className="bg-[#00e5ff] p-4 text-black hover:bg-[#00cce6]">
                  Launch Dashboard
                </Button>
              </Link>
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="flex flex-col items-center w-full max-w-4xl mx-auto">
          <div className="bg-[#1e293b]/40 border border-[#1e293b] rounded-full px-4 py-1.5 flex items-center mb-8 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-[#00e5ff] mr-3 animate-pulse" />
            <span className="text-[#00e5ff] text-xs font-bold tracking-widest uppercase">
              Autonomous Event Logistics V2.0
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 text-center tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
            EventSwarm
          </h1>

          <p className="text-gray-400 text-lg md:text-xl text-center max-w-2xl leading-relaxed mb-8">
            Your Autonomous Event Organizing Committee. Orchestrate logistics,
            speakers, and outreach with a single voice command.
          </p>

          <div className="flex bg-[#0f171e] border border-[#1e293b] rounded-xl p-1 mb-6">
            {[
              { id: "voice", label: "Voice Command" },
              { id: "prompt", label: "Prompt" },
              { id: "form", label: "Event Form" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setMode(item.id as any)}
                className={`px-5 py-2 rounded-lg text-sm transition-all ${mode === item.id
                    ? "bg-[#00e5ff] text-black shadow-[0_0_20px_rgba(0,229,255,0.6)] font-semibold"
                    : "text-gray-400 hover:text-white"
                  }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Core Interactive Visual - Passing User ID safely */}
          <div className="w-full max-w-2xl min-h-[200px] flex items-center justify-center">
            {mode === "voice" && <VoiceCommand userId={user?._id} />}
            {mode === "prompt" && <ManualPrompt userId={user?._id} />}
            {mode === "form" && <EventForm userId={user?._id} />}
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mt-8 mb-32">
            <Button variant="outline" className="px-8 py-4 border-gray-600 hover:bg-gray-800 flex items-center">
              <Play className="text-white w-4 h-4 mr-2" fill="currentColor" />
              Watch Demo
            </Button>
            <Button variant="default" className="px-8 bg-white text-black hover:bg-gray-200">
              Get Started Free
            </Button>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="flex flex-wrap justify-center -mx-3 mb-24">
          <FeatureCard
            icon={Sparkles}
            title="Autonomous Logic"
            description="EventSwarm agents handle venue booking, catering logistics, and vendor communications without human intervention."
          />
          <FeatureCard
            icon={Megaphone}
            title="Multi-Channel Outreach"
            description="Instantly blast updates across Twitter, LinkedIn, Discord, and Email through integrated swarm communication nodes."
          />
          <FeatureCard
            icon={BarChart3}
            title="Real-time RSVP Sync"
            description="Smart contracts and neural tracking ensure your guest lists and logistics scale automatically with attendance."
          />
        </section>

        {/* Footer */}
        <footer className="border-t border-[#1e293b] pt-8 flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-[#00e5ff]" />
            <span className="text-gray-500 text-sm">
              © 2026 EventSwarm AI. All rights reserved.
            </span>
          </div>
          <div className="flex space-x-6">
            <Link href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Privacy Policy</Link>
            <Link href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Terms of Service</Link>
            <Link href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Contact Support</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
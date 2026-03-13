"use client";

import React, { useEffect, useRef, useState } from "react";

import { DashboardHeader } from "@/components/dashboard/header";
import { SwarmEngine } from "@/components/swarm/swarm-engine";

import SocialWidget from "@/components/dashboard/social-media-widget";
import EmailWidget from "@/components/dashboard/email-widget";
import {
  AnalyticsWidget,
  ScheduleWidget,
} from "@/components/dashboard/widgets";

import { FloatingVoice } from "@/components/dashboard/voice-orb";
import { socket } from "@/lib/socket";

import StarfieldBackground from "@/components/dashboard/swarm-background";
import { Job } from "../type/job"

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const socialRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLDivElement>(null);
  const scheduleRef = useRef<HTMLDivElement>(null);
  const analyticsRef = useRef<HTMLDivElement>(null);

  const widgetRefs = useRef<HTMLDivElement[]>([]);
  const lenisRef = useRef<any>(null);

  // Fetch jobs
  // useEffect(() => {
  //   const loadJobs = async () => {
  //     try {
  //       // Explicitly set GET and accept JSON headers to match Postman's behavior
  //       const res = await fetch("/api/voice/job-list", {
  //         method: "GET",
  //         headers: {
  //           "Accept": "application/json",
  //         },
  //       });

  //       if (!res.ok) {
  //         // If it fails, we need to know what the server actually returned
  //         const errorText = await res.text();
  //         throw new Error(`Status ${res.status}: ${errorText}`);
  //       }

  //       const data: Job[] = await res.json();

  //       if (!Array.isArray(data)) {
  //         console.error("Expected an array but got:", data);
  //         return;
  //       }

  //       setJobs((prev) => {
  //         if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
  //         return data;
  //       });

  //       setActiveJob((prev) => {
  //         if (!prev && data.length > 0) return data[0];
  //         const updated = data.find((j) => j._id === prev?._id);
  //         return updated || data[0] || null;
  //       });
  //     } catch (err) {
  //       console.error("Job fetch error:", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   loadJobs();
  //   const interval = setInterval(loadJobs, 5000);
  //   return () => clearInterval(interval);
  // }, []);

  // Fetch jobs
useEffect(() => {
  let isMounted = true; // Prevents memory leaks if component unmounts

  const loadJobs = async () => {
    try {
      const res = await fetch("/api/voice/job-list", {
        headers: {
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
      }

      const data: Job[] = await res.json();
      if (!isMounted || !Array.isArray(data)) return;

      // 1. Only update jobs array if the data string actually changed
      setJobs((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
        return data;
      });

      // 2. Safely update activeJob without breaking references
      setActiveJob((prev) => {
        if (!prev && data.length > 0) return data[0]; // Initial load
        
        const updated = data.find((j) => j._id === prev?._id);
        
        if (updated) {
          // Keep the EXACT same object reference if the contents haven't changed
          if (JSON.stringify(prev) === JSON.stringify(updated)) {
            return prev; 
          }
          return updated; // Update if status or something else changed
        }
        
        // Fallback if the active job was deleted from the DB
        return data.length > 0 ? data[0] : null; 
      });

    } catch (err) {
      console.error("Job fetch error:", err);
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  loadJobs();
  const interval = setInterval(loadJobs, 1000000); // Poll every 5s

  return () => {
    isMounted = false;
    clearInterval(interval);
  };
}, []);

  // LENIS Smooth Scroll & Curved Animation...
  useEffect(() => {
    if (!widgetContainerRef.current) return;
    let lenis: any;
    let animationFrameId: number;

    async function init() {
      const Lenis = (await import("@studio-freight/lenis")).default;
      lenis = new Lenis({
        wrapper: widgetContainerRef.current as HTMLElement,
        content: widgetContainerRef.current as HTMLElement,
        smoothWheel: true,
        lerp: 0.2,
        wheelMultiplier: 1.5,
      });

      lenisRef.current = lenis;

      const updatePositions = () => {
        const container = widgetContainerRef.current;
        if (!container) return;
        const containerScrollTop = container.scrollTop;
        const viewportCenter = container.clientHeight / 2;

        widgetRefs.current.forEach((el) => {
          if (!el) return;
          const widgetCenter = el.offsetTop + el.clientHeight / 2 - containerScrollTop;
          const distance = widgetCenter - viewportCenter;
          const normalized = distance / viewportCenter;

          const curveX = -Math.pow(normalized, 2) * 180 + 80;
          const scale = 1 - Math.abs(normalized) * 0.15;
          const rotate = normalized * 8;
          const opacity = 1 - Math.abs(normalized) * 0.35;

          el.style.transform = `translateX(${curveX}px) scale(${scale}) rotateY(${rotate}deg)`;
          el.style.opacity = opacity.toString();

          const focus = Math.max(0, 1 - Math.abs(normalized) * 2);
          el.style.boxShadow = `0 0 ${70 * focus}px rgba(139,92,246,${0.4 * focus}), 0 0 ${140 * focus}px rgba(59,130,246,${0.3 * focus})`;
        });
      };

      lenis.on("scroll", updatePositions);
      updatePositions(); 

      function raf(time: number) {
        lenis.raf(time);
        animationFrameId = requestAnimationFrame(raf);
      }
      animationFrameId = requestAnimationFrame(raf);
    }
    init();
    return () => {
      if (lenis) lenis.destroy();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const scrollToWidget = (ref: any) => {
    if (!ref.current || !lenisRef.current) return;
    lenisRef.current.scrollTo(ref.current, { offset: -80, duration: 1.2 });
  };

  useEffect(() => {
    const handleApprovalNeeded = (data: any) => {
      if (data.widget === "email") scrollToWidget(emailRef);
      if (data.widget === "social") scrollToWidget(socialRef);
      if (data.widget === "schedule") scrollToWidget(scheduleRef);
      if (data.widget === "analytics") scrollToWidget(analyticsRef);
    };

    socket.on("approval_needed", handleApprovalNeeded);
    socket.on("job_update", (updatedJob) => {
      setJobs((prev) => {
        const exists = prev.find((j) => j._id === updatedJob._id);
        if (!exists) return [updatedJob, ...prev];
        return prev.map((j) => (j._id === updatedJob._id ? updatedJob : j));
      });
      setActiveJob((prev) => {
        if (!prev) return prev;
        if (prev._id === updatedJob._id) return updatedJob;
        return prev;
      });
    });

    return () => {
      socket.off("approval_needed", handleApprovalNeeded);
      socket.off("job_update");
    };
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#080d12] text-white overflow-hidden">
      <StarfieldBackground />

      <div className="relative z-20">
        {/* FIX: Passing the event_name to the Header component */}
        <DashboardHeader  />
      </div>

      <div className="flex flex-1 overflow-hidden relative z-10">
        <div className="w-[50%] p-8 overflow-hidden relative">
          <div className="relative z-10">
            {loading ? (
              <div className="text-gray-400">Loading swarm...</div>
            ) : (
              activeJob && (
                <SwarmEngine
                  jobs={jobs}
                  activeJob={activeJob}
                  setActiveJob={setActiveJob}
                />
              )
            )}
          </div>
        </div>

        <div
          ref={widgetContainerRef}
          className="relative flex-1 overflow-y-scroll overflow-x-hidden px-16 py-16 space-y-24 border-none"
        >
          <div ref={(el: any) => { socialRef.current = el; widgetRefs.current[0] = el; }} className="max-w-lg mx-auto transition-transform duration-300 origin-center">
            <SocialWidget />
          </div>

          <div ref={(el: any) => { emailRef.current = el; widgetRefs.current[1] = el; }} className="max-w-lg mx-auto transition-transform duration-300 origin-center">
            <EmailWidget />
          </div>

          <div ref={(el: any) => { scheduleRef.current = el; widgetRefs.current[2] = el; }} className="max-w-lg mx-auto transition-transform duration-300 origin-center">
            
          </div>

          <div ref={(el: any) => { analyticsRef.current = el; widgetRefs.current[3] = el; }} className="max-w-lg mx-auto transition-transform duration-300 origin-center">
            <AnalyticsWidget />
          </div>
        </div>
      </div>
      <FloatingVoice />
    </div>
  );
}
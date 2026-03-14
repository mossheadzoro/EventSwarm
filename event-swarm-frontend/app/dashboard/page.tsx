

"use client";

import React, { useEffect, useRef, useState } from "react";

import { DashboardHeader } from "@/components/dashboard/header";
import { SwarmEngine } from "@/components/swarm/swarm-engine";

import SocialWidget from "@/components/dashboard/social-media-widget";
import EmailWidget from "@/components/dashboard/email-widget";
import SchedulingWidget from "../../components/dashboard/schedule-widget";
import { TaglineWidget } from "@/components/dashboard/tagline-widget"; // <-- Import new widget

import { socket } from "@/lib/socket";

import StarfieldBackground from "@/components/dashboard/swarm-background";
import { Job } from "../type/job";
import { OnboardingTour } from "@/components/onboarding-tour";

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  // --- NEW STATE FOR TAGLINES ---
  const [extractedTaglines, setExtractedTaglines] = useState<string[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null); // <-- New ref
  const socialRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLDivElement>(null);
  const scheduleRef = useRef<HTMLDivElement>(null);
  const analyticsRef = useRef<HTMLDivElement>(null);

  const widgetRefs = useRef<HTMLDivElement[]>([]);
  const lenisRef = useRef<any>(null);

  // Fetch jobs
  useEffect(() => {
    let isMounted = true;

    const loadJobs = async () => {
      try {
        const res = await fetch("/api/voice/job-list", {
          headers: { Accept: "application/json" },
        });

        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

        const data: Job[] = await res.json();
        if (!isMounted || !Array.isArray(data)) return;

        setJobs((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
          return data;
        });

        setActiveJob((prev) => {
          if (!prev && data.length > 0) return data[0];
          const updated = data.find((j) => j._id === prev?._id);

          if (updated) {
            if (JSON.stringify(prev) === JSON.stringify(updated)) return prev;
            return updated;
          }
          return data.length > 0 ? data[0] : null;
        });

      } catch (err) {
        console.error("Job fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadJobs();
    const interval = setInterval(loadJobs, 100000);

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
          if (!el) return; // Safely skip if widget isn't rendered
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

  // --- AUTO SCROLL WHEN TAGLINES ARRIVE ---
  useEffect(() => {
    if (extractedTaglines.length > 0) {
      setTimeout(() => scrollToWidget(taglineRef), 300);
    }
  }, [extractedTaglines]);

  // SOCKET LISTENERS
  useEffect(() => {
    const handleApprovalNeeded = (data: any) => {
      if (data.widget === "email") scrollToWidget(emailRef);
      if (data.widget === "social") scrollToWidget(socialRef);
      if (data.widget === "schedule") scrollToWidget(scheduleRef);
      if (data.widget === "analytics") scrollToWidget(analyticsRef);
    };

    const handlePhaseChange = (data: { phase: string }) => {
      switch (data.phase) {
        case "content_strategist":
          scrollToWidget(socialRef);
          break;
        case "communications":
          scrollToWidget(emailRef);
          break;
        case "scheduler":
          scrollToWidget(scheduleRef);
          break;
      }
    };

    // Extract taglines when supervisor replies
    const handleSupervisorReply = (data: { text: string }) => {
      const textLower = data.text.toLowerCase();
      if (textLower.includes("draft taglines") || textLower.includes("taglines:")) {
        const lines = data.text.split("\n").map(l => l.trim()).filter(l => l.length > 5);
        const tags = lines.filter(l =>
          !l.toLowerCase().includes("here are") &&
          !l.toLowerCase().includes("please let me know") &&
          !l.toLowerCase().includes("approve") &&
          !l.toLowerCase().includes("draft taglines")
        );
        if (tags.length > 0) {
          setExtractedTaglines(tags);
        }
      }
    };

    socket.on("approval_needed", handleApprovalNeeded);
    socket.on("agent_phase", handlePhaseChange);
    socket.on("supervisor_reply", handleSupervisorReply); // <-- Attach new listener

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
      socket.off("agent_phase", handlePhaseChange);
      socket.off("supervisor_reply", handleSupervisorReply);
      socket.off("job_update");
    };
  }, []);

  // --- AUTO-SCROLL WIDGETS WHEN PHASE CHANGES (via ai_chat_update) ---
  useEffect(() => {
    const handleChatUpdate = (e: any) => {
      const phase = e.detail?.phase;
      if (!phase) return;

      // Small delay so Lenis has time to initialize on phase transition
      setTimeout(() => {
        switch (phase) {
          case "content_strategist":
          case "content":
          case "art_director": // No art widget — scroll to social instead
          case "art":
            scrollToWidget(socialRef);
            break;
          case "communications":
          case "comms":
            scrollToWidget(emailRef);
            break;
          case "scheduler":
            scrollToWidget(scheduleRef);
            break;
        }
      }, 400);
    };

    window.addEventListener("ai_chat_update", handleChatUpdate);
    return () => window.removeEventListener("ai_chat_update", handleChatUpdate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- TAGLINE APPROVE HANDLER ---
  const handleTaglineApprove = async () => {
    if (!activeThreadId) return;

    // Sync with chat orb
    window.dispatchEvent(new CustomEvent("external_chat_command", { detail: "APPROVE" }));
    setExtractedTaglines([]); // Hide widget

    try {
      await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "APPROVE", thread_id: activeThreadId }),
      });
    } catch (err) {
      console.error("Widget approval error", err);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#080d12] text-white overflow-hidden">
      <StarfieldBackground />
      <OnboardingTour />

      <div className="relative z-20">
        <DashboardHeader />
      </div>

      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Left Side: Swarm Engine */}
        <div className="w-full lg:w-[55%] xl:w-[55%] p-4 sm:p-8 overflow-y-auto overflow-x-hidden relative rocket-scrollbar">
          <div className="relative z-10 w-full min-h-full flex flex-col justify-start pt-4 sm:pt-8 pb-32 sm:pb-64 object-top">
            {loading ? (
              <div className="text-gray-400">Loading swarm...</div>
            ) : (
              activeJob && (
                <SwarmEngine
                  jobs={jobs}
                  setJobs={setJobs}
                  activeJob={activeJob}
                  setActiveJob={setActiveJob}
                  onThreadCreated={(id: string) => setActiveThreadId(id)} // <-- Pass ID to parent
                />
              )
            )}
          </div>
        </div>

        {/* Right Side: Scrollable Widgets */}
        <div
          ref={widgetContainerRef}
          className="relative flex-1 lg:w-[45%] xl:w-[50%] overflow-y-scroll overflow-x-hidden px-4 sm:px-8 lg:px-12 py-10 sm:py-16 space-y-16 lg:space-y-24 border-none rocket-scrollbar"
        >
          {/* WIDGET 0: TAGLINES (Conditional) */}
          {extractedTaglines.length > 0 && (
            <div ref={(el: any) => { taglineRef.current = el; widgetRefs.current[0] = el; }} className="max-w-lg mx-auto transition-transform duration-300 origin-center">
              <TaglineWidget taglines={extractedTaglines} onApprove={handleTaglineApprove} />
            </div>
          )}

          {/* WIDGET 1: SOCIAL */}
          <div id="step-widget-social" ref={(el: any) => { socialRef.current = el; widgetRefs.current[1] = el; }} className="max-w-lg mx-auto transition-transform duration-300 origin-center">
            <SocialWidget activeJob={activeJob} />
          </div>

          {/* WIDGET 2: EMAIL */}
          <div id="step-widget-email" ref={(el: any) => { emailRef.current = el; widgetRefs.current[2] = el; }} className="max-w-lg mx-auto transition-transform duration-300 origin-center">
            <EmailWidget activeJob={activeJob} activeThreadId={activeThreadId} />
          </div>

          {/* WIDGET 3: SCHEDULE */}
          <div id="step-widget-schedule" ref={(el: any) => { scheduleRef.current = el; widgetRefs.current[3] = el; }} className="max-w-lg mx-auto transition-transform duration-300 origin-center">
            <SchedulingWidget activeJob={activeJob} />
          </div>
        </div>
      </div>
    </div>
  );
}
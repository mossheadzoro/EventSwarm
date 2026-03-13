
"use client"

import React, { useEffect, useRef, useState } from "react";

import { DashboardHeader } from "@/components/dashboard/header";
import { SwarmEngine } from "@/components/dashboard/swarm-engine";

import SocialWidget from "@/components/dashboard/social-media-widget";
import EmailWidget from "@/components/dashboard/email-widget";
import {
  AnalyticsWidget,
  ScheduleWidget
} from "@/components/dashboard/widgets";

import { FloatingVoice } from "@/components/dashboard/voice-orb";
import { socket } from "@/lib/socket";

import StarfieldBackground from "@/components/dashboard/swarm-background";

export default function DashboardPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [activeJob, setActiveJob] = useState<any>(null);

  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const socialRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLDivElement>(null);
  const scheduleRef = useRef<HTMLDivElement>(null);
  const analyticsRef = useRef<HTMLDivElement>(null);

  const widgetRefs = useRef<HTMLDivElement[]>([]);
  const lenisRef = useRef<any>(null);

  // Fetch jobs
  useEffect(() => {
    fetch("/api/voice/list")
      .then(res => res.json())
      .then(data => {
        setJobs(data);
        setActiveJob(data[0]);
      });
  }, []);

  // LENIS Smooth Scroll & Curved Animation Hooked Together
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
  lerp: 0.2, // Increased from 0.08 for faster response
  wheelMultiplier: 1.5, // Amplifies your mouse wheel movement
})

      lenisRef.current = lenis;

      // Highly optimized updatePositions using offsetTop
      const updatePositions = () => {
        const container = widgetContainerRef.current;
        if (!container) return;

        const containerScrollTop = container.scrollTop;
        const viewportCenter = container.clientHeight / 2;

        widgetRefs.current.forEach((el) => {
          if (!el) return;

          // offsetTop avoids layout thrashing vs getBoundingClientRect
          const widgetCenter = el.offsetTop + (el.clientHeight / 2) - containerScrollTop;
          const distance = widgetCenter - viewportCenter;
          const normalized = distance / viewportCenter;

          const curveX = -Math.pow(normalized, 2) * 180 + 80;
          const scale = 1 - Math.abs(normalized) * 0.15;
          const rotate = normalized * 8;
          const opacity = 1 - Math.abs(normalized) * 0.35;

          el.style.transform = `
            translateX(${curveX}px)
            scale(${scale})
            rotateY(${rotate}deg)
          `;

          el.style.opacity = opacity.toString();

          /* CENTER GLOW */
          const focus = Math.max(0, 1 - Math.abs(normalized) * 2);
          el.style.boxShadow = `
            0 0 ${70 * focus}px rgba(139,92,246,${0.4 * focus}),
            0 0 ${140 * focus}px rgba(59,130,246,${0.3 * focus})
          `;
        });
      };

      // Hook animation into Lenis' native scroll event
      lenis.on("scroll", updatePositions);
      updatePositions(); // Initial trigger

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

  // Scroll to widget helper
  const scrollToWidget = (ref: any) => {
    if (!ref.current || !lenisRef.current) return;

    lenisRef.current.scrollTo(ref.current, {
      offset: -80,
      duration: 1.2
    });
  };

  // Approval events
  useEffect(() => {
    const handleApprovalNeeded = (data: any) => {
      if (data.widget === "email") scrollToWidget(emailRef);
      if (data.widget === "social") scrollToWidget(socialRef);
      if (data.widget === "schedule") scrollToWidget(scheduleRef);
      if (data.widget === "analytics") scrollToWidget(analyticsRef);
    };

    socket.on("approval_needed", handleApprovalNeeded);

    return () => {
      socket.off("approval_needed", handleApprovalNeeded);
    };
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#080d12] text-white overflow-hidden">
      <StarfieldBackground />

      <div className="relative z-20">
        <DashboardHeader />
      </div>

      <div className="flex flex-1 overflow-hidden relative z-10">
        
        {/* LEFT SIDE — SWARM ENGINE (Fixed Borders) */}
        <div className="w-[50%]  p-8 overflow-hidden relative">
          <div className="relative z-10 ">
            <SwarmEngine
              jobs={jobs}
              activeJob={activeJob}
              setActiveJob={setActiveJob}
            />
          </div>
        </div>

        {/* RIGHT SIDE — WIDGETS */}
        <div
          ref={widgetContainerRef}
          className="relative flex-1 overflow-y-scroll overflow-x-hidden px-16 py-16 space-y-24 border-none"
        >
          {/* SOCIAL */}
          <div
            ref={(el: any) => {
              socialRef.current = el;
              widgetRefs.current[0] = el;
            }}
            className="max-w-lg mx-auto transition-transform duration-300 origin-center"
          >
            <SocialWidget />
          </div>

          {/* EMAIL */}
          <div
            ref={(el: any) => {
              emailRef.current = el;
              widgetRefs.current[1] = el;
            }}
            className="max-w-lg mx-auto transition-transform duration-300 origin-center"
          >
            <EmailWidget />
          </div>

          {/* SCHEDULE */}
          <div
            ref={(el: any) => {
              scheduleRef.current = el;
              widgetRefs.current[2] = el;
            }}
            className="max-w-lg mx-auto transition-transform duration-300 origin-center"
          >
            <ScheduleWidget activeJob={activeJob} />
          </div>

          {/* ANALYTICS */}
          <div
            ref={(el: any) => {
              analyticsRef.current = el;
              widgetRefs.current[3] = el;
            }}
            className="max-w-lg mx-auto transition-transform duration-300 origin-center"
          >
            <AnalyticsWidget />
          </div>
        </div>
      </div>

      <FloatingVoice />
    </div>
  );
}
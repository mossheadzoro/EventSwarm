


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

import SwarmBackground from "@/components/dashboard/swarm-background";

export default function DashboardPage() {

  const [jobs, setJobs] = useState<any[]>([])
  const [activeJob, setActiveJob] = useState<any>(null)

  const widgetContainerRef = useRef<HTMLDivElement>(null)

  const socialRef = useRef<HTMLDivElement>(null)
  const emailRef = useRef<HTMLDivElement>(null)
  const scheduleRef = useRef<HTMLDivElement>(null)
  const analyticsRef = useRef<HTMLDivElement>(null)

  const widgetRefs = useRef<HTMLDivElement[]>([])

  const lenisRef = useRef<any>(null)

  // Fetch jobs
  useEffect(() => {

    fetch("/api/voice/list")
      .then(res => res.json())
      .then(data => {
        setJobs(data)
        setActiveJob(data[0])
      })

  }, [])

  // LENIS Smooth Scroll
 useEffect(() => {

  if (!widgetContainerRef.current) return

  let lenis:any

  async function init() {
    const Lenis = (await import("@studio-freight/lenis")).default

    lenis = new Lenis({
      wrapper: widgetContainerRef.current as HTMLElement,
      content: widgetContainerRef.current as HTMLElement,
      smoothWheel: true,
      lerp: 0.08
    })

    function raf(time:number){
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    lenisRef.current = lenis
  }

  init()

  return ()=>lenis?.destroy()

},[])

  // Curved Scroll Animation
  useEffect(() => {

    const container = widgetContainerRef.current
    if (!container) return

    const updatePositions = () => {

      const center = container.scrollTop + container.clientHeight / 2

      widgetRefs.current.forEach((el) => {

        if (!el) return

        const rectCenter = el.offsetTop + el.clientHeight / 2

        const distance = rectCenter - center
        const normalized = distance / container.clientHeight

        // Parabolic curve for LEFT-BOTTOM -> CENTER -> LEFT-TOP
        const curveX = -Math.pow(normalized,2) * 220 + 120

        const scale = 1 - Math.abs(normalized) * 0.18
        const opacity = 1 - Math.abs(normalized) * 0.35
        const rotate = normalized * 10

        el.style.transform = `
          translateX(${curveX}px)
          scale(${scale})
          rotateY(${rotate}deg)
        `

        el.style.opacity = opacity.toString()

      })

    }

    container.addEventListener("scroll", updatePositions)

    updatePositions()

    return ()=>container.removeEventListener("scroll", updatePositions)

  }, [])

  // Scroll to widget helper
  const scrollToWidget = (ref:any) => {

    if (!ref.current || !lenisRef.current) return

    lenisRef.current.scrollTo(ref.current,{
      offset:-80,
      duration:1.2
    })

  }

  // Approval events
  useEffect(() => {

    const handleApprovalNeeded = (data:any)=>{

      if(data.widget === "email") scrollToWidget(emailRef)
      if(data.widget === "social") scrollToWidget(socialRef)
      if(data.widget === "schedule") scrollToWidget(scheduleRef)
      if(data.widget === "analytics") scrollToWidget(analyticsRef)

    }

    socket.on("approval_needed", handleApprovalNeeded)

    return () => {socket.off("approval_needed", handleApprovalNeeded)
    }
  },[])

  return (

    <div className="h-screen flex flex-col bg-[#080d12] text-white overflow-hidden">

      <DashboardHeader/>

      <div className="flex flex-1 overflow-hidden">

      

<div className="w-[50%] border-r border-[#1e293b] p-6 overflow-hidden relative">

  <SwarmBackground />

  <div className="relative z-10">
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
  className="
  relative
  flex-1
  overflow-y-scroll
  overflow-x-hidden
  px-28
  py-16
  space-y-24
"
>
{/* <WidgetBirds
  containerRef={widgetContainerRef}
  widgetRefs={widgetRefs}
/> */}
          {/* SOCIAL */}
          <div
            ref={(el:any)=>{
              socialRef.current = el
              widgetRefs.current[0] = el
            }}
            className="
            max-w-lg
            mx-auto
            transition-transform
            duration-300
            origin-center
            "
          >
            <SocialWidget/>
          </div>

          {/* EMAIL */}
          <div
            ref={(el:any)=>{
              emailRef.current = el
              widgetRefs.current[1] = el
            }}
            className="
            max-w-lg
            mx-auto
            transition-transform
            duration-300
            origin-center
            "
          >
            <EmailWidget/>
          </div>

          {/* SCHEDULE */}
          <div
            ref={(el:any)=>{
              scheduleRef.current = el
              widgetRefs.current[2] = el
            }}
            className="
            max-w-lg
            mx-auto
            transition-transform
            duration-300
            origin-center
            "
          >
            <ScheduleWidget activeJob={activeJob}/>
          </div>

          {/* ANALYTICS */}
          <div
            ref={(el:any)=>{
              analyticsRef.current = el
              widgetRefs.current[3] = el
            }}
            className="
            max-w-lg
            mx-auto
            transition-transform
            duration-300
            origin-center
            "
          >
            <AnalyticsWidget/>
          </div>

        </div>

      </div>

      {/* FLOATING VOICE BUTTON */}
      <FloatingVoice/>

    </div>

  )
}
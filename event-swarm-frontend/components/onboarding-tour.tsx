"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export function OnboardingTour() {
  useEffect(() => {
    const hasSeenTour = localStorage.getItem("eventswarm_tour_v1");

    if (!hasSeenTour) {
      const driverObj = driver({
        showProgress: true,
        showButtons: ["next", "previous", "close"],
        animate: true,
        overlayColor: "#020617",
        overlayOpacity: 0.85,
        stagePadding: 10,
        stageRadius: 12,
        popoverClass: "eventswarm-popover",
        steps: [
          {
            popover: {
              title: "👋 Welcome to EventSwarm!",
              description:
                "Let's take a 30-second tour of your AI-powered event command center. Click <b>Next</b> to begin.",
              side: "over",
              align: "center",
            },
          },
          {
            element: "#step-voice-orb",
            popover: {
              title: "🎙️ AI Supervisor Orb",
              description:
                "This is your <b>command hub</b>. Click it to open a chat with the Supervisor AI agent. You can give instructions, approve plans, and have conversations throughout the workflow.",
              side: "bottom",
              align: "center",
            },
          },
          {
            element: "#step-execute-btn",
            popover: {
              title: "🚀 Execute Swarm",
              description:
                'Click <b>Execute Swarm</b> to launch all AI agents for your selected event. The swarm will immediately begin planning content, scheduling, and communications.',
              side: "bottom",
              align: "center",
            },
          },
          {
            element: "#step-widget-social",
            popover: {
              title: "📸 Social Media Widget",
              description:
                "The <b>Content Strategist</b> agent will generate social media captions and images here. Review the AI output and hit <b>Approve & Save</b> to post.",
              side: "left",
              align: "center",
            },
          },
          {
            element: "#step-widget-email",
            popover: {
              title: "✉️ Email Widget",
              description:
                "The <b>Email Agent</b> drafts personalised event invitation emails here. You can edit the subject and body before approving the bulk send.",
              side: "left",
              align: "center",
            },
          },
          {
            element: "#step-widget-schedule",
            popover: {
              title: "📅 Schedule Widget",
              description:
                "The <b>Scheduler Agent</b> builds a complete event timeline here, pulling from your uploaded schedule CSV and coordinating across all departments.",
              side: "left",
              align: "center",
            },
          },
          {
            popover: {
              title: "✅ You're all set!",
              description:
                "That's the full EventSwarm workflow! Start by selecting an event job and hitting <b>Execute Swarm</b>.",
              side: "over",
              align: "center",
            },
          },
        ],
        onDestroyed: () => {
          localStorage.setItem("eventswarm_tour_v1", "true");
        },
      });

      setTimeout(() => {
        driverObj.drive();
      }, 1200);
    }
  }, []);

  return null;
}

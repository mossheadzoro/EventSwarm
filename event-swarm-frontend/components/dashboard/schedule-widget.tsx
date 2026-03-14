"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCcw,
  CalendarCheck2,
  Search,
  FileSpreadsheet,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "../ui/button";

type CalendarEvent = {
  summary: string;
  start_time: string;
  end_time: string;
};

type CalendarResult = {
  status: string;
  date: string;
  is_free: boolean;
  event_count: number;
  events: CalendarEvent[];
};

type TimelineItem = {
  date?: string;       // e.g. "2026-03-25"
  time: string;        // e.g. "10:00 AM"
  activity: string;    // e.g. "Opening Ceremony"
  conflict?: boolean;  // true if calendar has conflict
  conflictEvents?: CalendarEvent[];
};

export default function SchedulingWidget({ activeJob, onComplete }: any) {
  // Calendar check state
  const [checkDate, setCheckDate] = useState(activeJob?.event_date || "");
  const [isChecking, setIsChecking] = useState(false);
  const [calendarResult, setCalendarResult] = useState<CalendarResult | null>(null);

  // Timeline from CSV / AI chat
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [conflictCount, setConflictCount] = useState(0);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);

  // Approval
  const [isApproved, setIsApproved] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  /* ---------- CHECK SINGLE DATE via API ---------- */
  const checkDateAvailability = useCallback(async (date: string): Promise<CalendarResult | null> => {
    try {
      const res = await fetch(`/api/calendar/check?date=${date}`);
      const data: CalendarResult = await res.json();
      return data;
    } catch {
      return null;
    }
  }, []);

  /* ---------- AUTO-CHECK CONFLICTS for all timeline dates ---------- */
  const checkAllConflicts = useCallback(async (items: TimelineItem[]) => {
    // Gather unique dates from the timeline
    const uniqueDates = new Set<string>();
    items.forEach((item) => {
      if (item.date) uniqueDates.add(item.date);
    });

    // Also check the active job date
    if (activeJob?.event_date) uniqueDates.add(activeJob.event_date);

    if (uniqueDates.size === 0) return items;

    setIsCheckingConflicts(true);

    // Check all dates in parallel
    const dateResults: Record<string, CalendarResult> = {};
    const promises = Array.from(uniqueDates).map(async (date) => {
      const result = await checkDateAvailability(date);
      if (result) dateResults[date] = result;
    });
    await Promise.all(promises);

    // Mark conflicts on timeline items
    let conflicts = 0;
    const updated = items.map((item) => {
      if (!item.date || !dateResults[item.date]) return item;

      const result = dateResults[item.date];
      if (!result.is_free) {
        conflicts++;
        return {
          ...item,
          conflict: true,
          conflictEvents: result.events || [],
        };
      }
      return { ...item, conflict: false, conflictEvents: [] };
    });

    setConflictCount(conflicts);
    setIsCheckingConflicts(false);
    return updated;
  }, [activeJob?.event_date, checkDateAvailability]);

  /* ---------- AUTO-CHECK on mount if date exists ---------- */
  useEffect(() => {
    if (activeJob?.event_date) {
      setCheckDate(activeJob.event_date);
      handleCheckCalendar(activeJob.event_date);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeJob?._id]);

  /* ---------- LISTEN FOR AI CHAT UPDATES ---------- */
  useEffect(() => {
    const handleChatUpdate = async (e: any) => {
      const payload = e.detail;
      if (!payload?.messages) return;

      const aiMessages = payload.messages.filter((m: any) => m.role === "AIMessage");

      const allParsed: TimelineItem[] = [];

      aiMessages.forEach((msg: any) => {
        const content = msg.content || "";

        // ─── PATTERN 1: CSV-style rows "Date,Time,Activity" ───
        // Matches: "2026-03-25, 10:00 AM, Registration" or "25/03/2026 | 10:00 | Opening"
        const csvMatches = content.matchAll(
          /(\d{4}-\d{2}-\d{2})[,|\s]+(\d{1,2}[:.]\d{2}\s*(?:AM|PM|am|pm)?)[,|\s]+(.+)/g
        );
        for (const match of csvMatches) {
          const date = match[1].trim();
          const time = match[2].trim();
          const activity = match[3].trim().replace(/\*\*/g, "").replace(/,\s*$/, "");
          if (activity.length > 1 && activity.length < 200) {
            allParsed.push({ date, time, activity });
          }
        }

        // ─── PATTERN 2: Time-only rows "10:00 AM - Registration" ───
        if (allParsed.length === 0) {
          const timeMatches = content.matchAll(
            /(\d{1,2}[:.]\d{2}\s*(?:AM|PM|am|pm)?)\s*[-–—:]\s*(.+)/g
          );
          for (const match of timeMatches) {
            const time = match[1].trim();
            const activity = match[2].trim().replace(/\*\*/g, "");
            if (activity.length > 2 && activity.length < 200) {
              // Use activeJob date or today as default
              const fallbackDate = activeJob?.event_date || new Date().toISOString().split("T")[0];
              allParsed.push({ date: fallbackDate, time, activity });
            }
          }
        }

        // ─── PATTERN 3: Markdown table rows "| 10:00 AM | Registration |" ───
        const tableMatches = content.matchAll(
          /\|\s*(\d{1,2}[:.]\d{2}\s*(?:AM|PM|am|pm)?)\s*\|\s*(.+?)\s*\|/g
        );
        for (const match of tableMatches) {
          const time = match[1].trim();
          const activity = match[2].trim().replace(/\*\*/g, "");
          if (activity.length > 2 && !activity.includes("---")) {
            const fallbackDate = activeJob?.event_date || new Date().toISOString().split("T")[0];
            // Don't add duplicate if we already parsed it
            const exists = allParsed.some(p => p.time === time && p.activity === activity);
            if (!exists) {
              allParsed.push({ date: fallbackDate, time, activity });
            }
          }
        }

        // ─── Also detect standalone dates mentioned by AI ───
        const dateMatch = content.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          const mentionedDate = dateMatch[1];
          if (content.toLowerCase().includes("free") || content.toLowerCase().includes("available")) {
            setCalendarResult({
              status: "success",
              date: mentionedDate,
              is_free: true,
              event_count: 0,
              events: [],
            });
          } else if (content.toLowerCase().includes("conflict") || content.toLowerCase().includes("busy") || content.toLowerCase().includes("occupied")) {
            // Auto-trigger a calendar check to get official data
            handleCheckCalendar(mentionedDate);
          }
        }
      });

      // If we parsed timeline items, update state + check for conflicts
      if (allParsed.length > 0) {
        const checked = await checkAllConflicts(allParsed);
        setTimeline(checked);
        setIsApproved(false);
      }
    };

    window.addEventListener("ai_chat_update", handleChatUpdate);
    return () => window.removeEventListener("ai_chat_update", handleChatUpdate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeJob?.event_date, checkAllConflicts]);

  /* ---------- CHECK CALENDAR API (manual) ---------- */
  const handleCheckCalendar = async (dateOverride?: string) => {
    const dateToCheck = dateOverride || checkDate;
    if (!dateToCheck) return;

    setIsChecking(true);
    setCalendarResult(null);

    try {
      const res = await fetch(`/api/calendar/check?date=${dateToCheck}`);
      const data: CalendarResult = await res.json();
      setCalendarResult(data);
    } catch (err) {
      console.error("Calendar check failed:", err);
      setCalendarResult({
        status: "error",
        date: dateToCheck,
        is_free: false,
        event_count: 0,
        events: [],
      });
    } finally {
      setIsChecking(false);
    }
  };

  /* ---------- APPROVE SCHEDULE ---------- */
  const handleApproveSchedule = async () => {
    setIsProcessing(true);
    try {
      window.dispatchEvent(
        new CustomEvent("external_chat_command", { detail: "APPROVE" })
      );
      setIsApproved(true);
      setTimeout(() => { if (onComplete) onComplete(); }, 2000);
    } catch (err) {
      console.error("Approval error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="bg-[#0a1017] border border-[#1e293b] rounded-2xl p-6 mt-6 shadow-[0_0_40px_rgba(0,229,255,0.05)] relative overflow-hidden transition-all duration-500 space-y-6">

      {/* Success Overlay */}
      <div
        className={`absolute inset-0 z-10 bg-[#0a1017]/90 backdrop-blur-md flex flex-col items-center justify-center transition-opacity duration-500 ${isApproved ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        <CalendarCheck2 className={`w-16 h-16 text-green-500 mb-4 ${isApproved ? "animate-bounce" : ""}`} />
        <h3 className="text-xl font-bold text-white">Schedule Locked ✅</h3>
        <p className="text-gray-400 text-sm mt-2">Event timeline has been approved.</p>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between text-white font-semibold">
        <div className="flex items-center text-orange-400">
          <Calendar className="w-5 h-5 mr-2" />
          AI Scheduler Agent
        </div>
        <div className="flex items-center gap-2">
          {conflictCount > 0 && (
            <div className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded uppercase tracking-widest animate-pulse">
              ⚠️ {conflictCount} Conflict{conflictCount > 1 ? "s" : ""}
            </div>
          )}
          <div className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-1 rounded uppercase tracking-widest">
            Phase: Logistics
          </div>
        </div>
      </div>

      {/* ─── SECTION 1: Calendar Availability Checker ─── */}
      <div className="space-y-3">
        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">
          📅 Check Date Availability
        </p>

        <div className="flex gap-2">
          <input
            type="date"
            value={checkDate}
            onChange={(e) => setCheckDate(e.target.value)}
            className="flex-1 bg-[#020617] border border-[#1e293b] text-white px-4 py-2.5 rounded-xl focus:border-orange-500 outline-none transition-colors text-sm"
          />
          <Button
            onClick={() => handleCheckCalendar()}
            disabled={!checkDate || isChecking}
            className="bg-orange-500 hover:bg-orange-400 text-black font-bold px-5 rounded-xl"
          >
            {isChecking ? (
              <RefreshCcw className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Calendar Result */}
        {calendarResult && (
          <div className={`p-4 rounded-xl border transition-colors duration-500 ${
            calendarResult.is_free
              ? "bg-green-500/10 border-green-500/30"
              : "bg-red-500/10 border-red-500/30"
          }`}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {calendarResult.is_free ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                )}
              </div>
              <div className="flex-1">
                <h4 className={`text-sm font-bold ${
                  calendarResult.is_free ? "text-green-400" : "text-red-400"
                }`}>
                  {calendarResult.is_free
                    ? `✅ ${calendarResult.date} is FREE`
                    : `⚠️ ${calendarResult.date} has ${calendarResult.event_count || 0} event(s)`}
                </h4>

                {/* Show existing events if busy */}
                {!calendarResult.is_free && (calendarResult.events || []).length > 0 && (
                  <div className="mt-3 space-y-2">
                    {(calendarResult.events || []).map((ev, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-300 bg-[#020617] p-2.5 rounded-lg border border-[#1e293b]">
                        <Clock className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span className="font-medium text-white">{ev.summary}</span>
                        <span className="text-gray-500 ml-auto whitespace-nowrap">
                          {formatTime(ev.start_time)} — {formatTime(ev.end_time)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── SECTION 2: Event Timeline ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">
            📋 Event Timeline
          </p>
          <div className="flex items-center gap-2">
            {isCheckingConflicts && (
              <span className="text-[10px] text-[#00e5ff] flex items-center gap-1">
                <RefreshCcw className="w-3 h-3 animate-spin" />
                Checking conflicts...
              </span>
            )}
            {timeline.length > 0 && (
              <span className="text-[10px] text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">
                {timeline.length} items
              </span>
            )}
          </div>
        </div>

        {timeline.length === 0 ? (
          <div className="bg-[#020617] border border-[#1e293b] rounded-xl p-8 flex flex-col items-center text-center">
            <FileSpreadsheet className="w-8 h-8 text-gray-600 mb-3" />
            <p className="text-gray-500 text-sm">Awaiting schedule data...</p>
            <p className="text-gray-600 text-[10px] mt-1">
              Upload a CSV in chat or let the AI build a timeline.
            </p>
          </div>
        ) : (
          <div className="bg-[#020617] border border-[#1e293b] rounded-xl p-4 max-h-96 overflow-y-auto custom-scrollbar">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-orange-500/50 via-[#00e5ff]/30 to-transparent" />

              <div className="space-y-1">
                {timeline.map((item, idx) => (
                  <div key={idx} className={`flex items-start gap-4 pl-2 py-2.5 group rounded-lg transition-colors ${item.conflict ? "bg-red-500/5" : ""}`}>
                    {/* Dot */}
                    <div className="relative z-10 mt-1.5">
                      <div className={`w-3 h-3 rounded-full border-2 border-[#020617] transition-shadow ${
                        item.conflict
                          ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse"
                          : "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)] group-hover:shadow-[0_0_16px_rgba(249,115,22,0.8)]"
                      }`} />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {item.date && (
                          <span className="text-[10px] text-gray-500 font-mono">
                            {item.date}
                          </span>
                        )}
                        <span className={`text-[11px] font-mono font-bold whitespace-nowrap ${item.conflict ? "text-red-400" : "text-orange-400"}`}>
                          {item.time}
                        </span>
                        <ArrowRight className="w-3 h-3 text-gray-600 shrink-0" />
                        <span className="text-sm text-gray-200 leading-snug truncate">
                          {item.activity}
                        </span>
                      </div>

                      {/* Conflict alert */}
                      {item.conflict && (item.conflictEvents || []).length > 0 && (
                        <div className="mt-1.5 ml-0 space-y-1">
                          {(item.conflictEvents || []).map((ev, ci) => (
                            <div key={ci} className="flex items-center gap-1.5 text-[10px] text-red-400/80">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>Conflicts with: <strong>{ev.summary}</strong> ({formatTime(ev.start_time)}–{formatTime(ev.end_time)})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Conflict badge */}
                    {item.conflict && (
                      <div className="shrink-0 mt-1">
                        <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold">
                          CONFLICT
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── APPROVE BUTTON ─── */}
      <Button
        onClick={handleApproveSchedule}
        disabled={timeline.length === 0 || isProcessing || conflictCount > 0}
        className={`w-full h-12 font-bold text-sm uppercase tracking-wider rounded-xl transition-all ${
          conflictCount > 0
            ? "bg-red-500/20 text-red-400 border border-red-500/30 cursor-not-allowed"
            : "bg-green-500 hover:bg-green-400 text-black shadow-[0_0_20px_rgba(34,197,94,0.2)]"
        } disabled:opacity-60`}
      >
        {isProcessing ? "Locking Schedule..." :
         conflictCount > 0 ? `⚠️ Resolve ${conflictCount} Conflict${conflictCount > 1 ? "s" : ""} First` :
         "Approve & Lock Schedule"}
        {!isProcessing && conflictCount === 0 && <CalendarCheck2 className="w-5 h-5 ml-2" />}
      </Button>
    </div>
  );
}
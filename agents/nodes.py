import re
import json
from langchain_core.messages import SystemMessage, ToolMessage, AIMessage
from agents.state import AgentState
from agents.tools import tools_by_name
from langgraph.graph import END


# ─────────────────────────────────────────────
# Deterministic Phase Transitions
# ─────────────────────────────────────────────

PHASE_TRANSITIONS = {
    "hype": "schedule_review",
    "schedule_review": "email_draft",
    "email_draft": "done",
    "reschedule": "email_draft",
}


# ─────────────────────────────────────────────
# JSON Sanitizer
# ─────────────────────────────────────────────

_JSON_TOOL_CALL_RE = re.compile(
    r'\{\s*"name"\s*:\s*"[^"]+"\s*,\s*"parameters"\s*:', re.DOTALL
)


def _sanitize_response(content: str) -> str:
    """
    Local LLMs sometimes output raw JSON tool calls as text instead of using
    the proper tool-calling mechanism. This strips those JSON blocks so the
    frontend never sees raw JSON.
    """
    if not content:
        return content

    # Check if the entire content is a raw JSON tool call
    stripped = content.strip()
    if stripped.startswith("{") and _JSON_TOOL_CALL_RE.search(stripped):
        # Entire message is a stray tool call — replace with fallback
        return "Processing your request..."

    # Check if JSON is embedded within text — strip just the JSON part
    if _JSON_TOOL_CALL_RE.search(content):
        # Remove the JSON block but keep surrounding text
        cleaned = _JSON_TOOL_CALL_RE.sub("", content)
        # Also remove any trailing } that was part of the JSON
        # Find and remove complete JSON objects that look like tool calls
        cleaned = re.sub(
            r'\{[^{}]*"name"\s*:\s*"[^"]*"[^{}]*"parameters"\s*:\s*\{[^{}]*\}[^{}]*\}',
            '', content
        )
        cleaned = cleaned.strip()
        if cleaned:
            return cleaned
        return "Processing your request..."

    return content


# ─────────────────────────────────────────────
# Agent Node Factory
# ─────────────────────────────────────────────

def create_agent(llm, agent_tools, system_prompt, agent_name):
    """
    Returns a graph-node function for a specialised agent.
    Injects phase, file paths, event info, and all accumulated context.
    """
    bound_llm = llm.bind_tools(agent_tools) if agent_tools else llm

    def agent_node(state: AgentState):
        phase = state.get("phase", "hype")
        ctx = f"\n\n[CURRENT PHASE: {phase}]"

        # Inject event info
        event_name = state.get("event_name")
        if event_name:
            ctx += f"\n[EVENT NAME: {event_name}]"

        event_date = state.get("event_date")
        if event_date:
            ctx += f"\n[EVENT DATE: {event_date}]"

        event_type = state.get("event_type")
        if event_type:
            ctx += f"\n[EVENT TYPE: {event_type}]"

        # Inject file paths
        schedule_csv = state.get("schedule_csv_path")
        if schedule_csv:
            ctx += f"\n[SCHEDULE CSV PATH: {schedule_csv}]"

        participant_csv = state.get("participant_csv_path")
        if participant_csv:
            ctx += f"\n[PARTICIPANT CSV PATH: {participant_csv}]"

        # Inject accumulated data
        taglines = state.get("approved_taglines")
        if taglines:
            ctx += f"\n[APPROVED TAGLINES: {taglines}]"

        schedule = state.get("approved_schedule")
        if schedule:
            ctx += f"\n[APPROVED SCHEDULE:\n{schedule}\n]"

        participants = state.get("participant_data")
        if participants:
            ctx += f"\n[PARTICIPANT DATA: {participants}]"

        full_prompt = system_prompt + ctx

        response = bound_llm.invoke(
            [SystemMessage(content=full_prompt)] + state["messages"]
        )

        # Sanitize: strip raw JSON tool calls from text output
        if hasattr(response, "content") and response.content:
            if not (hasattr(response, "tool_calls") and response.tool_calls):
                sanitized = _sanitize_response(str(response.content))
                if sanitized != str(response.content):
                    response = AIMessage(content=sanitized)

        updates = {"messages": [response], "sender": agent_name}

        # Let the supervisor set phase (for reschedule)
        if agent_name == "supervisor" and hasattr(response, "content") and response.content:
            content = str(response.content)
            phase_match = re.search(r"SET_PHASE:\s*(\w+)", content)
            if phase_match:
                updates["phase"] = phase_match.group(1)

        return updates

    return agent_node


# ─────────────────────────────────────────────
# Tool Executor
# ─────────────────────────────────────────────

def tool_executor(state: AgentState):
    """
    Runs tool calls and persists results to state based on tool name.
    """
    last_message = state["messages"][-1]
    tool_calls = last_message.tool_calls if hasattr(last_message, "tool_calls") and last_message.tool_calls else []

    results = []
    for tc in tool_calls:
        tool_fn = tools_by_name.get(tc["name"])
        if tool_fn is None:
            obs = f"Error: Unknown tool '{tc['name']}'. Available tools: {list(tools_by_name.keys())}"
        else:
            try:
                obs = tool_fn.invoke(tc["args"])
            except Exception as e:
                obs = f"Error executing {tc['name']}: {str(e)}"
        results.append(ToolMessage(content=str(obs), tool_call_id=tc["id"]))

    updates = {"messages": results}

    # Persist CLEAN results to state (strip "SUCCESS:" prefixes so they
    # don't leak into email drafts or other agent contexts)
    for tc, result in zip(tool_calls, results):
        name = tc["name"]
        clean = result.content

        # Strip "SUCCESS: ..." prefix lines from stored data
        if clean.startswith("SUCCESS:"):
            # Remove first line ("SUCCESS: ...") and keep the rest
            lines = clean.split("\n", 1)
            clean = lines[1].strip() if len(lines) > 1 else clean

        if name == "queue_social_media_posts":
            updates["approved_taglines"] = clean
        elif name == "build_schedule":
            updates["approved_schedule"] = clean
        elif name == "read_schedule_csv":
            updates["approved_schedule"] = clean
        elif name == "recalculate_schedule":
            # Also update approved_schedule on recalculate
            updates["approved_schedule"] = clean
        elif name == "read_participant_csv":
            updates["participant_data"] = clean
        elif name == "send_personalized_emails":
            updates["emails_sent"] = True

    return updates


# ─────────────────────────────────────────────
# Phase Advancer (deterministic, no LLM)
# ─────────────────────────────────────────────

def phase_advancer(state: AgentState):
    """
    Advances to the next phase after an agent says DONE.
    Completely deterministic — uses PHASE_TRANSITIONS map.
    """
    current = state.get("phase", "hype")
    next_phase = PHASE_TRANSITIONS.get(current, "done")
    return {"phase": next_phase}


# ─────────────────────────────────────────────
# Routing Functions (ALL DETERMINISTIC)
# ─────────────────────────────────────────────

# Map: phase → which agent handles it
PHASE_TO_AGENT = {
    "hype": "content_strategist",
    "schedule_review": "scheduler",
    "email_draft": "communications",
    "reschedule": "scheduler",
    "done": "supervisor",
}


def entry_router(state: AgentState):
    """
    Deterministic entry point when user sends a new message.
    Routes based on phase + whether a sub-agent is still active.
    """
    sender = state.get("sender", "")
    phase = state.get("phase", "hype")

    # If a sub-agent was active and hasn't finished, route back to them
    if sender not in ("supervisor", None, ""):
        messages = state.get("messages", [])
        for msg in reversed(messages):
            if msg.type == "ai":
                if "DONE" in str(msg.content):
                    break  # Agent finished — fall through to phase routing
                return sender  # Agent still active — route back
            continue

    # Phase-based deterministic routing
    return PHASE_TO_AGENT.get(phase, "supervisor")


def supervisor_router(state: AgentState):
    """
    After supervisor runs, route based on current phase.
    If phase was changed to reschedule, auto-route to scheduler.
    """
    phase = state.get("phase", "done")

    if phase == "reschedule":
        return {"next": "scheduler"}

    # For done → pause for user
    return {"next": END}


def agent_router(state: AgentState):
    """
    After a specialist agent runs:
      tool_calls → tools
      DONE       → phase_advancer (deterministic phase transition)
      otherwise  → END (pause for user, e.g., waiting for approval)
    """
    last_message = state["messages"][-1]

    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"

    content = str(last_message.content)
    if "DONE" in content:
        return "phase_advancer"

    return END
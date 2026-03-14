import re
import json
from langchain_core.messages import SystemMessage, ToolMessage, AIMessage
from agents.state import AgentState
from agents.tools import tools_by_name
from langgraph.graph import END





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
        ctx = "\n\n[CURRENT CONTEXT]"

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

        updates = {"messages": [response], "sender": agent_name}

        # Let the supervisor decide the next agent dynamically
        if agent_name == "supervisor" and hasattr(response, "content") and response.content:
            content = str(response.content)
            route_match = re.search(r"ROUTE_TO:\s*(\w+)", content)
            if route_match:
                updates["next"] = route_match.group(1)

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
        elif name == "estimate_budget":
            updates["budget_estimate"] = clean
        elif name == "update_event_details":
            args = tc.get("args", {})
            if isinstance(args, str):
                try:
                    args = json.loads(args)
                except json.JSONDecodeError:
                    args = {}
            if "event_name" in args: updates["event_name"] = str(args["event_name"])
            if "event_date" in args: updates["event_date"] = str(args["event_date"])
            if "event_type" in args: updates["event_type"] = str(args["event_type"])

    return updates


# ─────────────────────────────────────────────
# Routing Functions (SWARM DYNAMIC)
# ─────────────────────────────────────────────

def entry_router(state: AgentState):
    """
    Entry point when user sends a new message.
    If a specialist agent was active and hasn't finished (no DONE) and hasn't explicitly routed back to supervisor, return to them.
    Otherwise, go to the supervisor to route the new message.
    """
    sender = state.get("sender", "")

    # If a sub-agent was active and hasn't finished, route back to them
    if sender not in ("supervisor", None, ""):
        messages = state.get("messages", [])
        for msg in reversed(messages):
            if msg.type == "ai":
                content = str(msg.content)
                if "DONE" in content or "ROUTE_TO: supervisor" in content:
                    break  # Agent finished or explicitly routed back — fall through to supervisor
                return sender  # Agent still active — route back
            continue

    return "supervisor"


def supervisor_router(state: AgentState):
    """
    After supervisor runs, it outputs a tool call to route to the next agent,
    which gets saved in state["next"]; or if no next agent, we pause for user.
    """
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
        
    nxt = state.get("next")
    # if supervisor explicitly output FINISH or no next agent, pause for user
    if not nxt or nxt == "FINISH":
        return END
    
    return nxt


def agent_router(state: AgentState):
    """
    After a specialist agent runs:
      tool_calls → tools
      DONE       → return to supervisor to decide what's next
      otherwise  → END (pause for user, e.g., waiting for approval)
    """
    last_message = state["messages"][-1]

    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"

    content = str(last_message.content)
    if "DONE" in content or "ROUTE_TO: supervisor" in content:
        # Agent finished its task. Return to supervisor to evaluate if more needs to be done.
        return "supervisor"

    return END
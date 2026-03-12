import sqlite3
from langchain_ollama import ChatOllama
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.sqlite import SqliteSaver

from agents.state import AgentState
from agents.prompts import (
    SUPERVISOR_PROMPT,
    CONTENT_STRATEGIST_PROMPT,
    SCHEDULER_PROMPT,
    COMMUNICATIONS_PROMPT,
)
from agents.tools import (
    content_strategist_tools,
    scheduler_tools,
    communications_tools,
)
from agents.nodes import (
    create_agent,
    tool_executor,
    phase_advancer,
    supervisor_router,
    agent_router,
    entry_router,
)


# ─────────────────────────────────────────────
# LLM
# ─────────────────────────────────────────────

llm = ChatOllama(
    model="llama3.1",
    temperature=0,
    streaming=False,
)


# ─────────────────────────────────────────────
# Create Agent Nodes
# ─────────────────────────────────────────────

supervisor_node = create_agent(llm, [], SUPERVISOR_PROMPT, "supervisor")
content_strategist_node = create_agent(llm, content_strategist_tools, CONTENT_STRATEGIST_PROMPT, "content_strategist")
scheduler_node = create_agent(llm, scheduler_tools, SCHEDULER_PROMPT, "scheduler")
communications_node = create_agent(llm, communications_tools, COMMUNICATIONS_PROMPT, "communications")


# ─────────────────────────────────────────────
# Build the Graph
# ─────────────────────────────────────────────

workflow = StateGraph(AgentState)

# Register all nodes
workflow.add_node("supervisor", supervisor_node)
workflow.add_node("content_strategist", content_strategist_node)
workflow.add_node("scheduler", scheduler_node)
workflow.add_node("communications", communications_node)
workflow.add_node("tools", tool_executor)
workflow.add_node("supervisor_router", supervisor_router)
workflow.add_node("phase_advancer", phase_advancer)

# Entry: deterministic phase-based routing
workflow.set_conditional_entry_point(
    entry_router,
    {
        "supervisor": "supervisor",
        "content_strategist": "content_strategist",
        "scheduler": "scheduler",
        "communications": "communications",
    },
)

# Supervisor → supervisor_router → (scheduler for reschedule | END)
workflow.add_edge("supervisor", "supervisor_router")
workflow.add_conditional_edges(
    "supervisor_router",
    lambda state: state.get("next", END),
    {
        "scheduler": "scheduler",
        END: END,
    },
)

# Each specialist agent → agent_router → (tools | phase_advancer | END)
for name in ("content_strategist", "scheduler", "communications"):
    workflow.add_conditional_edges(
        name,
        agent_router,
        {"tools": "tools", "phase_advancer": "phase_advancer", END: END},
    )

# Tools → back to the sender agent
workflow.add_conditional_edges(
    "tools",
    lambda state: state.get("sender", "supervisor"),
    {
        "content_strategist": "content_strategist",
        "scheduler": "scheduler",
        "communications": "communications",
        "supervisor": "supervisor",
    },
)

# Phase advancer → END (user sees result, next message re-enters via entry_router)
workflow.add_edge("phase_advancer", END)


# ─────────────────────────────────────────────
# Compile with In-Memory SQLite Checkpointer
# ─────────────────────────────────────────────

memory = SqliteSaver(sqlite3.connect(":memory:", check_same_thread=False))

agent = workflow.compile(checkpointer=memory)
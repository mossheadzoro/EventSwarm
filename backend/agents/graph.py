import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.mongodb import MongoDBSaver
from pymongo import MongoClient
from agents.state import AgentState
from agents.prompts import (
    SUPERVISOR_PROMPT,
    CONTENT_STRATEGIST_PROMPT,
    SCHEDULER_PROMPT,
    COMMUNICATIONS_PROMPT,
    ART_DIRECTOR_PROMPT,
)
from agents.tools import (
    content_strategist_tools,
    scheduler_tools,
    communications_tools,
    art_director_tools,
    supervisor_tools,
)
from agents.nodes import (
    create_agent,
    tool_executor,
    supervisor_router,
    agent_router,
    entry_router,
)
from dotenv import load_dotenv

load_dotenv()


# ─────────────────────────────────────────────
# LLM
# ─────────────────────────────────────────────

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0,
)


# ─────────────────────────────────────────────
# Create Agent Nodes
# ─────────────────────────────────────────────

supervisor_node = create_agent(llm, supervisor_tools, SUPERVISOR_PROMPT, "supervisor")
content_strategist_node = create_agent(llm, content_strategist_tools, CONTENT_STRATEGIST_PROMPT, "content_strategist")
scheduler_node = create_agent(llm, scheduler_tools, SCHEDULER_PROMPT, "scheduler")
communications_node = create_agent(llm, communications_tools, COMMUNICATIONS_PROMPT, "communications")
art_director_node = create_agent(llm, art_director_tools, ART_DIRECTOR_PROMPT, "art_director")


# ─────────────────────────────────────────────
# Build the Graph
# ─────────────────────────────────────────────

workflow = StateGraph(AgentState)

# Register all nodes
workflow.add_node("supervisor", supervisor_node)
workflow.add_node("content_strategist", content_strategist_node)
workflow.add_node("scheduler", scheduler_node)
workflow.add_node("communications", communications_node)
workflow.add_node("art_director", art_director_node)
workflow.add_node("tools", tool_executor)

# Entry: deterministic phase-based routing
workflow.set_conditional_entry_point(
    entry_router,
    {
        "supervisor": "supervisor",
        "content_strategist": "content_strategist",
        "scheduler": "scheduler",
        "communications": "communications",
        "art_director": "art_director",
    },
)

# Supervisor → supervisor_router → (specialist | END)
workflow.add_conditional_edges(
    "supervisor",
    supervisor_router,
    {
        "content_strategist": "content_strategist",
        "scheduler": "scheduler",
        "communications": "communications",
        "art_director": "art_director",
        "tools": "tools",
        END: END,
    },
)

# Each specialist agent → agent_router → (tools | supervisor | END)
for name in ("content_strategist", "scheduler", "communications", "art_director"):
    workflow.add_conditional_edges(
        name,
        agent_router,
        {"tools": "tools", "supervisor": "supervisor", END: END},
    )

# Tools → back to the sender agent
workflow.add_conditional_edges(
    "tools",
    lambda state: state.get("sender", "supervisor"),
    {
        "content_strategist": "content_strategist",
        "scheduler": "scheduler",
        "communications": "communications",
        "art_director": "art_director",
        "supervisor": "supervisor",
    },
)


# ─────────────────────────────────────────────
# Compile with MongoDB Checkpointer
# ─────────────────────────────────────────────

mongodb_uri = os.environ.get("MONGODB_URI", "mongodb://localhost:27017")
client = MongoClient(mongodb_uri)
memory = MongoDBSaver(client)

agent = workflow.compile(checkpointer=memory)
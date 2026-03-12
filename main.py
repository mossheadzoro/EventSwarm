import sys
import os
import shutil
from contextlib import asynccontextmanager

_base_dir = os.path.dirname(os.path.abspath(__file__))
if _base_dir not in sys.path:
    sys.path.insert(0, _base_dir)

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, SystemMessage

from agents.graph import agent

# ─────────────────────────────────────────────
# Lifespan & Directory Management
# ─────────────────────────────────────────────

UPLOAD_DIR = os.path.join(_base_dir, "uploads")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    # Create the uploads directory when the server starts
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    yield  # Server runs here
    
    # --- Shutdown ---
    # Clean up the directory and all its contents when the server stops
    if os.path.exists(UPLOAD_DIR):
        shutil.rmtree(UPLOAD_DIR)

# ─────────────────────────────────────────────
# App
# ─────────────────────────────────────────────

app = FastAPI(title="EventSwarm API", version="2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────
# Models
# ─────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    thread_id: str = "default_thread"


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def _cfg(thread_id: str):
    return {"configurable": {"thread_id": thread_id}}


def _get_phase(config: dict) -> str:
    s = agent.get_state(config)
    return s.values.get("phase", "hype") if s.values else "hype"


def _extract_new(all_msgs: list, start: int) -> list[dict]:
    """Convert new LangChain messages to JSON dicts."""
    out = []
    for msg in all_msgs[start:]:
        if not hasattr(msg, "content") or not msg.content:
            continue
        role = msg.__class__.__name__
        if role == "HumanMessage":
            continue
        entry = {"role": role, "content": str(msg.content), "tool_calls": None}
        if hasattr(msg, "tool_calls") and msg.tool_calls:
            entry["tool_calls"] = [{"name": t["name"], "args": t["args"]} for t in msg.tool_calls]
        out.append(entry)
    return out


def _needs_approval(msgs: list[dict]) -> bool:
    for m in reversed(msgs):
        if m["role"] == "AIMessage":
            return "APPROVE" in m["content"].upper()
    return False


def _invoke_and_respond(user_msgs, config, thread_id):
    """Shared logic: snapshot → invoke → extract new messages → return."""
    state = agent.get_state(config)
    start = len(state.values.get("messages", [])) if state.values else 0

    result = agent.invoke({"messages": user_msgs}, config=config)

    all_msgs = result.get("messages", [])
    new = _extract_new(all_msgs, start)
    phase = result.get("phase", _get_phase(config))

    return {
        "status": "success",
        "messages": new,
        "needs_approval": _needs_approval(new),
        "phase": phase,
        "thread_id": thread_id,
    }


# ─────────────────────────────────────────────
# Setup Endpoint (CSV-first)
# ─────────────────────────────────────────────

@app.post("/api/setup")
async def setup(
    event_name: str = Form(...),
    event_date: str = Form(...),
    event_type: str = Form(...),
    schedule_csv: UploadFile = File(...),
    participant_csv: UploadFile = File(...),
    thread_id: str = Form("default_thread"),
):
    """
    One-shot setup: accepts event info + both CSVs.
    Initializes the graph state and sets phase to 'hype'.
    Then auto-triggers the content strategist to generate taglines.
    """
    # Validate CSVs
    for f, label in [(schedule_csv, "schedule"), (participant_csv, "participant")]:
        if not f.filename.endswith(".csv"):
            return {"status": "error", "message": f"Only CSV files are accepted for {label}."}

    try:
        # Save files
        sched_path = os.path.join(UPLOAD_DIR, schedule_csv.filename)
        part_path = os.path.join(UPLOAD_DIR, participant_csv.filename)

        with open(sched_path, "wb") as f:
            shutil.copyfileobj(schedule_csv.file, f)
        with open(part_path, "wb") as f:
            shutil.copyfileobj(participant_csv.file, f)

        config = _cfg(thread_id)

        # Initialize state with all info + phase set to hype
        init_state = {
            "event_name": event_name,
            "event_date": event_date,
            "event_type": event_type,
            "schedule_csv_path": sched_path,
            "participant_csv_path": part_path,
            "phase": "hype",
            "messages": [
                SystemMessage(
                    content=(
                        f"Event setup complete. "
                        f"Event: {event_name}, Date: {event_date}, Type: {event_type}. "
                        f"Schedule CSV: {sched_path}. Participant CSV: {part_path}."
                    )
                )
            ],
        }
        agent.update_state(config, init_state, as_node="supervisor")

        # Auto-trigger the content strategist by sending a kick-off message
        trigger_msg = HumanMessage(
            content=f"Generate taglines for our event: {event_name}, a {event_type} on {event_date}."
        )
        return _invoke_and_respond([trigger_msg], config, thread_id)

    except Exception as e:
        return {"status": "error", "message": str(e)}


# ─────────────────────────────────────────────
# Chat Endpoints
# ─────────────────────────────────────────────

@app.post("/api/chat")
def chat(req: ChatRequest):
    """Main chat — sends user message into the swarm."""
    try:
        config = _cfg(req.thread_id)
        return _invoke_and_respond([HumanMessage(content=req.message)], config, req.thread_id)
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/api/approve")
def approve(req: ChatRequest):
    """Send APPROVE to resume the paused graph."""
    try:
        config = _cfg(req.thread_id)
        return _invoke_and_respond([HumanMessage(content="APPROVE")], config, req.thread_id)
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ─────────────────────────────────────────────
# State / History / Reset
# ─────────────────────────────────────────────

@app.get("/api/state")
def get_state(thread_id: str = "default_thread"):
    """Full state inspection for frontend sync / debugging."""
    try:
        config = _cfg(thread_id)
        s = agent.get_state(config)
        if not s.values:
            return {"status": "success", "state": {"phase": "setup", "message_count": 0}}

        v = s.values
        return {
            "status": "success",
            "state": {
                "phase": v.get("phase", "setup"),
                "sender": v.get("sender"),
                "event_name": v.get("event_name"),
                "event_date": v.get("event_date"),
                "event_type": v.get("event_type"),
                "approved_taglines": v.get("approved_taglines"),
                "approved_schedule": v.get("approved_schedule"),
                "participant_data": v.get("participant_data"),
                "emails_sent": v.get("emails_sent", False),
                "schedule_csv_path": v.get("schedule_csv_path"),
                "participant_csv_path": v.get("participant_csv_path"),
                "message_count": len(v.get("messages", [])),
            },
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/api/history")
def get_history(thread_id: str = "default_thread"):
    """Full message history for rebuilding the conversation."""
    try:
        config = _cfg(thread_id)
        s = agent.get_state(config)
        if not s.values:
            return {"status": "success", "messages": [], "phase": "setup"}
        msgs = _extract_new(s.values.get("messages", []), 0)
        return {"status": "success", "messages": msgs, "phase": s.values.get("phase", "setup")}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/api/reset")
def reset_thread(req: ChatRequest):
    """Reset a thread by using a new thread_id."""
    try:
        return {"status": "success", "message": f"Use a new thread_id to start fresh. Current: {req.thread_id}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ─────────────────────────────────────────────
# Frontend
# ─────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
def serve_frontend():
    fp = os.path.join(_base_dir, "index.html")
    if os.path.exists(fp):
        with open(fp, "r", encoding="utf-8") as f:
            return f.read()
    return HTMLResponse(content="<h1>index.html not found</h1>", status_code=404)
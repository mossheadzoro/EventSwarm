import sys
import os
import shutil
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from langchain_core.messages import HumanMessage, SystemMessage
from agents.graph import agent
from dotenv import load_dotenv
load_dotenv()


# ─────────────────────────────────────────────
# Lifespan & Directory Management
# ─────────────────────────────────────────────

_base_dir = os.path.dirname(os.path.abspath(__file__))
if _base_dir not in sys.path:
    sys.path.insert(0, _base_dir)
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
    return "swarm" # Phase doesn't exist anymore, we are non-deterministic


def _extract_new(all_msgs: list, start: int) -> list[dict]:
    """Convert new LangChain messages to JSON dicts."""
    out = []
    
    def _get_text(content) -> str:
        if isinstance(content, str):
            return content
        elif isinstance(content, list):
            texts = [part.get("text", "") for part in content if isinstance(part, dict) and "text" in part]
            return "\n".join(texts)
        return str(content)

    for msg in all_msgs[start:]:
        if not hasattr(msg, "content") or not msg.content:
            continue
        role = msg.__class__.__name__
        if role == "HumanMessage":
            continue
            
        text_content = _get_text(msg.content)
        entry = {"role": role, "content": text_content, "tool_calls": None}
        
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
    phase = result.get("sender", "supervisor")

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
    schedule_csv: Optional[UploadFile] = File(None),
    participant_csv: Optional[UploadFile] = File(None),
    thread_id: str = Form("default_thread"),
):
    """
    One-shot setup: accepts event info + optional CSVs.
    Initializes the graph state for the Gemini Swarm.
    """
    try:
        sched_path = None
        part_path = None

        # Process optional Schedule CSV
        if schedule_csv and schedule_csv.filename:
            if not schedule_csv.filename.endswith(".csv"):
                return {"status": "error", "message": "Only CSV files are accepted for schedule."}
            sched_path = os.path.join(UPLOAD_DIR, schedule_csv.filename)
            with open(sched_path, "wb") as f:
                shutil.copyfileobj(schedule_csv.file, f)

        # Process optional Participant CSV
        if participant_csv and participant_csv.filename:
            if not participant_csv.filename.endswith(".csv"):
                return {"status": "error", "message": "Only CSV files are accepted for participant."}
            part_path = os.path.join(UPLOAD_DIR, participant_csv.filename)
            with open(part_path, "wb") as f:
                shutil.copyfileobj(participant_csv.file, f)

        config = _cfg(thread_id)

        # Initialize state with all info
        init_state = {
            "event_name": event_name,
            "event_date": event_date,
            "event_type": event_type,
            "schedule_csv_path": sched_path,
            "participant_csv_path": part_path,
            "messages": [
                SystemMessage(
                    content=(
                        f"Event setup complete.\n"
                        f"Event: {event_name}, Date: {event_date}, Type: {event_type}.\n"
                        f"Schedule CSV Uploaded: {'Yes' if sched_path else 'No'}\n"
                        f"Participant CSV Uploaded: {'Yes' if part_path else 'No'}"
                    )
                )
            ],
            "sender": "user" # Starting point
        }
        agent.update_state(config, init_state, as_node="supervisor")

        # Auto-trigger the first swarm interaction
        trigger_msg = HumanMessage(
            content=f"Hello swarm! We are organizing {event_name}, a {event_type} on {event_date}. "
                    f"Please review the uploaded files (if any) and tell me what we should do first."
        )
        return _invoke_and_respond([trigger_msg], config, thread_id)

    except Exception as e:
        import traceback
        traceback.print_exc()
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


@app.post("/api/chat_with_file")
async def chat_with_file(
    message: str = Form("Here is the requested file."),
    thread_id: str = Form("default_thread"),
    file: UploadFile = File(...)
):
    """Chat endpoint that also accepts a mid-conversation file upload."""
    try:
        if not file.filename.endswith(".csv"):
            return {"status": "error", "message": "Only CSV files are accepted."}
            
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
            
        config = _cfg(thread_id)
        
        # We assume mid-chat uploads are participant CSVs since schedule is done first
        # Update the state directly before invoking the agent
        agent.update_state(config, {"participant_csv_path": file_path})
        
        # Inject the message so the agent knows the file arrived
        notify_msg = HumanMessage(content=f"{message}\n[System: User uploaded '{file.filename}']")
        
        return _invoke_and_respond([notify_msg], config, thread_id)
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
            return {"status": "success", "state": {"message_count": 0}}

        v = s.values
        return {
            "status": "success",
            "state": {
                "sender": v.get("sender"),
                "event_name": v.get("event_name"),
                "event_date": v.get("event_date"),
                "event_type": v.get("event_type"),
                "approved_taglines": v.get("approved_taglines"),
                "approved_schedule": v.get("approved_schedule"),
                "participant_data": v.get("participant_data"),
                "emails_sent": v.get("emails_sent", False),
                "poster_url": v.get("poster_url"),
                "schedule_csv_path": v.get("schedule_csv_path"),
                "participant_csv_path": v.get("participant_csv_path"),
                "message_count": len(v.get("messages", [])),
            },
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/poster")
def get_poster(thread_id: str = "default_thread"):
    """Returns just the poster URL for the frontend team."""
    try:
        config = _cfg(thread_id)
        s = agent.get_state(config)
        if not s.values or not s.values.get("poster_url"):
            return {"status": "error", "message": "No poster generated yet."}
        return {"status": "success", "poster_url": s.values.get("poster_url")}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/api/history")
def get_history(thread_id: str = "default_thread"):
    """Full message history for rebuilding the conversation."""
    try:
        config = _cfg(thread_id)
        s = agent.get_state(config)
        if not s.values:
            return {"status": "success", "messages": []}
        msgs = _extract_new(s.values.get("messages", []), 0)
        return {"status": "success", "messages": msgs}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/api/reset")
def reset_thread(req: ChatRequest):
    """Reset a thread by using a new thread_id."""
    try:
        return {"status": "success", "message": f"Use a new thread_id to start fresh. Current: {req.thread_id}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/report")
def get_event_report(thread_id: str = "default_thread"):
    """Generates a professional PDF report from the event state."""
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet
        from fastapi.responses import FileResponse
        import tempfile
        
        config = _cfg(thread_id)
        s = agent.get_state(config)
        if not s.values:
            return {"status": "error", "message": "No active event state found."}
            
        v = s.values
        event_name = v.get("event_name") or "Unknown Event"
        event_date = str(v.get("event_date") or "TBD")
        event_type = str(v.get("event_type") or "Event")
        schedule = str(v.get("approved_schedule") or "Not formalized yet.")
        
        budget_str = str(v.get("budget_estimate") or "Budget not estimated yet.")
                
        temp_pdf_path = os.path.join(tempfile.gettempdir(), f"{thread_id}_report.pdf")
        doc = SimpleDocTemplate(temp_pdf_path, pagesize=letter)
        styles = getSampleStyleSheet()
        Story = []
        
        Story.append(Paragraph(f"Event Report: {event_name}", styles['Title']))
        Story.append(Spacer(1, 12))
        Story.append(Paragraph(f"<b>Date:</b> {event_date}", styles['Normal']))
        Story.append(Paragraph(f"<b>Type:</b> {event_type}", styles['Normal']))
        Story.append(Spacer(1, 12))
        
        Story.append(Paragraph("<b>Budget & Volunteer Estimate</b>", styles['Heading2']))
        Story.append(Spacer(1, 6))
        for line in budget_str.split('\n'):
            Story.append(Paragraph(line, styles['Normal']))
        Story.append(Spacer(1, 12))

        Story.append(Paragraph("<b>Approved Schedule</b>", styles['Heading2']))
        Story.append(Spacer(1, 6))
        for line in schedule.split('\n'):
            Story.append(Paragraph(line, styles['Normal']))
            
        doc.build(Story)
        return FileResponse(path=temp_pdf_path, filename=f"report.pdf", media_type="application/pdf")
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

# ─────────────────────────────────────────────
# Health Check
# ─────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "ok", "service": "EventSwarm API", "version": "2.0"}

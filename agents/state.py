from typing import Annotated, Optional
from typing_extensions import TypedDict
from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    """Shared state passed through every node in the EventSwarm graph."""

    # ── Core conversation ──
    messages: Annotated[list[AnyMessage], add_messages]
    sender: str

    # ── Workflow phase ──
    phase: str  

    # ── Event metadata (set once at setup) ──
    event_name: Optional[str]
    event_date: Optional[str]
    event_type: Optional[str]

    # ── File paths (set once at setup) ──
    schedule_csv_path: Optional[str]
    participant_csv_path: Optional[str]

    # ── Accumulated agent outputs ──
    approved_taglines: Optional[str]
    approved_schedule: Optional[str]
    participant_data: Optional[str]
    emails_sent: Optional[bool]

    # ── Supervisor routing helper ──
    next: Optional[str]
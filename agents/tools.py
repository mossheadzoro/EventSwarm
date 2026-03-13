import os
import base64
import json
import re
from email.message import EmailMessage
from datetime import datetime

import pandas as pd
from langchain.tools import tool

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


# ─────────────────────────────────────────────
# Gmail Helper
# ─────────────────────────────────────────────

GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.compose"]

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_TOKEN_PATH = os.path.join(_PROJECT_ROOT, "token.json")
_CREDS_PATH = os.path.join(_PROJECT_ROOT, "credentials.json")


def _get_gmail_service():
    """Authenticate and return a Gmail API service object."""
    creds = None
    if os.path.exists(_TOKEN_PATH):
        creds = Credentials.from_authorized_user_file(_TOKEN_PATH, GMAIL_SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(_CREDS_PATH, GMAIL_SCOPES)
            creds = flow.run_local_server(port=0)
        with open(_TOKEN_PATH, "w") as token:
            token.write(creds.to_json())

    return build("gmail", "v1", credentials=creds)


# ─────────────────────────────────────────────
# Schedule Helpers (conflict detection)
# ─────────────────────────────────────────────

def _parse_time(t_str: str):
    """Parse a time string like '10:00' or '9:30' into minutes since midnight."""
    t_str = t_str.strip()
    for fmt in ("%H:%M", "%H.%M", "%I:%M %p", "%I:%M%p"):
        try:
            t = datetime.strptime(t_str, fmt)
            return t.hour * 60 + t.minute
        except ValueError:
            continue
    return None


def _detect_conflicts(records: list[dict]) -> list[str]:
    """Detect overlapping time slots in schedule records."""
    parsed = []
    for r in records:
        start = _parse_time(str(r.get("start_time", "")))
        end = _parse_time(str(r.get("end_time", "")))
        session = str(r.get("session", "Unknown"))
        if start is not None and end is not None:
            parsed.append({"start": start, "end": end, "session": session})

    # Sort by start time
    parsed.sort(key=lambda x: x["start"])

    conflicts = []
    for i in range(len(parsed) - 1):
        curr = parsed[i]
        nxt = parsed[i + 1]
        if curr["end"] > nxt["start"]:
            curr_start_str = f"{curr['start'] // 60}:{curr['start'] % 60:02d}"
            curr_end_str = f"{curr['end'] // 60}:{curr['end'] % 60:02d}"
            nxt_start_str = f"{nxt['start'] // 60}:{nxt['start'] % 60:02d}"
            nxt_end_str = f"{nxt['end'] // 60}:{nxt['end'] % 60:02d}"
            conflicts.append(
                f"⚠️ CONFLICT: '{curr['session']}' ({curr_start_str}-{curr_end_str}) "
                f"overlaps with '{nxt['session']}' ({nxt_start_str}-{nxt_end_str})"
            )
    return conflicts


def _format_schedule(records: list[dict]) -> str:
    """Format schedule records as a human-readable numbered list."""
    lines = []
    for i, r in enumerate(records, 1):
        start = str(r.get("start_time", "")).strip()
        end = str(r.get("end_time", "")).strip()
        session = str(r.get("session", "")).strip()
        speaker = str(r.get("speaker", "")).strip()
        line = f"{i}. {start}-{end} — {session}"
        if speaker and speaker != "nan":
            line += f" (Speaker: {speaker})"
        lines.append(line)
    return "\n".join(lines)


# ─────────────────────────────────────────────
# Engagement Predictor (singleton)
# ─────────────────────────────────────────────

_predictor = None


def _get_predictor():
    """Lazy-load the engagement predictor — trains on first use."""
    global _predictor
    if _predictor is not None:
        return _predictor

    from engagement_predictor import GeneralEngagementPredictor
    from syn_datagen import generate_general_data

    data_path = os.path.join(_PROJECT_ROOT, "general_engagement_data.csv")
    if not os.path.exists(data_path):
        generate_general_data(filename=data_path)

    _predictor = GeneralEngagementPredictor()
    _predictor.train(pd.read_csv(data_path))
    return _predictor


# ─────────────────────────────────────────────
# Content Strategist Tools
# ─────────────────────────────────────────────

@tool
def generate_taglines(event_name: str, event_type: str, event_date: str) -> str:
    """
    Generates a set of promotional taglines / social-media post ideas for
    the given event. Returns draft suggestions for the user to review.
    """
    import random

    pool = [
        f"🚀 {event_name} is coming on {event_date}! Are you ready to innovate?",
        f"🔥 The ultimate {event_type} experience — {event_name}. Mark your calendars!",
        f"💡 Build. Learn. Connect. Join {event_name} on {event_date}!",
        f"⚡ Don't miss {event_name} — where ideas become reality!",
        f"🎯 {event_name}: The {event_type} event of the year. {event_date}.",
        f"🌟 Ready to level up? {event_name} ({event_type}) drops {event_date}!",
        f"🏆 Join the brightest minds at {event_name} — {event_date}!",
        f"🎉 {event_name} is HERE! A {event_type} you won't want to miss.",
        f"💥 {event_date} — save the date for {event_name}, the {event_type} of the year!",
        f"🧠 Innovate. Collaborate. Dominate. {event_name} awaits on {event_date}.",
    ]
    taglines = random.sample(pool, min(3, len(pool)))
    return "Here are the draft taglines:\n" + "\n".join(
        f"{i+1}. {t}" for i, t in enumerate(taglines)
    )


@tool
def analyze_engagement_data(platform: str) -> str:
    """
    Analyzes historical engagement data using an ML model to recommend
    the best time to post content for maximum engagement.
    Call this to get data-driven posting time recommendations.
    """
    try:
        predictor = _get_predictor()
        result = predictor.recommend_optimal_time(hours_ahead=48)

        if isinstance(result, str):
            return result  # Error message

        return (
            f"📊 Engagement Analysis for {platform}:\n"
            f"Based on ML analysis of historical engagement patterns:\n"
            f"• Best time to post: {result['recommended_time']}\n"
            f"• Predicted engagement score: {result['predicted_score']}/100"
        )
    except Exception as e:
        return f"Error analyzing engagement data: {str(e)}"


@tool
def queue_social_media_posts(posts: str) -> str:
    """
    Queues the finalized, user-approved posts into the social media scheduler.
    ONLY call this AFTER the user has approved the taglines.
    posts must be a single string containing all the taglines.
    """
    if isinstance(posts, list):
        posts = "\n".join(str(p) for p in posts)
        
    result = f"SUCCESS: The following posts have been queued for publishing:\n{posts}"
    
    # Auto-run engagement analysis so the user always sees it
    try:
        predictor = _get_predictor()
        eng_data = predictor.recommend_optimal_time(hours_ahead=48)
        if not isinstance(eng_data, str):
            result += (
                f"\n\n📊 Engagement Analysis:\n"
                f"• Best time to post: {eng_data['recommended_time']}\n"
                f"• Predicted engagement score: {eng_data['predicted_score']}/100"
            )
    except Exception:
        pass # Silently fail engagement if something breaks, queue still succeeds
        
    return result


# ─────────────────────────────────────────────
# Scheduler Tools
# ─────────────────────────────────────────────

@tool
def read_schedule_csv(file_path: str) -> str:
    """
    Reads an event schedule from a CSV file, detects conflicts,
    and returns a human-readable formatted schedule.
    """
    try:
        df = pd.read_csv(file_path, header=None)
        if len(df.columns) == 3:
            df.columns = ["start_time", "end_time", "session"]
        elif len(df.columns) == 4:
            df.columns = ["start_time", "end_time", "session", "speaker"]
        elif len(df.columns) >= 5:
            df.columns = ["start_time", "end_time", "session", "speaker", "room"] + [
                f"col_{i}" for i in range(5, len(df.columns))
            ]
        records = df.to_dict("records")

        # Format as readable text
        formatted = _format_schedule(records)

        # Detect conflicts
        conflicts = _detect_conflicts(records)

        result = f"Schedule ({len(records)} sessions):\n{formatted}"
        if conflicts:
            result += "\n\n" + "\n".join(conflicts)
            result += "\n\nPlease resolve these conflicts before finalizing."
        else:
            result += "\n\n✅ No scheduling conflicts detected."
        return result
    except Exception as e:
        return f"Error reading schedule CSV '{file_path}': {str(e)}"


@tool
def build_schedule(schedule_text: str) -> str:
    """
    Finalizes the master timeline. Pass the schedule as plain text.
    ONLY call this AFTER the user has approved the schedule.
    """
    if isinstance(schedule_text, list):
        schedule_text = "\n".join(str(s) for s in schedule_text)
    return f"SUCCESS: Schedule has been finalized:\n{schedule_text}"


@tool
def recalculate_schedule(modified_schedule: str) -> str:
    """
    Validates a modified schedule for conflicts.
    Pass the COMPLETE modified schedule as a formatted list
    (e.g. '1. 10:00-11:00 — Session Name').
    You must apply the user's changes yourself before calling this.
    """
    if isinstance(modified_schedule, list):
        modified_schedule = "\n".join(str(s) for s in modified_schedule)

    # Parse schedule lines to detect conflicts
    lines = modified_schedule.strip().split("\n") if modified_schedule else []
    records = []
    for line in lines:
        m = re.match(r'\d+\.\s*(\d+:\d+)\s*-\s*(\d+:\d+)\s*[—\-]\s*(.*)', line)
        if m:
            records.append({
                "start_time": m.group(1),
                "end_time": m.group(2),
                "session": m.group(3).strip()
            })

    if not records:
        return f"Could not parse schedule. Please provide it as a numbered list like:\n1. 10:00-11:00 — Session Name"

    conflicts = _detect_conflicts(records)
    formatted = _format_schedule(records)

    result = f"Updated schedule ({len(records)} sessions):\n{formatted}"
    if conflicts:
        result += "\n\n" + "\n".join(conflicts)
        result += "\n\nPlease resolve these conflicts before finalizing."
    else:
        result += "\n\n✅ No scheduling conflicts detected."
    return result


# ─────────────────────────────────────────────
# Communications Tools  (Gmail API)
# ─────────────────────────────────────────────

@tool
def read_participant_csv(file_path: str) -> str:
    """
    Reads participant data from a CSV file (registration sheet).
    Expected columns: email, name, and optionally notes/interests.
    Returns extracted and validated participant count and names.
    """
    try:
        df = pd.read_csv(file_path, header=None)
        if len(df.columns) == 2:
            df.columns = ["email", "name"]
        elif len(df.columns) >= 3:
            df.columns = ["email", "name", "notes"] + [
                f"col_{i}" for i in range(3, len(df.columns))
            ]

        valid_records = []
        invalid_emails = []
        for _, row in df.iterrows():
            rec = row.to_dict()
            email = str(rec.get("email", "")).strip()
            if re.match(r"[^@]+@[^@]+\.[^@]+", email):
                valid_records.append(rec)
            else:
                invalid_emails.append(email)

        # Return human-readable summary instead of raw JSON
        result = f"Extracted {len(valid_records)} valid participants:"
        for r in valid_records:
            name = str(r.get("name", "")).strip()
            notes = str(r.get("notes", "")).strip() if "notes" in r else ""
            result += f"\n• {name} ({r['email']})"
            if notes and notes != "nan":
                result += f" — interested in {notes}"

        if invalid_emails:
            result += f"\nSkipped {len(invalid_emails)} invalid emails: {invalid_emails}"
        return result
    except Exception as e:
        return f"Error reading participant CSV '{file_path}': {str(e)}"


@tool
def send_personalized_emails(subject: str, body_template: str, participant_csv_path: str) -> str:
    """
    Sends personalized emails to all participants in the CSV file via Gmail API.
    The body_template should contain {name} and {notes} which get replaced per recipient.
    participant_csv_path is the file path to the participant CSV.
    ONLY call this AFTER the user has approved the email draft.
    """
    if isinstance(subject, list):
        subject = " ".join(str(s) for s in subject)
    if isinstance(body_template, list):
        body_template = "\n".join(str(b) for b in body_template)

    try:
        df = pd.read_csv(participant_csv_path, header=None)
        if len(df.columns) == 2:
            df.columns = ["email", "name"]
        elif len(df.columns) == 3:
            df.columns = ["email", "name", "notes"]
        elif len(df.columns) >= 4:
            df.columns = ["email", "name", "notes"] + [
                f"col_{i}" for i in range(3, len(df.columns))
            ]

        service = _get_gmail_service()
        sent_count = 0
        errors = []

        for _, row in df.iterrows():
            email_addr = str(row.get("email", "")).strip()
            name = str(row.get("name", "Participant")).strip()
            notes = str(row.get("notes", "")).strip() if "notes" in row.index else ""

            if not re.match(r"[^@]+@[^@]+\.[^@]+", email_addr):
                errors.append(f"Invalid email skipped: {email_addr}")
                continue

            personalized_body = (
                body_template
                .replace("{name}", name)
                .replace("{notes}", notes)
            )

            try:
                message = EmailMessage()
                message.set_content(personalized_body)
                message["To"] = email_addr
                message["From"] = "EventSwarm Agent <eventswarm@gmail.com>"
                message["Subject"] = subject

                encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
                send_message = {"raw": encoded_message}

                sent_email = (
                    service.users()
                    .messages()
                    .send(userId="me", body=send_message)
                    .execute()
                )
                sent_count += 1
                print(f'Sent to {email_addr} | Message ID: {sent_email["id"]}')
            except HttpError as e:
                errors.append(f"{email_addr}: {str(e)}")

        result = f"SUCCESS: Sent {sent_count} personalized emails via Gmail."
        if errors:
            result += f"\nErrors: {'; '.join(errors)}"
        return result
    except Exception as e:
        return f"Error sending emails: {str(e)}"


# ─────────────────────────────────────────────
# Tool Registry
# ─────────────────────────────────────────────

content_strategist_tools = [generate_taglines, analyze_engagement_data, queue_social_media_posts]
scheduler_tools = [read_schedule_csv, build_schedule, recalculate_schedule]
communications_tools = [read_participant_csv, send_personalized_emails]

all_tools = content_strategist_tools + scheduler_tools + communications_tools
tools_by_name = {t.name: t for t in all_tools}
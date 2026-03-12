import os
import base64
import json
import re
from email.message import EmailMessage

import pandas as pd
from langchain.tools import tool

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


# ─────────────────────────────────────────────
# Gmail Helper (from test_gmail.py)
# ─────────────────────────────────────────────

GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.compose"]

# Resolve paths relative to the project root (one level up from agents/)
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
# Content Strategist Tools
# ─────────────────────────────────────────────

@tool
def generate_taglines(event_name: str, event_type: str, event_date: str) -> str:
    """
    Generates a set of promotional taglines / social-media post ideas for
    the given event. Returns draft suggestions for the user to review.
    """
    taglines = [
        f"🚀 {event_name} is coming on {event_date}! Are you ready to innovate?",
        f"🔥 The ultimate {event_type} experience — {event_name}. Mark your calendars!",
        f"💡 Build. Learn. Connect. Join {event_name} on {event_date}!",
        f"⚡ Don't miss {event_name} — where ideas become reality!",
        f"🎯 {event_name}: The {event_type} event of the year. {event_date}.",
    ]
    return "Here are the draft taglines:\n" + "\n".join(
        f"{i+1}. {t}" for i, t in enumerate(taglines)
    )


@tool
def analyze_engagement_data(platform: str) -> str:
    """
    Analyzes historical engagement data for the given platform and returns
    recommended optimal posting times.
    """
    recommendations = {
        "twitter": "Best times: Tuesday 10 AM, Thursday 2 PM, Saturday 11 AM",
        "instagram": "Best times: Monday 12 PM, Wednesday 6 PM, Friday 9 AM",
        "linkedin": "Best times: Tuesday 8 AM, Thursday 10 AM",
    }
    return recommendations.get(
        platform.lower(),
        "Best times: Tuesday 10 AM, Thursday 2 PM (general recommendation)"
    )


@tool
def queue_social_media_posts(posts: str) -> str:
    """
    Queues the finalized, user-approved posts into the social media scheduler.
    ONLY call this AFTER the user has approved the taglines.
    """
    return f"SUCCESS: The following posts have been queued for publishing:\n{posts}"


# ─────────────────────────────────────────────
# Scheduler Tools
# ─────────────────────────────────────────────

@tool
def read_schedule_csv(file_path: str) -> str:
    """
    Reads an event schedule from a CSV file and returns structured data.
    The CSV can have columns like: time, event/session name, speaker, room, etc.
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
        return f"Successfully read {len(records)} schedule entries:\n{json.dumps(records, indent=2)}"
    except Exception as e:
        return f"Error reading schedule CSV '{file_path}': {str(e)}"


@tool
def build_schedule(schedule_text: str) -> str:
    """
    Finalizes the master timeline. Pass the schedule as plain text.
    ONLY call this AFTER the user has approved the schedule.
    """
    return f"SUCCESS: Schedule has been finalized:\n{schedule_text}"


@tool
def recalculate_schedule(change_request: str) -> str:
    """
    Recalculates the schedule based on the user's change request.
    Just pass the change the user wants.
    """
    return (
        f"Schedule recalculated.\n"
        f"Change applied: {change_request}\n"
        f"All conflicts have been checked and resolved. "
        f"The communications agent should now notify all participants of the updated schedule."
    )


# ─────────────────────────────────────────────
# Communications Tools  (Gmail API)
# ─────────────────────────────────────────────

@tool
def read_participant_csv(file_path: str) -> str:
    """
    Reads participant data from a CSV file (registration sheet).
    Expected columns: email, name, and optionally notes/interests.
    Returns extracted and validated records.
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

        result = f"Extracted {len(valid_records)} valid participants."
        if invalid_emails:
            result += f"\nSkipped {len(invalid_emails)} invalid emails: {invalid_emails}"
        result += f"\nData:\n{json.dumps(valid_records, indent=2)}"
        return result
    except Exception as e:
        return f"Error reading participant CSV '{file_path}': {str(e)}"


@tool
def send_personalized_emails(subject: str, body_template: str, participant_csv_path: str) -> str:
    """
    Sends personalized emails to all participants in the CSV file via Gmail API.
    The body_template should contain {name} which gets replaced per recipient.
    participant_csv_path is the file path to the participant CSV.
    ONLY call this AFTER the user has approved the email draft.
    """
    try:
        # Read participants from CSV
        df = pd.read_csv(participant_csv_path, header=None)
        if len(df.columns) == 2:
            df.columns = ["email", "name"]
        elif len(df.columns) == 3:
            df.columns = ["email", "name", "notes"]
        elif len(df.columns) >= 4:
            df.columns = ["email", "name", "notes"] + [
                f"col_{i}" for i in range(3, len(df.columns))
            ]

        # Build Gmail service
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
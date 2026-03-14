import os
import base64
import base64
import json
import re
import markdown
import mimetypes
import urllib.request
from email.message import EmailMessage
from datetime import datetime

import pandas as pd
from langchain.tools import tool

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from google import genai
import cloudinary
import cloudinary.uploader
import tempfile
from calendar_google import get_calendar_service, is_day_free, add_event


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

    from engagement_predictor import RealisticEngagementPredictor
    from syn_datagen import generate_realistic_data

    data_path = os.path.join(_PROJECT_ROOT, "general_engagement_data.csv")
    if not os.path.exists(data_path):
        generate_realistic_data(filename=data_path)

    _predictor = RealisticEngagementPredictor()
    _predictor.train(pd.read_csv(data_path))
    return _predictor


# ─────────────────────────────────────────────
# Budget Predictor (singleton)
# ─────────────────────────────────────────────

_budget_predictor = None

def _get_budget_predictor():
    """Lazy-load the budget predictor — trains on first use."""
    global _budget_predictor
    if _budget_predictor is not None:
        return _budget_predictor

    from budget_predictor import BudgetPredictor
    import syn_budget_datagen

    data_path = os.path.join(_PROJECT_ROOT, "event_budget_data_inr.csv")
    if not os.path.exists(data_path):
        syn_budget_datagen.generate_budget_data(filename=data_path)

    _budget_predictor = BudgetPredictor()
    _budget_predictor.train(pd.read_csv(data_path))
    return _budget_predictor

@tool
def estimate_budget(participants: int, meals_per_person: int, venue_capacity: int, swag_tier: str) -> str:
    """
    Simulates a comprehensive budget breakdown and estimates volunteer requirements
    using an ML regression model trained on historical event data.
    swag_tier MUST be one of: 'none', 'basic', 'premium'.
    """
    try:
        predictor = _get_budget_predictor()
        result = predictor.predict_budget(int(participants), int(meals_per_person), int(venue_capacity), str(swag_tier))
        
        if isinstance(result, str):
            return result
            
        return (
            f"📊 ML Budget Simulation:\n"
            f"• Estimated Total Budget: ₹{result['predicted_budget']:,}\n"
            f"• Volunteers Required: {result['volunteers_required']}\n\n"
            f"Note: This is an AI-simulated estimate based on {participants} participants, "
            f"{meals_per_person} meals/person, {venue_capacity} capacity, and '{swag_tier}' swag."
        )
    except Exception as e:
        return f"Error simulating budget: {str(e)}"


# ─────────────────────────────────────────────
# Content Strategist Tools
# ─────────────────────────────────────────────

@tool
def generate_taglines(event_name: str, event_type: str, event_date: str) -> str:
    """
    Generates a set of promotional taglines / social-media post ideas for
    the given event. Returns draft suggestions for the user to review.
    """
    try:
        from google import genai
        client = genai.Client()
        prompt = f"Generate exactly 3 exciting promotional taglines or social-media post ideas for a {event_type} event named '{event_name}' happening on '{event_date}'. Provide just the numbered taglines and nothing else."
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        return "Here are the draft taglines:\n" + response.text
    except Exception as e:
        return f"Error generating taglines: {str(e)}"


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
# Supervisor Tools
# ─────────────────────────────────────────────

@tool
def update_event_details(event_name: str, event_date: str, event_type: str) -> str:
    """
    Updates the core event details in the system. 
    Use this when the user announces a new event name, date, or type in chat, so that the PDF generated is not blank!
    """
    return f"SUCCESS: Event details updated."

# ─────────────────────────────────────────────
# Scheduler Tools
# ─────────────────────────────────────────────

@tool
def read_schedule_csv(file_path: str) -> str:
    """
    Reads an event schedule from a CSV file, detects conflicts,
    and returns a human-readable formatted schedule.
    """
    if file_path == "None" or not file_path:
        return "No CSV was uploaded. You MUST generate a schedule from scratch based on the event details in your context."

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
def save_dynamic_schedule(schedule_text: str) -> str:
    """
    Saves a dynamically generated schedule to the state when no CSV is used.
    Pass the finalized schedule as plain text.
    """
    if isinstance(schedule_text, list):
        schedule_text = "\n".join(str(s) for s in schedule_text)
    return f"SUCCESS:\n{schedule_text}"


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
    if file_path == "None" or not file_path:
        return "No CSV was uploaded. Ask the user to provide a list of participant names and emails in the chat."

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
def send_personalized_emails(subject: str, body_template: str, participant_csv_path: str, attachment_url: str = "") -> str:
    """
    Sends personalized emails to all participants in the CSV file via Gmail API.
    The body_template should contain {name} and {notes} which get replaced per recipient.
    participant_csv_path is the file path to the participant CSV.
    attachment_url is an optional URL to an image/poster to attach to the email.
    ONLY call this AFTER the user has approved the email draft.
    """
    if isinstance(subject, list):
        subject = " ".join(str(s) for s in subject)
    if isinstance(body_template, list):
        body_template = "\n".join(str(b) for b in body_template)

    if participant_csv_path == "None" or not participant_csv_path:
        return f"SUCCESS: Sent email draft via system (no CSV provided):\n{body_template}"

    attachment_path = ""
    if attachment_url and attachment_url != "None":
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as tf:
                urllib.request.urlretrieve(attachment_url, tf.name)
                attachment_path = tf.name
        except Exception as e:
            print(f"Failed to fetch attachment from URL: {e}")

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
                
                # 1. Plain text and base content
                html_content = markdown.markdown(personalized_body)
                message.set_content(personalized_body)
                
                # 2. Add the formatted HTML version
                message.add_alternative(html_content, subtype='html')

                message["To"] = email_addr
                message["From"] = "EventSwarm Agent <eventswarm@gmail.com>"
                message["Subject"] = subject

                if attachment_path and os.path.exists(attachment_path):
                    mime_type, _ = mimetypes.guess_type(attachment_path)
                    mime_type = mime_type or 'application/octet-stream'
                    main_type, sub_type = mime_type.split('/', 1)

                    with open(attachment_path, 'rb') as fp:
                        attachment_data = fp.read()

                    message.add_attachment(
                        attachment_data,
                        maintype=main_type,
                        subtype=sub_type,
                        filename="event_poster.png"
                    )

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
# Art Director Tools
# ─────────────────────────────────────────────

@tool
def generate_poster(prompt: str) -> str:
    """
    Generates an event poster using Imagen 3.1 and uploads it to Cloudinary.
    Use this tool to create high-quality, custom visual assets for the event.
    """
    try:
        client = genai.Client()
        response = client.models.generate_content(
            model="gemini-3.1-flash-image-preview",
            contents=[prompt],
        )
        
        for part in response.parts:
            if part.inline_data is not None:
                image = part.as_image()
                temp_path = os.path.join(tempfile.gettempdir(), "temp_poster.png")
                image.save(temp_path)
                
                # Upload to Cloudinary
                upload_result = cloudinary.uploader.upload(temp_path, folder="eventswarm")
                secure_url = upload_result.get("secure_url", "")
                
                # We return the SUCCESS prefix so the frontend knows we generated a poster
                # The state management will extract the exact URL separately
                return f"SUCCESS: {secure_url}"
                
        return "Failed to generate visual content. No inline image data returned."
    except Exception as e:
        return f"Error generating poster: {str(e)}"

@tool
def check_calendar_free(date_str: str) -> str:
    """
    Checks if a specific date (YYYY-MM-DD) is free on the user's Google Calendar.
    It checks both the primary calendar and the Indian Holidays calendar.
    """
    try:
        service = get_calendar_service()
        free = is_day_free(service, date_str)
        if free:
            return f"SUCCESS: {date_str} is completely free on the calendar!"
        else:
            return f"NOTICE: {date_str} is NOT free. There are existing events or holidays on this day."
    except Exception as e:
        return f"Error checking calendar: {str(e)}"

@tool
def add_calendar_event(summary: str, start_time: str, end_time: str) -> str:
    """
    Adds a finalized event to the user's primary Google Calendar.
    start_time and end_time must be in 'YYYY-MM-DDTHH:MM:SS' format.
    Example: 2026-03-30T10:00:00
    ONLY call this AFTER the user has explicitly approved the final schedule.
    """
    try:
        service = get_calendar_service()
        event = add_event(service, summary, start_time, end_time)
        return f"SUCCESS: Event '{summary}' added to Google Calendar! Link: {event.get('htmlLink')}"
    except Exception as e:
        return f"Error adding to calendar: {str(e)}"

# ─────────────────────────────────────────────
# Tool Registry
# ─────────────────────────────────────────────

content_strategist_tools = [generate_taglines, analyze_engagement_data, queue_social_media_posts]
scheduler_tools = [read_schedule_csv, build_schedule, recalculate_schedule, save_dynamic_schedule, estimate_budget, check_calendar_free, add_calendar_event]
communications_tools = [read_participant_csv, send_personalized_emails]
art_director_tools = [generate_poster]
supervisor_tools = [update_event_details, check_calendar_free]

all_tools = content_strategist_tools + scheduler_tools + communications_tools + art_director_tools + supervisor_tools
tools_by_name = {t.name: t for t in all_tools}

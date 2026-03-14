import datetime
import os.path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# Scopes needed to read events (to check if free) and write events (to add them)
SCOPES = ['https://www.googleapis.com/auth/calendar.events',
          'https://www.googleapis.com/auth/calendar.readonly']

def get_calendar_service():
    """Authenticates the user and returns the Calendar API service object."""
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
            
    return build('calendar', 'v3', credentials=creds)

def is_day_free(service, target_date_str, timezone='Asia/Kolkata'):
    """
    Checks if a specific date is entirely free of personal events and holidays.
    target_date_str format: 'YYYY-MM-DD'
    """
    # Define the start and end of the target day
    start_of_day = f"{target_date_str}T00:00:00"
    end_of_day = f"{target_date_str}T23:59:59"
    
    # Google requires RFC3339 format with timezone offsets
    # For IST (+05:30), we append the offset. Change this if your timezone is different.
    time_min = f"{start_of_day}+05:30"
    time_max = f"{end_of_day}+05:30"

    # 1. Check Primary Calendar for existing events
    primary_events_result = service.events().list(
        calendarId='primary', 
        timeMin=time_min, 
        timeMax=time_max, 
        singleEvents=True
    ).execute()
    primary_events = primary_events_result.get('items', [])

    # 2. Check Holiday Calendar
    # Note: This is the official Google calendar ID for Indian Holidays.
    holiday_calendar_id = 'en.indian#holiday@group.v.calendar.google.com'
    holiday_events_result = service.events().list(
        calendarId=holiday_calendar_id, 
        timeMin=time_min, 
        timeMax=time_max, 
        singleEvents=True
    ).execute()
    holiday_events = holiday_events_result.get('items', [])

    # If there are any events or holidays, the day is NOT free
    if primary_events or holiday_events:
        print(f"[{target_date_str}] is NOT free.")
        if holiday_events:
            print(f" -> Holiday found: {holiday_events[0]['summary']}")
        if primary_events:
            print(f" -> Personal event found: {primary_events[0].get('summary', 'Busy')}")
        return False
    
    print(f"[{target_date_str}] is completely free!")
    return True

def add_event(service, summary, start_time, end_time, timezone='Asia/Kolkata'):
    """
    Adds an event to the primary calendar.
    Time format should be 'YYYY-MM-DDTHH:MM:SS'
    """
    event_details = {
        'summary': summary,
        'start': {
            'dateTime': f"{start_time}+05:30",
            'timeZone': timezone,
        },
        'end': {
            'dateTime': f"{end_time}+05:30",
            'timeZone': timezone,
        }
    }

    event = service.events().insert(calendarId='primary', body=event_details).execute()
    print(f"Successfully added '{summary}'! Link: {event.get('htmlLink')}")
    return event

# --- Example Usage ---
if __name__ == '__main__':
    # 1. Authenticate
    svc = get_calendar_service()

    # 2. Check if a specific date is free
    date_to_check = '2026-03-25' # Change this to whatever date you want to check
    
    if is_day_free(svc, date_to_check):
        # 3. If it's free, add an event!
        add_event(
            service=svc,
            summary="Focus Work Session",
            start_time=f"{date_to_check}T10:00:00",
            end_time=f"{date_to_check}T12:00:00"
        )
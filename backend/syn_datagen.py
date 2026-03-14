import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_realistic_data(filename="general_engagement_data.csv", num_records=500):
    np.random.seed(42)
    start_date = datetime.now() - timedelta(days=30)
    
    data = []
    for _ in range(num_records):
        # The time the announcement actually goes live
        release_ts = start_date + timedelta(
            days=np.random.randint(0, 30), 
            hours=np.random.randint(0, 24), 
            minutes=np.random.randint(0, 60)
        )
        
        # The time the organizing committee decided to schedule it
        lead_time_hours = np.random.randint(1, 25) 
        creation_ts = release_ts - timedelta(hours=lead_time_hours)
        
        hour = release_ts.hour
        base_score = np.random.normal(30, 10) 
        
        # 1. Temporal Patterns (Time of Day)
        if 9 <= hour <= 11:
            base_score += np.random.normal(30, 5) # Morning spike
        elif 18 <= hour <= 20:
            base_score += np.random.normal(35, 5) # Evening spike
            
        if release_ts.weekday() >= 5:
            base_score += np.random.normal(10, 5) # Weekend bump
        
        # 2. Realism: Lead Time Patterns
        if lead_time_hours <= 2:
            base_score -= 20 # Penalty for rushed, last-minute announcements
        elif 4 <= lead_time_hours <= 8:
            base_score += 15 # Sweet spot for well-prepared scheduling
            
        score = max(0, min(100, int(base_score)))
        
        data.append({
            "creation_timestamp": creation_ts.strftime("%Y-%m-%d %H:%M:%S"),
            "release_timestamp": release_ts.strftime("%Y-%m-%d %H:%M:%S"),
            "lead_time_hours": lead_time_hours,
            "engagement_score": score
        })
        
    df = pd.DataFrame(data)
    df.to_csv(filename, index=False)
    print(f"Saved {num_records} realistic records to {filename}")

if __name__ == "__main__":
    generate_realistic_data()
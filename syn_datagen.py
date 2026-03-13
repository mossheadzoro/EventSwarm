import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_general_data(filename="general_engagement_data.csv", num_records=500):
    np.random.seed(42)
    start_date = datetime.now() - timedelta(days=30)
    
    data = []
    for _ in range(num_records):
        random_days = np.random.randint(0, 30)
        random_hours = np.random.randint(0, 24)
        random_minutes = np.random.randint(0, 60)
        
        ts = start_date + timedelta(days=random_days, hours=random_hours, minutes=random_minutes)
        hour = ts.hour
        
        base_score = np.random.normal(30, 10) 
        
        # Inject pure temporal patterns (spikes at 10 AM and 7 PM)
        if 9 <= hour <= 11:
            base_score += np.random.normal(40, 5)
        elif 18 <= hour <= 20:
            base_score += np.random.normal(35, 5)
        
        # Weekend bump
        if ts.weekday() >= 5:
            base_score += np.random.normal(15, 5)
                
        score = max(0, min(100, int(base_score)))
        
        data.append({
            "timestamp": ts.strftime("%Y-%m-%d %H:%M:%S"),
            "engagement_score": score
        })
        
    df = pd.DataFrame(data)
    df.to_csv(filename, index=False)
    print(f"Saved {num_records} records to {filename}")

if __name__ == "__main__":
    generate_general_data()
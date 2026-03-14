import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime, timedelta

class RealisticEngagementPredictor:
    def __init__(self):
        # Slightly deeper tree to handle the interaction between hour and lead_time
        self.model = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42)
        self.is_trained = False
        
    def extract_features(self, release_timestamps, lead_times):
        """Extracts features including the dynamic lead time."""
        return pd.DataFrame({
            'release_hour': release_timestamps.dt.hour,
            'release_day_of_week': release_timestamps.dt.dayofweek,
            'lead_time_hours': lead_times
        })

    def train(self, historical_df):
        """Trains the model on realistic engagement data."""
        release_ts = pd.to_datetime(historical_df['release_timestamp'])
        X = self.extract_features(release_ts, historical_df['lead_time_hours'])
        y = historical_df['engagement_score']
        
        self.model.fit(X, y)
        self.is_trained = True
        
    def recommend_optimal_time(self, hours_ahead=24):
        """Predicts the best time considering both time of day and scheduling lead time."""
        if not self.is_trained:
            return "Error: Model needs to be trained first."
            
        # The 'creation time' is exactly when the Swarm calls this tool
        current_time = datetime.now()
        
        # Generate future candidate slots to test
        future_times = [current_time + timedelta(hours=i) for i in range(1, hours_ahead + 1)]
        future_df = pd.DataFrame({'release_timestamp': pd.to_datetime(future_times)})
        
        # Dynamically calculate how much lead time each future slot offers
        # (e.g., a slot 2 hours from now has a lead time of 2)
        lead_times = [(ft - current_time).total_seconds() / 3600.0 for ft in future_times]
        
        X_test = self.extract_features(future_df['release_timestamp'], lead_times)
        predicted_scores = self.model.predict(X_test)
        
        # Find the highest scoring slot
        best_index = np.argmax(predicted_scores)
        best_time = future_times[best_index]
        best_score = predicted_scores[best_index]
        
        # Output remains completely unchanged for your API integration
        return {
            "recommended_time": best_time.strftime("%Y-%m-%d %H:00"),
            "predicted_score": round(best_score, 2)
        }
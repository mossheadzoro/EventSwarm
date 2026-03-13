import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime, timedelta

class GeneralEngagementPredictor:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=50, max_depth=10, random_state=42)
        self.is_trained = False
        
    def extract_features(self, timestamps):
        """Extracts purely temporal features."""
        return pd.DataFrame({
            'hour': timestamps.dt.hour,
            'day_of_week': timestamps.dt.dayofweek,
        })

    def train(self, historical_df):
        """Trains the model on historical engagement data."""
        X = self.extract_features(pd.to_datetime(historical_df['timestamp']))
        y = historical_df['engagement_score']
        
        self.model.fit(X, y)
        self.is_trained = True
        
    def recommend_optimal_time(self, hours_ahead=24):
        """Predicts the best time to post in the upcoming window."""
        if not self.is_trained:
            return "Error: Model needs to be trained first."
            
        current_time = datetime.now()
        future_times = [current_time + timedelta(hours=i) for i in range(1, hours_ahead + 1)]
        future_df = pd.DataFrame({'timestamp': future_times})
        
        X_test = self.extract_features(future_df['timestamp'])
        predicted_scores = self.model.predict(X_test)
        
        best_index = np.argmax(predicted_scores)
        best_time = future_times[best_index]
        best_score = predicted_scores[best_index]
        
        return {
            "recommended_time": best_time.strftime("%Y-%m-%d %H:00"),
            "predicted_score": round(best_score, 2)
        }
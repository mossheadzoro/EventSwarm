import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder

class BudgetPredictor:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=50, random_state=42)
        self.encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
        self.is_trained = False
        
    def extract_features(self, df):
        # One hot encode the swag tier
        swag_encoded = self.encoder.transform(df[['swag_tier']])
        swag_df = pd.DataFrame(swag_encoded, columns=self.encoder.get_feature_names_out(['swag_tier']))
        
        features = pd.concat([
            df[['participants', 'meals_per_person', 'venue_capacity']].reset_index(drop=True),
            swag_df.reset_index(drop=True)
        ], axis=1)
        return features

    def train(self, historical_df):
        self.encoder.fit(historical_df[['swag_tier']])
        X = self.extract_features(historical_df)
        y = historical_df['total_budget_inr']
        
        self.model.fit(X, y)
        self.is_trained = True
        
    def predict_budget(self, participants: int, meals_per_person: int, venue_capacity: int, swag_tier: str):
        if not self.is_trained:
            return "Error: Model needs to be trained first."
            
        if swag_tier.lower() not in ["none", "basic", "premium"]:
            swag_tier = "basic"
            
        df = pd.DataFrame([{
            "participants": participants,
            "meals_per_person": meals_per_person,
            "venue_capacity": venue_capacity,
            "swag_tier": swag_tier.lower()
        }])
        
        X_test = self.extract_features(df)
        predicted_budget = self.model.predict(X_test)[0]
        
        # Volunteer rule of thumb: 1 per 15 participants
        volunteers = max(1, participants // 15)
        
        return {
            "predicted_budget": round(predicted_budget, 2),
            "volunteers_required": volunteers
        }

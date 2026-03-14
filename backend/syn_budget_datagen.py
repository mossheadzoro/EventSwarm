import pandas as pd
import numpy as np

def generate_budget_data(filename="event_budget_data_inr.csv", num_records=1000):
    np.random.seed(42)
    
    data = []
    
    for _ in range(num_records):
        participants = np.random.randint(50, 1000)
        meals_per_person = np.random.randint(0, 4)
        venue_capacity = max(participants, np.random.randint(50, 1500))
        
        swag_rand = np.random.random()
        if swag_rand < 0.3:
            swag_tier = "none"
            swag_cost = 0
        elif swag_rand < 0.7:
            swag_tier = "basic"
            swag_cost = 150 * participants
        else:
            swag_tier = "premium"
            swag_cost = 600 * participants
            
        # Base costs (INR)
        meal_cost = meals_per_person * 200 * participants
        venue_cost = venue_capacity * 500
        
        base_cost = meal_cost + venue_cost + swag_cost
        
        # Overhead: 5% to 15% of base cost
        overhead_rate = np.random.uniform(0.05, 0.15)
        overhead = base_cost * overhead_rate
        
        total_budget = base_cost + overhead
        
        data.append({
            "participants": participants,
            "meals_per_person": meals_per_person,
            "venue_capacity": venue_capacity,
            "swag_tier": swag_tier,
            "total_budget_inr": round(total_budget, 2)
        })
        
    df = pd.DataFrame(data)
    df.to_csv(filename, index=False)
    print(f"Saved {num_records} records to {filename}")

if __name__ == "__main__":
    generate_budget_data()
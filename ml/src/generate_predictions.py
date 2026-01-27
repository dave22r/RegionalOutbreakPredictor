import json
import random
import math
from datetime import datetime, timedelta

# California regions with coordinates (major cities and counties)
REGIONS = [
    {"name": "San Francisco", "lat": 37.7749, "lng": -122.4194},
    {"name": "Los Angeles", "lat": 34.0522, "lng": -118.2437},
    {"name": "San Diego", "lat": 32.7157, "lng": -117.1611},
    {"name": "Sacramento", "lat": 38.5816, "lng": -121.4944},
    {"name": "San Jose", "lat": 37.3382, "lng": -121.8863},
    {"name": "Fresno", "lat": 36.7378, "lng": -119.7871},
    {"name": "Oakland", "lat": 37.8044, "lng": -122.2712},
    {"name": "Berkeley", "lat": 37.8715, "lng": -122.2730},
    {"name": "Santa Cruz", "lat": 36.9741, "lng": -122.0308},
    {"name": "Monterey", "lat": 36.6002, "lng": -121.8947},
]

DISEASES = ["Flu", "COVID-19", "Coccidioidomycosis", "Salmonella", "Campylobacter"]

def generate_outbreak_points(region, disease, base_risk, num_points=50):
    """Generate clustered outbreak points around a region"""
    points = []
    lat, lng = region["lat"], region["lng"]
    
    # Create cluster spread (0.01 to 0.05 degrees, roughly 1-5km)
    spread = 0.03
    
    for _ in range(num_points):
        # Use normal distribution for realistic clustering
        offset_lat = random.gauss(0, spread)
        offset_lng = random.gauss(0, spread)
        
        point_lat = lat + offset_lat
        point_lng = lng + offset_lng
        
        # Risk varies within cluster
        risk_variation = random.uniform(0.7, 1.3)
        point_risk = min(1.0, base_risk * risk_variation)
        
        points.append({
            "lat": point_lat,
            "lng": point_lng,
            "risk": round(point_risk, 3),
            "disease": disease,
            "region": region["name"]
        })
    
    return points

def calculate_seasonal_risk(disease, week):
    """Calculate disease risk based on seasonal patterns"""
    # Flu peaks in winter (weeks 48-12)
    if disease == "Flu":
        if week >= 48 or week <= 12:
            return random.uniform(0.6, 0.9)
        elif 20 <= week <= 40:
            return random.uniform(0.1, 0.3)
        else:
            return random.uniform(0.3, 0.6)
    
    # COVID-19 has multiple waves
    elif disease == "COVID-19":
        wave_peaks = [5, 20, 35, 50]
        min_dist = min(abs(week - peak) for peak in wave_peaks)
        if min_dist < 4:
            return random.uniform(0.5, 0.8)
        else:
            return random.uniform(0.2, 0.5)
    
    # Coccidioidomycosis peaks in fall (weeks 36-48)
    elif disease == "Coccidioidomycosis":
        if 36 <= week <= 48:
            return random.uniform(0.5, 0.8)
        else:
            return random.uniform(0.2, 0.4)
    
    # Salmonella peaks in summer (weeks 20-36)
    elif disease == "Salmonella":
        if 20 <= week <= 36:
            return random.uniform(0.4, 0.7)
        else:
            return random.uniform(0.1, 0.3)
    
    # Campylobacter similar to Salmonella
    elif disease == "Campylobacter":
        if 20 <= week <= 36:
            return random.uniform(0.4, 0.7)
        else:
            return random.uniform(0.1, 0.3)
    
    return random.uniform(0.2, 0.5)

def generate_predictions():
    """Generate outbreak predictions for all diseases and regions"""
    # Current week (week 4 of 2026)
    current_week = 4
    
    all_predictions = []
    
    for disease in DISEASES:
        disease_predictions = []
        
        # Calculate base risk for this disease this week
        seasonal_risk = calculate_seasonal_risk(disease, current_week)
        
        for region in REGIONS:
            # Regional variation (some regions more affected)
            regional_multiplier = random.uniform(0.7, 1.3)
            base_risk = seasonal_risk * regional_multiplier
            
            # Number of points based on risk (higher risk = more points)
            num_points = int(30 + base_risk * 100)
            
            # Generate clustered points
            points = generate_outbreak_points(region, disease, base_risk, num_points)
            disease_predictions.extend(points)
        
        all_predictions.extend(disease_predictions)
    
    return all_predictions

def main():
    print("Generating outbreak predictions...")
    
    predictions = generate_predictions()
    
    # Save to JSON file
    import os
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, "..", "data", "processed")
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, "predictions.json")
    
    with open(output_file, 'w') as f:
        json.dump(predictions, f, indent=2)
    
    print(f"Generated {len(predictions)} prediction points")
    print(f"Saved to {output_file}")
    
    # Print summary by disease
    print("\nPredictions by disease:")
    for disease in DISEASES:
        count = sum(1 for p in predictions if p["disease"] == disease)
        avg_risk = sum(p["risk"] for p in predictions if p["disease"] == disease) / count if count > 0 else 0
        print(f"  {disease}: {count} points, avg risk: {avg_risk:.2%}")

if __name__ == "__main__":
    main()

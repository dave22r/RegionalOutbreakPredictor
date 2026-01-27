import json
import random
import math
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime

# Paths
ML_ROOT = Path(__file__).parent.parent
MODEL_PATH = ML_ROOT / "models" / "lr_classifier.pkl"
OUTPUT_PATH = ML_ROOT / "data" / "processed" / "predictions.json"

# California regions with coordinates
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

# Disease mapping (from training data columns)
DISEASES = {
    "Flu": "INFLUENZA",
    "Coccidioidomycosis": "COCCIDIOIDOMYCOSIS", 
    "Campylobacter": "CAMPYLOBACTERIOSIS",
    "Salmonella": "SALMONELLOSIS",
    "COVID-19": "COVID-19"  # Special case
}

def get_week_features(week):
    """Calculate sin/cos encoding for week of year"""
    angle = 2 * math.pi * week / 52
    return math.sin(angle), math.cos(angle)

def get_current_weather_data(week):
    """
    Get typical weather data for California in the given week.
    Using historical averages since we don't have real-time API.
    """
    # January (week 4) weather for California
    if 1 <= week <= 12:  # Winter
        return {
            "TAVG": 12.0,
            "TMAX": 18.0,
            "TMIN": 6.0,
            "PRCP": 0.3
        }
    elif 13 <= week <= 25:  # Spring
        return {
            "TAVG": 16.0,
            "TMAX": 22.0,
            "TMIN": 10.0,
            "PRCP": 0.1
        }
    elif 26 <= week <= 38:  # Summer
        return {
            "TAVG": 24.0,
            "TMAX": 30.0,
            "TMIN": 18.0,
            "PRCP": 0.0
        }
    else:  # Fall
        return {
            "TAVG": 18.0,
            "TMAX": 24.0,
            "TMIN": 12.0,
            "PRCP": 0.15
        }

def create_feature_vector(disease_col, week, prev1=0, prev2=0, avg4=0):
    """
    Create feature vector matching the training data format.
    Columns: YEAR, WEEK, WEEK_SIN, WEEK_COS, INFLUENZA, COCCIDIOIDOMYCOSIS, 
             CAMPYLOBACTERIOSIS, SALMONELLOSIS, PREV1_CASES, PREV2_CASES, 
             4_WEEK_AVG, TAVG, TMAX, TMIN, PRCP
    """
    week_sin, week_cos = get_week_features(week)
    weather = get_current_weather_data(week)
    
    # Create disease one-hot encoding
    diseases = {
        "INFLUENZA": 0.0,
        "COCCIDIOIDOMYCOSIS": 0.0,
        "CAMPYLOBACTERIOSIS": 0.0,
        "SALMONELLOSIS": 0.0
    }
    if disease_col in diseases:
        diseases[disease_col] = 1.0
    
    features = {
        "YEAR": 2026.0,
        "WEEK": float(week),
        "WEEK_SIN": week_sin,
        "WEEK_COS": week_cos,
        "INFLUENZA": diseases["INFLUENZA"],
        "COCCIDIOIDOMYCOSIS": diseases["COCCIDIOIDOMYCOSIS"],
        "CAMPYLOBACTERIOSIS": diseases["CAMPYLOBACTERIOSIS"],
        "SALMONELLOSIS": diseases["SALMONELLOSIS"],
        "PREV1_CASES": float(prev1),
        "PREV2_CASES": float(prev2),
        "4_WEEK_AVG": float(avg4),
        "TAVG": weather["TAVG"],
        "TMAX": weather["TMAX"],
        "TMIN": weather["TMIN"],
        "PRCP": weather["PRCP"]
    }
    
    return features

def generate_outbreak_points(region, disease, risk, num_points=50):
    """Generate clustered outbreak points around a region"""
    points = []
    lat, lng = region["lat"], region["lng"]
    
    # Create cluster spread (0.01 to 0.03 degrees, roughly 1-3km)
    spread = 0.02
    
    for _ in range(num_points):
        # Use normal distribution for realistic clustering
        offset_lat = random.gauss(0, spread)
        offset_lng = random.gauss(0, spread)
        
        point_lat = lat + offset_lat
        point_lng = lng + offset_lng
        
        # Risk varies slightly within cluster
        risk_variation = random.uniform(0.9, 1.1)
        point_risk = min(1.0, risk * risk_variation)
        
        points.append({
            "lat": point_lat,
            "lng": point_lng,
            "risk": round(point_risk, 3),
            "disease": disease,
            "region": region["name"]
        })
    
    return points

def predict_outbreak_risk(model, disease_name, disease_col, week):
    """
    Use ML model to predict outbreak risk for a disease.
    Returns probability between 0-1.
    """
    # Simulate previous case data based on season
    # In a real system, this would come from actual symptom reports
    if disease_col == "INFLUENZA":
        # Flu is high in winter
        prev1 = 100 if week <= 12 or week >= 48 else 20
        prev2 = 90 if week <= 12 or week >= 48 else 15
        avg4 = 85 if week <= 12 or week >= 48 else 18
    elif disease_col == "COCCIDIOIDOMYCOSIS":
        # Valley Fever peaks in fall
        prev1 = 40 if 36 <= week <= 48 else 10
        prev2 = 35 if 36 <= week <= 48 else 8
        avg4 = 30 if 36 <= week <= 48 else 9
    else:
        # Other diseases peak in summer
        prev1 = 50 if 20 <= week <= 36 else 15
        prev2 = 45 if 20 <= week <= 36 else 12
        avg4 = 40 if 20 <= week <= 36 else 13
    
    # Create feature vector
    features = create_feature_vector(disease_col, week, prev1, prev2, avg4)
    
    # Convert to DataFrame (model expects this format)
    df = pd.DataFrame([features])
    
    # Drop FUTURE_OUTBREAK if it exists (target variable)
    if "FUTURE_OUTBREAK" in df.columns:
        df = df.drop(columns=["FUTURE_OUTBREAK"])
    
    try:
        # Predict probability of outbreak
        proba = model.predict_proba(df)[0][1]  # Probability of class 1 (outbreak)
        return proba
    except Exception as e:
        print(f"Warning: Could not predict for {disease_name}: {e}")
        # Fallback to seasonal pattern
        if disease_col == "INFLUENZA":
            return 0.7 if week <= 12 or week >= 48 else 0.2
        elif disease_col == "COCCIDIOIDOMYCOSIS":
            return 0.5 if 36 <= week <= 48 else 0.15
        else:
            return 0.4 if 20 <= week <= 36 else 0.15

def generate_ml_predictions():
    """Generate outbreak predictions using the trained ML model"""
    print("Loading ML model...")
    
    try:
        model = joblib.load(MODEL_PATH)
        print(f"Model loaded from {MODEL_PATH}")
    except Exception as e:
        print(f"Error loading model: {e}")
        print("   Make sure you've trained the model first by running ml/src/model.py")
        return []
    
    # Current week (week 4 of 2026 - late January)
    current_week = 4
    print(f"Generating predictions for week {current_week} of 2026")
    
    all_predictions = []
    
    for disease_name, disease_col in DISEASES.items():
        # Skip COVID-19 if not in training data
        if disease_col == "COVID-19":
            # Use a moderate risk for COVID
            base_risk = 0.35
        else:
            # Use ML model to predict outbreak risk
            base_risk = predict_outbreak_risk(model, disease_name, disease_col, current_week)
        
        print(f"  {disease_name}: {base_risk:.1%} outbreak risk")
        
        disease_predictions = []
        
        for region in REGIONS:
            # Regional variation (some regions more affected)
            regional_multiplier = random.uniform(0.8, 1.2)
            region_risk = min(1.0, base_risk * regional_multiplier)
            
            # Number of points based on risk (higher risk = more points)
            num_points = int(20 + region_risk * 80)
            
            # Generate clustered points
            points = generate_outbreak_points(region, disease_name, region_risk, num_points)
            disease_predictions.extend(points)
        
        all_predictions.extend(disease_predictions)
    
    return all_predictions

def main():
    print("Generating ML-based outbreak predictions...\n")
    
    predictions = generate_ml_predictions()
    
    if not predictions:
        print("Failed to generate predictions")
        return
    
    # Save to JSON file
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(predictions, f, indent=2)
    
    print(f"\nGenerated {len(predictions)} prediction points")
    print(f"Saved to {OUTPUT_PATH}")
    
    # Print summary by disease
    print("\nPredictions by disease:")
    for disease in DISEASES.keys():
        count = sum(1 for p in predictions if p["disease"] == disease)
        avg_risk = sum(p["risk"] for p in predictions if p["disease"] == disease) / count if count > 0 else 0
        print(f"  {disease}: {count} points, avg risk: {avg_risk:.1%}")

if __name__ == "__main__":
    main()

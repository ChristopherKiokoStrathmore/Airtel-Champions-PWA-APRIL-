# 🤖 ML IMPLEMENTATION GUIDE - QUICK START

**Sales Intelligence Network - Airtel Kenya**  
**Algorithms: Independently Deployable, Later Integrated**

---

## 🎯 OVERVIEW

This guide provides **step-by-step instructions** to build and deploy the 3 core ML systems:

1. **Algorithmic Market Intelligence** 📊
2. **Peer-Driven Behavior Change** 🎯
3. **Real-Time Competitive Advantage** ⚡

**Deployment Strategy**: Build as **microservices** → Deploy independently → Integrate with main app later

---

## 🚀 QUICK START (4-WEEK SPRINT)

### **Week 1: Environment Setup + Data Prep**
### **Week 2: Model Development**
### **Week 3: API Development**
### **Week 4: Testing + Documentation**

---

# 📦 WEEK 1: SETUP & DATA PREPARATION

## Day 1: Development Environment

```bash
# 1. Create project directory
mkdir sales-intelligence-ml
cd sales-intelligence-ml

# 2. Create Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install core dependencies
pip install --upgrade pip
pip install tensorflow==2.14.0
pip install torch torchvision  # For computer vision
pip install scikit-learn==1.3.2
pip install xgboost==2.0.2
pip install pandas numpy scipy
pip install fastapi uvicorn
pip install pydantic
pip install python-multipart
pip install sqlalchemy psycopg2-binary
pip install python-dotenv
pip install mlflow

# 4. Install specialized libraries
pip install ultralytics  # YOLOv8 for computer vision
pip install opencv-python
pip install pillow
pip install geopy  # Geospatial calculations
pip install matplotlib seaborn  # Visualization

# 5. Create requirements.txt
pip freeze > requirements.txt
```

## Day 2: Project Structure

```bash
# Create directory structure
mkdir -p services/{market_intelligence,behavioral_prediction,real_time_response,computer_vision}
mkdir -p models/trained
mkdir -p data/{raw,processed,training}
mkdir -p notebooks
mkdir -p tests
mkdir -p configs
mkdir -p logs
mkdir -p scripts

# Create initial files
touch .env
touch .gitignore
touch README.md
touch docker-compose.yml
```

**Project Structure**:
```
sales-intelligence-ml/
├── .env                          # Environment variables
├── .gitignore
├── README.md
├── docker-compose.yml
├── requirements.txt
│
├── services/                     # Microservices
│   ├── market_intelligence/
│   │   ├── app.py               # FastAPI app
│   │   ├── models.py            # ML models
│   │   ├── preprocessing.py     # Data preprocessing
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   ├── behavioral_prediction/
│   │   ├── app.py
│   │   ├── models.py
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   ├── real_time_response/
│   │   ├── app.py
│   │   ├── models.py
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   └── computer_vision/
│       ├── app.py
│       ├── detector.py
│       ├── Dockerfile
│       └── requirements.txt
│
├── models/                       # Trained models
│   ├── trained/
│   └── checkpoints/
│
├── data/                         # Data storage
│   ├── raw/                     # Original data
│   ├── processed/               # Cleaned data
│   └── training/                # Training sets
│
├── notebooks/                    # Jupyter notebooks
│   ├── 01_data_exploration.ipynb
│   ├── 02_model_training.ipynb
│   └── 03_evaluation.ipynb
│
├── scripts/                      # Utility scripts
│   ├── fetch_data.py
│   ├── train_models.py
│   └── deploy.sh
│
├── tests/                        # Unit tests
│   ├── test_market_intel.py
│   ├── test_behavior.py
│   └── test_response.py
│
└── configs/                      # Configuration files
    ├── market_intel_config.yaml
    ├── behavior_config.yaml
    └── response_config.yaml
```

## Day 3-4: Data Collection Script

```python
# scripts/fetch_data.py

import os
from dotenv import load_dotenv
from supabase import create_client, Client
import pandas as pd
from datetime import datetime, timedelta

load_dotenv()

# Supabase connection
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

def fetch_submission_data(days_back=90):
    """
    Fetch submission data from Supabase
    
    Data needed for ML training:
    - Competitor sightings
    - Locations (GPS)
    - Timestamps
    - SE behaviors
    - Approval rates
    """
    
    start_date = (datetime.now() - timedelta(days=days_back)).isoformat()
    
    # Fetch submissions
    response = supabase.table('submissions') \
        .select('*') \
        .gte('created_at', start_date) \
        .execute()
    
    df = pd.DataFrame(response.data)
    
    # Save to CSV
    df.to_csv('data/raw/submissions.csv', index=False)
    print(f"✅ Fetched {len(df)} submissions")
    
    return df

def fetch_user_behavior_data():
    """
    Fetch user engagement metrics
    """
    
    # Aggregated user stats
    response = supabase.table('users') \
        .select('id, employee_id, region, team, created_at') \
        .eq('role', 'se') \
        .execute()
    
    users_df = pd.DataFrame(response.data)
    users_df.to_csv('data/raw/users.csv', index=False)
    
    print(f"✅ Fetched {len(users_df)} users")
    
    return users_df

def fetch_leaderboard_history():
    """
    Fetch historical leaderboard data
    """
    
    # This would come from a leaderboard_history table
    # For now, calculate from submissions
    
    response = supabase.table('submissions') \
        .select('se_id, points_awarded, status, created_at') \
        .eq('status', 'approved') \
        .execute()
    
    df = pd.DataFrame(response.data)
    
    # Aggregate points by SE and date
    df['date'] = pd.to_datetime(df['created_at']).dt.date
    leaderboard = df.groupby(['se_id', 'date'])['points_awarded'].sum().reset_index()
    
    # Calculate cumulative points and rank
    leaderboard['cumulative_points'] = leaderboard.groupby('se_id')['points_awarded'].cumsum()
    leaderboard['rank'] = leaderboard.groupby('date')['cumulative_points'].rank(ascending=False)
    
    leaderboard.to_csv('data/raw/leaderboard_history.csv', index=False)
    
    print(f"✅ Fetched leaderboard history")
    
    return leaderboard

def fetch_competitor_activity():
    """
    Fetch competitor sighting data
    """
    
    response = supabase.table('competitor_sightings') \
        .select('*') \
        .execute()
    
    df = pd.DataFrame(response.data)
    df.to_csv('data/raw/competitor_sightings.csv', index=False)
    
    print(f"✅ Fetched {len(df)} competitor sightings")
    
    return df

if __name__ == "__main__":
    print("📊 Fetching data from Supabase...")
    
    submissions = fetch_submission_data()
    users = fetch_user_behavior_data()
    leaderboard = fetch_leaderboard_history()
    competitors = fetch_competitor_activity()
    
    print("\n✅ All data fetched successfully!")
    print(f"   - Submissions: {len(submissions)}")
    print(f"   - Users: {len(users)}")
    print(f"   - Leaderboard entries: {len(leaderboard)}")
    print(f"   - Competitor sightings: {len(competitors)}")
```

## Day 5-7: Data Preprocessing

```python
# scripts/preprocess_data.py

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from datetime import datetime

def preprocess_submissions(df):
    """
    Clean and prepare submission data
    """
    
    # Convert timestamps
    df['created_at'] = pd.to_datetime(df['created_at'])
    df['hour'] = df['created_at'].dt.hour
    df['day_of_week'] = df['created_at'].dt.dayofweek
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
    
    # Extract location features
    df['lat'] = df['latitude']
    df['lng'] = df['longitude']
    
    # Calculate time since last submission (per SE)
    df = df.sort_values(['se_id', 'created_at'])
    df['time_since_last'] = df.groupby('se_id')['created_at'].diff().dt.total_seconds() / 3600
    
    # Binary status
    df['is_approved'] = (df['status'] == 'approved').astype(int)
    
    return df

def create_time_series_features(df, lookback_days=30):
    """
    Create time-series features for LSTM model
    
    For each location and day:
    - Competitor activity count
    - Average intensity
    - Trend (increasing/decreasing)
    """
    
    df['date'] = df['created_at'].dt.date
    
    # Aggregate by location (rounded to 0.01 degrees ≈ 1km)
    df['lat_rounded'] = (df['lat'] * 100).round() / 100
    df['lng_rounded'] = (df['lng'] * 100).round() / 100
    df['location_key'] = df['lat_rounded'].astype(str) + '_' + df['lng_rounded'].astype(str)
    
    # Daily aggregates by location
    daily_activity = df.groupby(['location_key', 'date']).size().reset_index(name='activity_count')
    
    # Create 30-day rolling windows
    time_series = []
    
    for location in daily_activity['location_key'].unique():
        loc_data = daily_activity[daily_activity['location_key'] == location]
        loc_data = loc_data.sort_values('date')
        
        # Create rolling window
        if len(loc_data) >= lookback_days:
            for i in range(lookback_days, len(loc_data)):
                window = loc_data.iloc[i-lookback_days:i]['activity_count'].values
                target = loc_data.iloc[i]['activity_count']
                
                time_series.append({
                    'location_key': location,
                    'date': loc_data.iloc[i]['date'],
                    'window': window,
                    'target': target
                })
    
    return pd.DataFrame(time_series)

def create_behavioral_features(submissions_df, users_df):
    """
    Create features for behavioral prediction model
    """
    
    # Per-SE aggregates
    se_stats = submissions_df.groupby('se_id').agg({
        'id': 'count',  # Total submissions
        'is_approved': 'mean',  # Approval rate
        'points_awarded': 'sum',  # Total points
        'time_since_last': 'mean',  # Avg time between submissions
        'is_weekend': 'mean'  # Proportion on weekends
    }).reset_index()
    
    se_stats.columns = ['se_id', 'total_submissions', 'approval_rate', 
                        'total_points', 'avg_time_between', 'weekend_proportion']
    
    # Merge with user data
    features = users_df.merge(se_stats, left_on='id', right_on='se_id', how='left')
    
    # Fill missing values (new users with no submissions yet)
    features = features.fillna(0)
    
    # Encode categorical features
    le_region = LabelEncoder()
    features['region_encoded'] = le_region.fit_transform(features['region'])
    
    # Calculate days since joining
    features['created_at'] = pd.to_datetime(features['created_at'])
    features['days_since_join'] = (datetime.now() - features['created_at']).dt.days
    
    return features

def prepare_training_data():
    """
    Main preprocessing pipeline
    """
    
    print("📊 Loading raw data...")
    submissions = pd.read_csv('data/raw/submissions.csv')
    users = pd.read_csv('data/raw/users.csv')
    leaderboard = pd.read_csv('data/raw/leaderboard_history.csv')
    competitors = pd.read_csv('data/raw/competitor_sightings.csv')
    
    print("🔧 Preprocessing submissions...")
    submissions = preprocess_submissions(submissions)
    
    print("🔧 Creating time series features...")
    time_series = create_time_series_features(submissions)
    
    print("🔧 Creating behavioral features...")
    behavioral_features = create_behavioral_features(submissions, users)
    
    # Save processed data
    submissions.to_csv('data/processed/submissions_clean.csv', index=False)
    time_series.to_pickle('data/processed/time_series.pkl')
    behavioral_features.to_csv('data/processed/behavioral_features.csv', index=False)
    
    print("\n✅ Preprocessing complete!")
    print(f"   - Clean submissions: {len(submissions)}")
    print(f"   - Time series samples: {len(time_series)}")
    print(f"   - Behavioral features: {len(behavioral_features)}")

if __name__ == "__main__":
    prepare_training_data()
```

---

# 📊 WEEK 2: MODEL DEVELOPMENT

## Day 8-10: Market Intelligence Model

```python
# services/market_intelligence/models.py

import numpy as np
import tensorflow as tf
from tensorflow import keras
from sklearn.model_selection import train_test_split
import pandas as pd
import pickle

class CompetitiveIntensityPredictor:
    """
    LSTM model to predict competitor activity hotspots
    """
    
    def __init__(self, lookback_days=30, hidden_units=128):
        self.lookback_days = lookback_days
        self.hidden_units = hidden_units
        self.model = None
        self.scaler = None
        
    def build_model(self, input_shape):
        """
        Build LSTM architecture
        """
        
        # Time series input
        time_input = keras.Input(shape=(self.lookback_days, 1), name='time_series')
        
        # LSTM layers
        lstm1 = keras.layers.LSTM(self.hidden_units, return_sequences=True)(time_input)
        dropout1 = keras.layers.Dropout(0.2)(lstm1)
        lstm2 = keras.layers.LSTM(self.hidden_units // 2)(dropout1)
        dropout2 = keras.layers.Dropout(0.2)(lstm2)
        
        # Output layer
        output = keras.layers.Dense(1, activation='sigmoid')(dropout2)
        
        # Compile model
        model = keras.Model(inputs=time_input, outputs=output)
        model.compile(
            optimizer='adam',
            loss='binary_crossentropy',
            metrics=['accuracy', 'AUC']
        )
        
        self.model = model
        return model
    
    def prepare_data(self, time_series_df):
        """
        Prepare data for training
        """
        
        # Extract windows and targets
        X = np.array([np.array(w) for w in time_series_df['window']])
        y = np.array(time_series_df['target'])
        
        # Normalize
        from sklearn.preprocessing import StandardScaler
        self.scaler = StandardScaler()
        
        # Reshape for scaling
        n_samples, n_timesteps = X.shape
        X_reshaped = X.reshape(-1, 1)
        X_scaled = self.scaler.fit_transform(X_reshaped)
        X = X_scaled.reshape(n_samples, n_timesteps, 1)
        
        # Binary classification: High activity (1) vs Low activity (0)
        threshold = y.median()
        y_binary = (y > threshold).astype(int)
        
        # Split train/val
        X_train, X_val, y_train, y_val = train_test_split(
            X, y_binary, test_size=0.2, random_state=42
        )
        
        return X_train, X_val, y_train, y_val
    
    def train(self, X_train, y_train, X_val, y_val, epochs=50):
        """
        Train the model
        """
        
        # Callbacks
        early_stop = keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True
        )
        
        checkpoint = keras.callbacks.ModelCheckpoint(
            'models/trained/market_intel_best.h5',
            monitor='val_auc',
            save_best_only=True,
            mode='max'
        )
        
        # Train
        history = self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=32,
            callbacks=[early_stop, checkpoint],
            verbose=1
        )
        
        return history
    
    def predict_hotspots(self, region_data):
        """
        Predict hotspots for next 24 hours
        """
        
        # Preprocess input
        X = self.scaler.transform(region_data.reshape(-1, 1))
        X = X.reshape(1, self.lookback_days, 1)
        
        # Predict
        probability = self.model.predict(X)[0][0]
        
        return {
            'intensity_score': float(probability),
            'is_hotspot': bool(probability > 0.7),
            'confidence': float(probability)
        }
    
    def save(self, path='models/trained/market_intel_v1.h5'):
        """Save model and scaler"""
        self.model.save(path)
        with open(path.replace('.h5', '_scaler.pkl'), 'wb') as f:
            pickle.dump(self.scaler, f)
    
    def load(self, path='models/trained/market_intel_v1.h5'):
        """Load model and scaler"""
        self.model = keras.models.load_model(path)
        with open(path.replace('.h5', '_scaler.pkl'), 'rb') as f:
            self.scaler = pickle.load(f)

# Training script
if __name__ == "__main__":
    print("🧠 Training Market Intelligence Model...")
    
    # Load data
    time_series = pd.read_pickle('data/processed/time_series.pkl')
    
    # Initialize model
    predictor = CompetitiveIntensityPredictor()
    
    # Prepare data
    X_train, X_val, y_train, y_val = predictor.prepare_data(time_series)
    
    # Build and train
    predictor.build_model(input_shape=(30, 1))
    history = predictor.train(X_train, y_train, X_val, y_val)
    
    # Evaluate
    val_loss, val_acc, val_auc = predictor.model.evaluate(X_val, y_val)
    print(f"\n✅ Model trained!")
    print(f"   - Validation Accuracy: {val_acc:.2%}")
    print(f"   - Validation AUC: {val_auc:.3f}")
    
    # Save
    predictor.save()
    print("💾 Model saved to models/trained/market_intel_v1.h5")
```

## Day 11-12: Behavioral Prediction Model

```python
# services/behavioral_prediction/models.py

import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, classification_report
import pandas as pd
import pickle

class BehaviorPredictionEngine:
    """
    XGBoost model to predict SE engagement risk
    """
    
    def __init__(self):
        self.model = None
        self.feature_names = None
        
    def prepare_features(self, behavioral_df):
        """
        Select and engineer features
        """
        
        features = [
            'total_submissions',
            'approval_rate',
            'total_points',
            'avg_time_between',
            'weekend_proportion',
            'days_since_join',
            'region_encoded'
        ]
        
        X = behavioral_df[features]
        
        # Target: Churn risk (low activity in last 7 days)
        # For demonstration, define as: submissions < 5/day average
        behavioral_df['daily_avg'] = behavioral_df['total_submissions'] / behavioral_df['days_since_join']
        y = (behavioral_df['daily_avg'] < 5).astype(int)
        
        self.feature_names = features
        
        return X, y
    
    def train(self, X_train, y_train, X_val, y_val):
        """
        Train XGBoost model
        """
        
        # Convert to DMatrix
        dtrain = xgb.DMatrix(X_train, label=y_train, feature_names=self.feature_names)
        dval = xgb.DMatrix(X_val, label=y_val, feature_names=self.feature_names)
        
        # Parameters
        params = {
            'objective': 'binary:logistic',
            'max_depth': 6,
            'learning_rate': 0.1,
            'n_estimators': 100,
            'eval_metric': 'auc',
            'seed': 42
        }
        
        # Train
        evals = [(dtrain, 'train'), (dval, 'val')]
        self.model = xgb.train(
            params,
            dtrain,
            num_boost_round=100,
            evals=evals,
            early_stopping_rounds=10,
            verbose_eval=10
        )
        
        return self.model
    
    def predict_churn_risk(self, se_features):
        """
        Predict engagement risk for an SE
        """
        
        dtest = xgb.DMatrix(se_features, feature_names=self.feature_names)
        risk_score = self.model.predict(dtest)[0]
        
        # Categorize risk
        if risk_score > 0.7:
            risk_level = 'high'
        elif risk_score > 0.4:
            risk_level = 'medium'
        else:
            risk_level = 'low'
        
        return {
            'churn_risk': float(risk_score),
            'risk_level': risk_level
        }
    
    def get_feature_importance(self):
        """
        Get feature importance scores
        """
        
        importance = self.model.get_score(importance_type='gain')
        return dict(sorted(importance.items(), key=lambda x: x[1], reverse=True))
    
    def save(self, path='models/trained/behavior_predictor_v1.pkl'):
        """Save model"""
        with open(path, 'wb') as f:
            pickle.dump(self.model, f)
    
    def load(self, path='models/trained/behavior_predictor_v1.pkl'):
        """Load model"""
        with open(path, 'rb') as f:
            self.model = pickle.load(f)

# Training script
if __name__ == "__main__":
    print("🧠 Training Behavioral Prediction Model...")
    
    # Load data
    behavioral_df = pd.read_csv('data/processed/behavioral_features.csv')
    
    # Initialize model
    engine = BehaviorPredictionEngine()
    
    # Prepare features
    X, y = engine.prepare_features(behavioral_df)
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train
    engine.train(X_train, y_train, X_val, y_val)
    
    # Evaluate
    dval = xgb.DMatrix(X_val, feature_names=engine.feature_names)
    y_pred = engine.model.predict(dval)
    auc = roc_auc_score(y_val, y_pred)
    
    print(f"\n✅ Model trained!")
    print(f"   - Validation AUC: {auc:.3f}")
    print(f"\n📊 Feature Importance:")
    for feat, score in list(engine.get_feature_importance().items())[:5]:
        print(f"   - {feat}: {score:.2f}")
    
    # Save
    engine.save()
    print("\n💾 Model saved to models/trained/behavior_predictor_v1.pkl")
```

## Day 13-14: Computer Vision Model

```python
# services/computer_vision/detector.py

from ultralytics import YOLO
import cv2
import numpy as np
from PIL import Image

class CompetitorBrandDetector:
    """
    YOLOv8 model to detect competitor brands in images
    """
    
    def __init__(self, model_path='models/trained/yolov8_competitors_v1.pt'):
        # Load pre-trained YOLO
        self.model = YOLO('yolov8n.pt')  # Nano model for speed
        
        # In production, load fine-tuned model:
        # self.model = YOLO(model_path)
        
        # Brand classes (to be trained on)
        self.brands = ['Safaricom', 'Telkom', 'Orange', 'Airtel']
        
    def detect_brands(self, image_path):
        """
        Detect brands in image
        """
        
        # Run detection
        results = self.model(image_path)
        
        detections = []
        
        for result in results:
            boxes = result.boxes
            
            for box in boxes:
                # Extract box info
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                conf = float(box.conf[0])
                cls = int(box.cls[0])
                
                # Map class to brand (simplified)
                brand = self.brands[cls] if cls < len(self.brands) else 'Unknown'
                
                detection = {
                    'brand': brand,
                    'confidence': conf,
                    'bounding_box': [int(x1), int(y1), int(x2), int(y2)],
                    'element': 'logo',  # Would be refined with specific training
                }
                
                detections.append(detection)
        
        return {
            'detections': detections,
            'count': len(detections)
        }
    
    def estimate_size(self, image_path, detection):
        """
        Estimate physical size of detected element
        
        Uses image dimensions and detection box size
        """
        
        img = Image.open(image_path)
        img_width, img_height = img.size
        
        box = detection['bounding_box']
        box_width = box[2] - box[0]
        box_height = box[3] - box[1]
        
        # Proportion of image
        width_proportion = box_width / img_width
        height_proportion = box_height / img_height
        
        # Estimate (simplified - would use camera calibration in production)
        if width_proportion > 0.5:
            size_category = 'large'  # Billboard
            estimated_width = 4.5  # meters
        elif width_proportion > 0.2:
            size_category = 'medium'  # Poster
            estimated_width = 1.5  # meters
        else:
            size_category = 'small'  # Logo/sign
            estimated_width = 0.5  # meters
        
        return {
            'size_category': size_category,
            'estimated_width_meters': estimated_width,
            'prominence_score': (width_proportion + height_proportion) / 2
        }
    
    def train_custom_model(self, dataset_path, epochs=100):
        """
        Train model on custom telco brand dataset
        
        Dataset structure:
        dataset/
          ├── images/
          │   ├── train/
          │   ├── val/
          │   └── test/
          └── labels/
              ├── train/
              ├── val/
              └── test/
        """
        
        # Train
        results = self.model.train(
            data=f'{dataset_path}/data.yaml',
            epochs=epochs,
            imgsz=640,
            batch=16,
            name='telco_brands'
        )
        
        # Save
        self.model.save('models/trained/yolov8_competitors_v1.pt')
        
        return results

# Testing script
if __name__ == "__main__":
    print("👁️ Testing Computer Vision Model...")
    
    detector = CompetitorBrandDetector()
    
    # Test on sample image (if available)
    # results = detector.detect_brands('data/raw/test_image.jpg')
    # print(results)
    
    print("✅ Computer Vision model ready!")
    print("   Note: Fine-tuning on telco brands requires labeled dataset")
```

---

# 🚀 WEEK 3: API DEVELOPMENT

## Day 15-17: FastAPI Services

```python
# services/market_intelligence/app.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from models import CompetitiveIntensityPredictor

app = FastAPI(
    title="Market Intelligence ML Service",
    version="1.0.0"
)

# Load model at startup
predictor = CompetitiveIntensityPredictor()
predictor.load('models/trained/market_intel_v1.h5')

class PredictionRequest(BaseModel):
    region: str
    historical_data: List[float]  # Last 30 days of activity

class PredictionResponse(BaseModel):
    intensity_score: float
    is_hotspot: bool
    confidence: float
    recommended_ses: int

@app.post("/api/v1/predict_hotspot", response_model=PredictionResponse)
async def predict_hotspot(request: PredictionRequest):
    """
    Predict if region will be a hotspot
    """
    
    try:
        # Validate input
        if len(request.historical_data) != 30:
            raise HTTPException(400, "Historical data must be 30 days")
        
        # Convert to numpy array
        data = np.array(request.historical_data)
        
        # Predict
        result = predictor.predict_hotspots(data)
        
        # Calculate recommended SEs
        if result['is_hotspot']:
            recommended_ses = int(result['intensity_score'] * 10)  # Scale 0-10
        else:
            recommended_ses = 1
        
        return {
            **result,
            'recommended_ses': recommended_ses
        }
        
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
```

```python
# services/behavioral_prediction/app.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
from models import BehaviorPredictionEngine

app = FastAPI(
    title="Behavioral Prediction ML Service",
    version="1.0.0"
)

# Load model
engine = BehaviorPredictionEngine()
engine.load('models/trained/behavior_predictor_v1.pkl')

class SEFeatures(BaseModel):
    total_submissions: int
    approval_rate: float
    total_points: int
    avg_time_between: float
    weekend_proportion: float
    days_since_join: int
    region_encoded: int

class RiskResponse(BaseModel):
    churn_risk: float
    risk_level: str
    recommended_interventions: list

@app.post("/api/v1/predict_churn", response_model=RiskResponse)
async def predict_churn(features: SEFeatures):
    """
    Predict SE engagement risk
    """
    
    try:
        # Convert to DataFrame
        feature_dict = features.dict()
        X = pd.DataFrame([feature_dict])
        
        # Predict
        result = engine.predict_churn_risk(X)
        
        # Recommend interventions based on risk level
        interventions = []
        if result['risk_level'] == 'high':
            interventions = [
                "Assign peer mentor",
                "Provide additional training",
                "1-on-1 manager check-in"
            ]
        elif result['risk_level'] == 'medium':
            interventions = [
                "Set achievable daily goals",
                "Highlight recent wins"
            ]
        
        return {
            **result,
            'recommended_interventions': interventions
        }
        
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
```

## Day 18-19: Docker Deployment

```dockerfile
# services/market_intelligence/Dockerfile

FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8001

# Run app
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8001"]
```

```yaml
# docker-compose.yml

version: '3.8'

services:
  market-intel:
    build: ./services/market_intelligence
    ports:
      - "8001:8001"
    volumes:
      - ./models:/app/models
    environment:
      - MODEL_PATH=/app/models/trained/market_intel_v1.h5
    restart: always
    
  behavior-prediction:
    build: ./services/behavioral_prediction
    ports:
      - "8002:8002"
    volumes:
      - ./models:/app/models
    restart: always
    
  computer-vision:
    build: ./services/computer_vision
    ports:
      - "8004:8004"
    volumes:
      - ./models:/app/models
    restart: always
```

---

# 🧪 WEEK 4: TESTING & DOCUMENTATION

## Day 20-21: Unit Tests

```python
# tests/test_market_intel.py

import pytest
import numpy as np
from services.market_intelligence.models import CompetitiveIntensityPredictor

def test_model_prediction():
    """Test model can make predictions"""
    
    predictor = CompetitiveIntensityPredictor()
    predictor.load('models/trained/market_intel_v1.h5')
    
    # Sample data
    data = np.random.rand(30)
    
    result = predictor.predict_hotspots(data)
    
    assert 'intensity_score' in result
    assert 0 <= result['intensity_score'] <= 1
    assert isinstance(result['is_hotspot'], bool)

def test_invalid_input():
    """Test model handles invalid input"""
    
    predictor = CompetitiveIntensityPredictor()
    predictor.load('models/trained/market_intel_v1.h5')
    
    # Wrong length
    with pytest.raises(Exception):
        data = np.random.rand(10)  # Should be 30
        predictor.predict_hotspots(data)
```

## Day 22-23: API Testing

```python
# tests/test_api.py

from fastapi.testclient import TestClient
from services.market_intelligence.app import app

client = TestClient(app)

def test_health_check():
    """Test health endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_predict_hotspot():
    """Test prediction endpoint"""
    
    payload = {
        "region": "Nairobi",
        "historical_data": [float(x) for x in range(30)]
    }
    
    response = client.post("/api/v1/predict_hotspot", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "intensity_score" in data
    assert "is_hotspot" in data
```

## Day 24: Documentation

```markdown
# ML Services Documentation

## Overview

Three independent ML services for sales intelligence:

1. **Market Intelligence** (Port 8001)
2. **Behavioral Prediction** (Port 8002)  
3. **Computer Vision** (Port 8004)

## Quick Start

```bash
# Start all services
docker-compose up -d

# Check health
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8004/health
```

## API Usage

### Market Intelligence

```bash
curl -X POST http://localhost:8001/api/v1/predict_hotspot \
  -H "Content-Type: application/json" \
  -d '{
    "region": "Nairobi",
    "historical_data": [1,2,3,...,30]
  }'
```

Response:
```json
{
  "intensity_score": 0.87,
  "is_hotspot": true,
  "confidence": 0.92,
  "recommended_ses": 8
}
```

## Integration with Main App

```python
# In Flutter app backend
import requests

def get_hotspot_prediction(region, historical_data):
    response = requests.post(
        'http://ml-service:8001/api/v1/predict_hotspot',
        json={
            'region': region,
            'historical_data': historical_data
        }
    )
    return response.json()
```

---

## 🎯 SUCCESS METRICS

**Week 1**: ✅ Environment setup, data collected  
**Week 2**: ✅ 3 ML models trained, accuracy > 75%  
**Week 3**: ✅ APIs deployed, response time < 100ms  
**Week 4**: ✅ Tests passing, documentation complete  

**Result**: **Independent ML system ready for integration!**

---

**Next**: Integrate with main Flutter app! 🚀

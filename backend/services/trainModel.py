import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

print("Starting training...")

# Check file exists
if not os.path.exists("data/smart_irrigation_dataset.csv"):
    print("❌ Dataset NOT FOUND")
    exit()

print("✅ Dataset found")

df = pd.read_csv("data/smart_irrigation_dataset.csv")

print("Dataset loaded:", df.shape)

X = df[[
    "temperature",
    "humidity",
    "soil_moisture",
    "lux",
    "air_quality",
    "tvoc",
    "eco2",
    "aqi",
    "hour"
]]

y = df["irrigation_needed"]

model = RandomForestClassifier(n_estimators=50)
model.fit(X, y)

joblib.dump(model, "data/model.pkl")

print("✅ Model saved at data/model.pkl")
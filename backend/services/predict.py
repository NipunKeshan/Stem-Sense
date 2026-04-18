import sys
import json
import joblib
import pandas as pd

model = joblib.load("data/model.pkl")

input_data = json.loads(sys.argv[1])

df = pd.DataFrame([input_data])[[
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

prediction = model.predict(df)[0]

print(json.dumps({"irrigation": int(prediction)}))
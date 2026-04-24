"""
StemSense — Flask Backend
Receives ESP8266 telemetry → stores to MongoDB.
Serves pump commands back to the device.

Routes
------
POST /telemetry   — ingest sensor reading (live or buffered)
GET  /command     — ESP8266 polls this for pump instruction
POST /command     — ML engine / manual override sets pump state
GET  /health      — liveness check
"""

from flask import Flask, request, jsonify
from pymongo import MongoClient, ASCENDING
from pymongo.errors import ServerSelectionTimeoutError, PyMongoError, DuplicateKeyError
from datetime import datetime, timezone
import logging
import os
from dotenv import load_dotenv

# ── Logging ────────────────────────────────────────────────────────────────────

# Load environment variables from .env file in the same directory
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger(__name__)

app = Flask(__name__)

# Check for MONGO_URI or MONGODB_URI (commonly used in .env)
MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI")
if not MONGO_URI:
    raise RuntimeError(
        "MONGO_URI or MONGODB_URI environment variable is not set. "
        "Export it before starting or ensure it exists in backend/.env"
    )

try:
    _mongo = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    _mongo.admin.command("ping")
    log.info("MongoDB connected")
except ServerSelectionTimeoutError as exc:
    log.error("MongoDB connection failed: %s", exc)
    _mongo = None

_db        = _mongo["stemsense"] if _mongo is not None else None
telemetry  = _db["telemetry"]    if _db    is not None else None

# ── Indexes ────────────────────────────────────────────────────────────────────

if telemetry is not None:
    # Primary time-series query pattern
    telemetry.create_index(
        [("sensor_id", ASCENDING), ("captured_at", ASCENDING)],
        background=True,
    )
    # Unique constraint — makes buffered re-delivery idempotent
    # (duplicate captured_at from same sensor is silently ignored)
    telemetry.create_index(
        [("sensor_id", ASCENDING), ("captured_at", ASCENDING)],
        unique=True,
        background=True,
        name="sensor_time_unique",
    )
    log.info("Indexes ensured on telemetry collection")

# ── Schema helpers ─────────────────────────────────────────────────────────────

# Minimum epoch sanity floor: 2024-01-01 00:00:00 UTC
_TS_FLOOR = 1_704_067_200

# Fields that must always be present
REQUIRED_FIELDS = {
    "sensor_id", "temperature", "humidity",
    "soil_moisture", "lux", "tvoc", "eco2", "aqi",
}

def build_document(payload: dict, source: str = "live") -> dict:
    """
    Map ESP8266 JSON → structured MongoDB document.

    Timestamp handling
    ------------------
    The device supplies 'captured_at' as a Unix UTC epoch (set via NTP).
    We convert it to a Python datetime and store that.

    If the device had no NTP sync ('no_timestamp': true), we fall back to
    server insertion time and tag the doc so it can be filtered in the
    ML pipeline.

    Schema groups
    -------------
    env     — atmospheric readings (temperature, humidity, air quality)
    soil    — substrate readings
    actuators — relay state (used as ML training label)
    """
    raw_ts = payload.get("captured_at")
    no_ts  = payload.get("no_timestamp", False)

    if raw_ts is not None and not no_ts:
        if raw_ts < _TS_FLOOR:
            log.warning("Implausible timestamp %d from %s — using server time",
                        raw_ts, payload.get("sensor_id"))
            captured_at   = datetime.now(timezone.utc)
            ts_source     = "server_fallback"
        else:
            captured_at   = datetime.fromtimestamp(raw_ts, tz=timezone.utc)
            ts_source     = source   # "live" or "buffered"
    else:
        captured_at   = datetime.now(timezone.utc)
        ts_source     = "server_no_ntp"

    return {
        "sensor_id":   payload["sensor_id"],
        "captured_at": captured_at,
        "ts_source":   ts_source,   # live | buffered | server_fallback | server_no_ntp
        "env": {
            "temperature_c": payload.get("temperature"),
            "humidity_pct":  payload.get("humidity"),
            "tvoc_ppb":      payload.get("tvoc"),
            "eco2_ppm":      payload.get("eco2"),
            "aqi":           payload.get("aqi"),
            "lux":           payload.get("lux"),
        },
        "soil": {
            "moisture_pct": payload.get("soil_moisture"),
        },
        "actuators": {
            "pump_on": bool(payload.get("pump_state", 0)),
        },
    }

# ── Pump state (DB-backed so it survives restarts) ─────────────────────────────

def _get_pump_state() -> int:
    if _db is None:
        return 0
    doc = _db["pump_command"].find_one({"_id": "global"})
    return int(doc["pump"]) if doc else 0

def _set_pump_state(val: int) -> None:
    if _db is None:
        return
    _db["pump_command"].update_one(
        {"_id": "global"},
        {"$set": {"pump": val, "updated_at": datetime.now(timezone.utc)}},
        upsert=True,
    )

# ── Routes ─────────────────────────────────────────────────────────────────────

@app.route("/telemetry", methods=["POST"])
def receive_telemetry():
    payload = request.get_json(silent=True)

    if not payload:
        log.warning("Rejected: empty or non-JSON body from %s", request.remote_addr)
        return jsonify({"error": "invalid JSON"}), 400

    missing = REQUIRED_FIELDS - payload.keys()
    if missing:
        log.warning("Rejected: missing fields %s", missing)
        return jsonify({"error": f"missing fields: {sorted(missing)}"}), 400

    if telemetry is None:
        log.error("MongoDB unavailable — dropping telemetry from %s", payload.get("sensor_id"))
        return jsonify({"error": "database unavailable"}), 503

    source = "buffered" if payload.get("buffered") else "live"
    doc    = build_document(payload, source=source)

    try:
        result = telemetry.insert_one(doc)
        log.info(
            "Stored [%-18s] %-22s  temp=%.1f°C  soil=%d%%  pump=%s",
            doc["ts_source"],
            payload["sensor_id"],
            payload.get("temperature", 0),
            payload.get("soil_moisture", 0),
            "ON" if payload.get("pump_state") else "OFF",
        )
        return jsonify({"status": "ok", "id": str(result.inserted_id)}), 200

    except DuplicateKeyError:
        # Buffered re-delivery of an already-stored reading — not an error
        log.info("Duplicate reading from %s @ %s — skipped",
                 payload.get("sensor_id"), payload.get("captured_at"))
        return jsonify({"status": "duplicate", "id": None}), 200

    except PyMongoError as exc:
        log.error("Insert failed: %s", exc)
        return jsonify({"error": "insert failed"}), 500


@app.route("/command", methods=["GET"])
def get_command():
    """ESP8266 polls this every loop cycle for the current pump decision."""
    return jsonify({"pump": _get_pump_state()}), 200


@app.route("/command", methods=["POST"])
def set_command():
    """
    ML engine or manual dashboard override sets pump state.
    Body: {"pump": 0 | 1}
    """
    body = request.get_json(silent=True)
    if body is None or "pump" not in body:
        return jsonify({"error": 'expected {"pump": 0 or 1}'}), 400

    val = int(bool(body["pump"]))
    _set_pump_state(val)
    log.info("Pump command updated → %d", val)
    return jsonify({"status": "ok", "pump": val}), 200


@app.route("/health", methods=["GET"])
def health():
    db_ok = telemetry is not None
    return jsonify({"status": "ok" if db_ok else "degraded", "db": db_ok}), \
           200 if db_ok else 503


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=False)

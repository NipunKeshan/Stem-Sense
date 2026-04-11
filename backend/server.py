"""
StemSense — server.py
Flask backend for the StemSense ESP8266 node.

Endpoints used by the device:
  POST /telemetry   — receives sensor readings every ~2 s
  GET  /command     — returns pump state as {"pump": 1 | 0}

Extra endpoints for you / a dashboard:
  GET  /status      — latest telemetry snapshot (JSON)
  POST /pump/on     — tell the node to turn the pump on
  POST /pump/off    — tell the node to turn the pump off
  GET  /history     — last N telemetry records (JSON)
"""

from flask import Flask, request, jsonify
import sqlite3
import time
import logging

# ── Config ────────────────────────────────────────────────────────────────────

HOST            = "0.0.0.0"
PORT            = 5000
DB_PATH         = "stemsense.db"
HISTORY_LIMIT   = 500          # rows kept in the DB

# ── App setup ─────────────────────────────────────────────────────────────────

app = Flask(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ── In-memory state ───────────────────────────────────────────────────────────
# Think of this like a sticky note on the fridge:
#   - `latest_telemetry`  → most recent reading from the node
#   - `pump_command`      → what you want the pump to do next time it asks

latest_telemetry: dict = {}
pump_command: int = 0           # 0 = OFF, 1 = ON

# ── Database ──────────────────────────────────────────────────────────────────

def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS telemetry (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                ts           REAL    NOT NULL,
                device_id    TEXT,
                temperature  REAL,
                humidity     REAL,
                tvoc         INTEGER,
                eco2         INTEGER,
                aqi          INTEGER,
                lux          REAL,
                dli          REAL,
                soil_moisture INTEGER,
                pump_state   INTEGER
            )
        """)
        conn.commit()
    log.info("Database ready at %s", DB_PATH)

# ── Helpers ───────────────────────────────────────────────────────────────────

def _prune_old_rows(conn: sqlite3.Connection) -> None:
    """Keep the table from growing forever — like a rolling log."""
    conn.execute("""
        DELETE FROM telemetry
        WHERE id NOT IN (
            SELECT id FROM telemetry ORDER BY id DESC LIMIT ?
        )
    """, (HISTORY_LIMIT,))

# ── Routes ────────────────────────────────────────────────────────────────────

@app.post("/telemetry")
def receive_telemetry():
    """
    The ESP8266 POSTs here every ~2 s with a JSON body like:
    {
        "device_id":    "stemsense_node_01",
        "temperature":  24.50,
        "humidity":     61.20,
        "tvoc":         120,
        "eco2":         450,
        "aqi":          1,
        "lux":          340.5,
        "dli":          0.001234,
        "soil_moisture": 42,
        "pump_state":   0
    }
    """
    global latest_telemetry

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "invalid JSON"}), 400

    data["ts"] = time.time()
    latest_telemetry = data

    log.info(
        "Telemetry | T=%.1f°C  H=%.1f%%  Soil=%d%%  Pump=%s  AQI=%s",
        data.get("temperature", 0),
        data.get("humidity", 0),
        data.get("soil_moisture", 0),
        "ON" if data.get("pump_state") else "OFF",
        data.get("aqi", "?"),
    )

    with get_db() as conn:
        conn.execute("""
            INSERT INTO telemetry
                (ts, device_id, temperature, humidity, tvoc, eco2, aqi,
                 lux, dli, soil_moisture, pump_state)
            VALUES
                (:ts, :device_id, :temperature, :humidity, :tvoc, :eco2, :aqi,
                 :lux, :dli, :soil_moisture, :pump_state)
        """, data)
        _prune_old_rows(conn)
        conn.commit()

    return jsonify({"status": "ok"}), 200


@app.get("/command")
def send_command():
    """
    The ESP8266 GETs this every ~2 s and looks for:
        {"pump": 1}   → turn pump on
        {"pump": 0}   → turn pump off

    The device enforces its own soil-saturation safety check
    on top of whatever we say here.
    """
    return jsonify({"pump": pump_command}), 200


@app.get("/status")
def status():
    """Return the latest telemetry snapshot + current pump command."""
    return jsonify({
        "telemetry":      latest_telemetry,
        "pump_command":   pump_command,
    }), 200


@app.post("/pump/on")
def pump_on():
    global pump_command
    pump_command = 1
    log.info("Pump command → ON")
    return jsonify({"pump_command": pump_command}), 200


@app.post("/pump/off")
def pump_off():
    global pump_command
    pump_command = 0
    log.info("Pump command → OFF")
    return jsonify({"pump_command": pump_command}), 200


@app.get("/history")
def history():
    """Return the last N rows of telemetry as a JSON list."""
    n = min(int(request.args.get("n", 50)), HISTORY_LIMIT)
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM telemetry ORDER BY id DESC LIMIT ?", (n,)
        ).fetchall()
    return jsonify([dict(r) for r in rows]), 200


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    init_db()
    log.info("StemSense server starting on %s:%d", HOST, PORT)
    app.run(host=HOST, port=PORT, debug=False)

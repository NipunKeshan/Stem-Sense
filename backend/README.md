# Stem-Sense — Backend

This document describes the backend for the Stem-Sense IoT plant monitoring project. It covers architecture, installation, configuration, the data model, API endpoints, operation, and important notes for development and production.

> Location: [backend/](backend/)

---

## Table of contents

- [Overview](#overview)
- [Architecture & Process Flow](#architecture--process-flow)
- [Prerequisites](#prerequisites)
- [Environment variables](#environment-variables)
- [Installation & Run (development)](#installation--run-development)
- [Seeding & sample data](#seeding--sample-data)
- [API reference (endpoints)](#api-reference-endpoints)
	- [Sensor endpoints (/api/sensors)](#sensor-endpoints-apisensors)
	- [Auth endpoints (/api/auth)](#auth-endpoints-apiauth)
- [Data model (MongoDB)](#data-model-mongodb)
- [Authentication & Authorization](#authentication--authorization)
- [Pump control and safety notes](#pump-control-and-safety-notes)
- [Error handling & status codes](#error-handling--status-codes)
- [Development notes & key files](#development-notes--key-files)
- [Production recommendations](#production-recommendations)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

This backend provides a REST API to receive telemetry from IoT nodes (ESP8266/NodeMCU), persist sensor measurements in MongoDB, and expose endpoints for a frontend dashboard and device control.

Two server implementations exist in this folder:

- Node.js/Express backend (primary) — production/development API with MongoDB and user auth.
- Flask helper (`server.py`) — small device-facing server with SQLite for quick device testing and onboarding.

The Node backend is intended as the central API for the dashboard and data storage.

## Architecture & Process Flow

1. Device (ESP8266) posts telemetry to Node backend via `POST /api/sensors`.
2. Node backend saves telemetry to a MongoDB collection `SensorData`.
3. Frontend queries endpoints to display latest reading, aggregated stats, and historical data.
4. Dashboard may send pump commands (respecting safety checks) via pump endpoints.

## Prerequisites

- Node.js (v16+ recommended)
- npm
- MongoDB accessible to the backend (Atlas or local)
- Optional: Python 3 to run `server.py` for device testing

## Environment variables

Create `backend/.env` and set:

- `MONGODB_URI` (required) — MongoDB connection string.
- `JWT_SECRET` — secret for signing tokens (use a strong value).
- `PORT` — server port (default 5000).

Example:

```
MONGODB_URI=mongodb://localhost:27017/stemsense
JWT_SECRET=supersecretvalue
PORT=5000
```

## Installation & Run (development)

```bash
cd backend
npm install
npm run dev
```

The server uses `nodemon` for `npm run dev` so it reloads on changes.

## Seeding & sample data

On startup `server.js` will:

- Seed an admin user if none exists (username `admin`, password `admin123`).
- Seed 24 hours of sample hourly sensor readings if `SensorData` is empty.

These seeds are for development only — change credentials before publishing.

## API reference (endpoints)

Base URL (dev): `http://localhost:5000`

Routes are implemented in `backend/routes`.

### Sensor endpoints (`/api/sensors`)

- GET `/api/sensors`
	- Returns all telemetry (sorted newest first).

- POST `/api/sensors`
	- Adds telemetry record.
	- Example body:

```json
{
	"device_id": "DEVICE_001",
	"temperature": 24.5,
	"humidity": 48.1,
	"tvoc": 120,
	"eco2": 420,
	"aqi": 35,
	"lux": 300.5,
	"dli": 1.23,
	"soil_moisture": 42,
	"pump_state": 0,
	"manual_override": 0
}
```

- GET `/api/sensors/latest` — most recent reading.
- GET `/api/sensors/stats` — aggregated stats (min/max/avg) for last 24 hours (falls back to last 100 readings).
- GET `/api/sensors/temperature`, `/humidity`, `/tvoc`, `/eco2`, `/aqi`, `/lux`, `/dli`, `/soil-moisture` — latest single metric.

- POST `/api/sensors/pump-state` — legacy: write a record updating pump state.

- GET `/api/sensors/pump` — returns desired (in-memory) pump state and latest actual pump state.
- POST `/api/sensors/pump` — set desired pump state `{ "pump": 0|1 }`. This endpoint will reject remote changes if the latest telemetry has `manual_override === 1` (hardware override lock).

- GET `/api/sensors/pump/today` — returns all telemetry records for *today* (Sri Lanka local day, timezone `Asia/Colombo`) where `pump_state` is `1`. Response includes only `pump_state` and a `timestamp` formatted in Sri Lanka local time (YYYY-MM-DD HH:MM:SS). Example response:

```json
{
	"success": true,
	"count": 2,
	"data": [
		{ "pump_state": 1, "timestamp": "2026-04-21 14:12:33" },
		{ "pump_state": 1, "timestamp": "2026-04-21 08:05:01" }
	]
}
```

### Auth endpoints (`/api/auth`)

- POST `/api/auth/login` — body `{ username, password }`. Returns JWT `token` plus user info.
- GET `/api/auth/me` — protected: returns current user info.
- GET `/api/auth/users` — admin-protected: list users.
- POST `/api/auth/users` — admin-protected: create user.
- PUT `/api/auth/users/:id/permissions` — admin-protected: update permissions.

Authentication: pass header `Authorization: Bearer <token>`.

## Data model (MongoDB)

`SensorData` (fields and types):

- `device_id`: String (required)
- `temperature`: Number (required) — rounded to 1 decimal when returned
- `humidity`: Number (required) — rounded to 1 decimal
- `tvoc`: Number (required)
- `eco2`: Number (required)
- `aqi`: Number (required)
- `lux`: Number (required)
- `dli`: Number (required) — rounded to 2 decimals
- `soil_moisture`: Number (required)
- `pump_state`: Number (required)
- `manual_override`: Number (default 0)
- `timestamp`: Date (default now)

`User` model:

- `username`: String, unique
- `password`: String (hashed via bcrypt in pre-save)
- `role`: `admin`|`user`
- `permissions`: [String]

## Authentication & Authorization

- JWT tokens signed with `JWT_SECRET`, expire in 30 days.
- `middleware/authMiddleware.js` provides `protect` (verify JWT, set `req.user`) and `admin` (check `req.user.role`).

## Pump control and safety notes

- Two concepts: `desiredPumpState` (in-memory desired state set by API) and `actual pump_state` recorded by devices in telemetry.
- If `manual_override === 1` in the latest telemetry, remote pump commands are blocked for safety (HTTP 423).
- Ensure hardware enforces safety and saturations (device-side checks) — backend should never be the only safety mechanism.

## Error handling & status codes

- 200 OK — successful GET/PUT
- 201 Created — resource created
- 400 Bad Request — validation failed
- 401 Unauthorized — missing/invalid token
- 403 Forbidden — not admin
- 423 Locked — manual override prevents action
- 500 Internal Server Error — unexpected error

Controllers try to return validation messages when Mongoose validation fails.

## Development notes & key files

- `server.js` — entry point, connects DB, seeds data, mounts routes.
- `config/db.js` — DB connection helper.
- `routes/sensorRoutes.js`, `routes/authRoutes.js` — route definitions.
- `controllers/sensorController.js`, `controllers/authController.js` — business logic.
- `models/SensorData.js`, `models/User.js` — Mongoose models.
- `middleware/authMiddleware.js` — JWT and admin guards.
- `server.py` — optional Flask helper for device testing.

## Production recommendations

1. Use a strong `JWT_SECRET` and never use the fallback.
2. Enable HTTPS, restrict CORS to known origins.
3. Add rate-limiting, input validation and request size limits.
4. Use robust process manager (PM2 or container) and monitoring.
5. Add DB TTL index or background job to prune old telemetry if needed.
6. Add auditing for pump actuation and secure logs.

## Troubleshooting

- "Cannot connect to MongoDB": verify `MONGODB_URI`, network, and credentials.
- "Not authorized": ensure the token is in `Authorization: Bearer <token>`.
- No data in frontend: check that devices are posting to `/api/sensors` and that the DB has documents; check `server.js` logs for seeding messages.

## Flask helper server (optional)

`server.py` implements a minimal device-facing API:

- POST `/telemetry` — device posts telemetry JSON (useful when device expects this simple contract).
- GET `/command` — returns `{"pump": 1|0}` for device to poll.
- Additional endpoints: `/status`, `/pump/on`, `/pump/off`, `/history` (see file for details).

Run with:

```bash
python server.py
```

## Quick curl examples

- Login

```bash
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'
```

- Post telemetry

```bash
curl -X POST http://localhost:5000/api/sensors -H "Content-Type: application/json" -d '{"device_id":"DEV01","temperature":25.2,"humidity":50,"tvoc":120,"eco2":400,"aqi":20,"lux":200,"dli":1.23,"soil_moisture":40,"pump_state":0}'
```

- Toggle pump (example)

```bash
curl -X POST http://localhost:5000/api/sensors/pump -H "Content-Type: application/json" -d '{"pump":1}'
```

## Contributing

1. Fork the repo, create a branch, and open a PR.
2. Keep edits focused and add tests where relevant.
3. Update this README for any breaking API changes.

## License

Add an appropriate license file to the repository if you plan to make this public.

## Maintainer / Contact

Open an issue in the repo for help or reach the project owner.

---

Key file references:

- [backend/server.js](backend/server.js)
- [backend/config/db.js](backend/config/db.js)
- [backend/models/SensorData.js](backend/models/SensorData.js)
- [backend/models/User.js](backend/models/User.js)
- [backend/controllers/sensorController.js](backend/controllers/sensorController.js)
- [backend/controllers/authController.js](backend/controllers/authController.js)
- [backend/routes/sensorRoutes.js](backend/routes/sensorRoutes.js)
- [backend/routes/authRoutes.js](backend/routes/authRoutes.js)

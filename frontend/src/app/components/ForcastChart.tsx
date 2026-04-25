"use client";

import React, { useEffect, useState } from "react";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ReferenceArea,
	ScatterChart,
	Scatter,
	ZAxis,
} from "recharts";

import { ChartContainer } from "./ui/chart";

type ForecastPoint = {
	day: number;
	predicted_stress: number;
	zone: string;
	date?: string;
};

type ForecastResp = {
	success: boolean;
	model?: string;
	r2?: number;
	mae?: number;
	starting_state?: Record<string, any>;
	forecast: ForecastPoint[];
};

const ZONES = ["healthy", "warning", "critical"] as const;
type Zone = (typeof ZONES)[number];

const ZONE_COLOR: Record<Zone, string> = {
	healthy: "#16a34a",
	warning: "#f59e0b",
	critical: "#ef4444",
};

const TAB_LABELS = ["Soil/Temp", "Soil/Humidity", "Temp/Humidity"];

// ── Safely parse a value that might be a double-encoded JSON string ───────
function safeParseJSON(raw: any): any {
	if (raw === null || raw === undefined) return raw;
	if (typeof raw === "string") {
		try {
			return JSON.parse(raw);
		} catch {
			return raw;
		}
	}
	return raw;
}

// ── Normalise correlation API response into panels ────────────────────────
function extractScatterPanels(corrResp: any): any[] {
	if (!corrResp) return [];

	const sd = corrResp.scatter_data;

	if (Array.isArray(sd) && sd.length > 0) {
		// Multi-panel with nested points array — the expected shape
		if (Array.isArray(sd[0]?.points)) {
			return sd;
		}
		// Flat array of raw {x,y,...} points inside scatter_data
		if (sd[0]?.x !== undefined) {
			return [{ label: "Correlation", points: sd }];
		}
	}

	// Top-level array of raw points
	if (Array.isArray(corrResp) && corrResp.length > 0 && corrResp[0]?.x !== undefined) {
		return [{ label: "Correlation", points: corrResp }];
	}

	return [];
}

// ── Scatter panel ─────────────────────────────────────────────────────────
function ScatterPanel({ data }: { data: any[] }) {
	const [active, setActive] = useState(0);

	const validData = Array.isArray(data)
		? data.filter((d) => d && Array.isArray(d.points) && d.points.length > 0)
		: [];

	if (validData.length === 0) {
		return (
			<div className="text-sm text-slate-400 py-4">
				No correlation data available.
			</div>
		);
	}

	const safeActive = Math.min(active, validData.length - 1);
	const panel = validData[safeActive];

	const labelParts = (panel.label || "").split(" vs ");
	const xLabel = (panel.x_col || labelParts[0] || "x").replace(/_/g, " ");
	const yLabel = (panel.y_col || labelParts[1] || "y").replace(/_/g, " ");

	const pts: any[] = panel.points;

	const byZone: Record<Zone, any[]> = {
		healthy: pts.filter((p: any) => p.zone === "healthy"),
		warning: pts.filter((p: any) => p.zone === "warning"),
		critical: pts.filter((p: any) => p.zone === "critical"),
	};

	const unzoned = pts.filter(
		(p: any) => !["healthy", "warning", "critical"].includes(p.zone)
	);

	return (
		<div>
			<div className="flex items-center justify-between mb-3">
				<div>
					<div className="text-xs text-muted-foreground">Sensor Correlation</div>
					<div className="text-sm font-semibold">{panel.label}</div>
				</div>
				<div className="flex gap-2 flex-wrap">
					{validData.map((d: any, i: number) => (
						<button
							key={i}
							onClick={() => setActive(i)}
							className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${i === safeActive
								? "bg-sky-600 text-white"
								: "bg-slate-100 text-slate-500 hover:bg-slate-200"
								}`}
						>
							{TAB_LABELS[i] ?? d.label ?? `Panel ${i + 1}`}
						</button>
					))}
				</div>
			</div>

			<ChartContainer
				id={`corr-${safeActive}`}
				className="h-64 w-full"
				config={{ scatter: { label: panel.label } }}
			>
				<ScatterChart>
					<CartesianGrid />
					<XAxis
						dataKey="x"
						name={xLabel}
						label={{ value: xLabel, position: "insideBottom", offset: -2, fontSize: 11 }}
					/>
					<YAxis
						dataKey="y"
						name={yLabel}
						label={{ value: yLabel, angle: -90, position: "insideLeft", fontSize: 11 }}
					/>
					<ZAxis dataKey="stress" range={[40, 200]} />
					<Tooltip cursor={{ strokeDasharray: "3 3" }} />
					{ZONES.map(
						(z) =>
							byZone[z].length > 0 && (
								<Scatter key={z} name={z} data={byZone[z]} fill={ZONE_COLOR[z]} />
							)
					)}
					{unzoned.length > 0 && (
						<Scatter name="unknown" data={unzoned} fill="#94a3b8" />
					)}
				</ScatterChart>
			</ChartContainer>

			<div className="mt-3 flex gap-4 flex-wrap">
				{ZONES.map((z) => (
					<div key={z} className="flex items-center gap-2 text-sm text-slate-500">
						<span
							className="inline-block w-3 h-3 rounded-full"
							style={{ background: ZONE_COLOR[z] }}
						/>
						<span>{z} ({byZone[z].length})</span>
					</div>
				))}
				{unzoned.length > 0 && (
					<div className="flex items-center gap-2 text-sm text-slate-500">
						<span className="inline-block w-3 h-3 rounded-full bg-slate-400" />
						<span>unknown ({unzoned.length})</span>
					</div>
				)}
				<div className="ml-auto text-sm text-slate-400">{pts.length} data points</div>
			</div>
		</div>
	);
}

// ── Feature importance bar ────────────────────────────────────────────────
function ImportanceBar({
	feature,
	importance,
	coefficient,
}: {
	feature: string;
	importance: number;
	coefficient: number;
}) {
	if (!isFinite(importance) || !isFinite(coefficient)) return null;

	const pct = (importance * 100).toFixed(1);
	const isPositive = coefficient >= 0;
	const color = isPositive ? "#3b82f6" : "#a855f7";
	return (
		<div className="mb-2">
			<div className="flex justify-between mb-1">
				<span className="text-xs text-muted-foreground">{feature.replace(/_/g, " ")}</span>
				<div className="flex items-center gap-2">
					<span className="text-xs text-slate-400">
						{isPositive ? "+" : ""}
						{coefficient.toFixed(3)}
					</span>
					<span style={{ color, fontWeight: 600 }}>{pct}%</span>
				</div>
			</div>
			<div className="bg-slate-800 rounded h-1 overflow-hidden">
				<div
					style={{
						width: `${Math.min(Number(pct), 100)}%`,
						height: "100%",
						background: `linear-gradient(90deg, ${color}, ${color}88)`,
					}}
				/>
			</div>
		</div>
	);
}

// ── Helpers ───────────────────────────────────────────────────────────────
function ordinalSuffix(n: number) {
	const j = n % 10, k = n % 100;
	if (j === 1 && k !== 11) return "st";
	if (j === 2 && k !== 12) return "nd";
	if (j === 3 && k !== 13) return "rd";
	return "th";
}

function formatDateForDayOffset(dayOffset: number) {
	const dt = new Date();
	dt.setDate(dt.getDate() + dayOffset);
	const day = dt.getDate();
	const month = dt.toLocaleString("default", { month: "long" });
	return `${day}${ordinalSuffix(day)} ${month}`;
}

// ── Main component ────────────────────────────────────────────────────────
export default function ForcastChart() {
	const [forecast, setForecast] = useState<ForecastPoint[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [corrResp, setCorrResp] = useState<any | null>(null);
	const [corrLoading, setCorrLoading] = useState(true);
	const [corrError, setCorrError] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;

		async function fetchForecast() {
			setLoading(true);
			try {
				const res = await fetch("/api/ml/stress-forecast");
				if (!res.ok) throw new Error(`Forecast request failed (${res.status})`);
				const raw = await res.json();
				// Handle double-encoded response
				const data: ForecastResp = safeParseJSON(raw);
				if (!mounted) return;
				setForecast(
					(data.forecast || []).map((p) => ({
						...p,
						date: formatDateForDayOffset(p.day),
					}))
				);
				setError(null);
			} catch (err: any) {
				if (mounted) setError(err?.message || String(err));
			} finally {
				if (mounted) setLoading(false);
			}
		}

		async function fetchCorrelation() {
			setCorrLoading(true);
			setCorrError(null);
			try {
				// Try ML service first, fall back to Node.js backend
				let cData = null;
				try {
					const cRes = await fetch("/api/ml/correlation");
					if (cRes.ok) {
						const raw = await cRes.json();
						cData = safeParseJSON(raw);
					}
				} catch {
					// ML service unavailable — will fall back below
				}

				// Fallback: use Node.js backend endpoint (reads from DB directly)
				if (!cData || !cData.scatter_data) {
					const fallback = await fetch("/api/sensors/correlation");
					if (!fallback.ok) throw new Error(`Correlation request failed (${fallback.status})`);
					cData = await fallback.json();
				}

				if (!mounted) return;
				setCorrResp(cData);
			} catch (e: any) {
				if (mounted) setCorrError(e?.message || String(e));
			} finally {
				if (mounted) setCorrLoading(false);
			}
		}

		fetchForecast();
		fetchCorrelation();

		return () => { mounted = false; };
	}, []);

	const scatterPanels = React.useMemo(() => extractScatterPanels(corrResp), [corrResp]);

	const importances = React.useMemo(() => {
		if (!corrResp?.feature_importance) return [];
		return Object.entries(corrResp.feature_importance)
			.map(([k, v]: any) => ({
				feature: k,
				importance: v.importance,
				coefficient: v.coefficient,
			}))
			.filter((it) => isFinite(it.importance) && isFinite(it.coefficient))
			.sort((a, b) => b.importance - a.importance);
	}, [corrResp]);

	const healthyMax = 30;
	const warningMax = 60;

	return (
		<div className="space-y-6">
			{/* ── Forecast chart ── */}
			<div className="bg-white rounded-lg p-4 w-full text-black shadow-sm">
				<h3 className="text-sm font-medium mb-2">30-day Stress Forecast</h3>

				{loading ? (
					<div className="text-sm text-muted-foreground">Loading forecast…</div>
				) : error ? (
					<div className="text-destructive text-sm">{error}</div>
				) : (
					<div className="relative">
						<div className="flex justify-end mb-2">
							<div className="flex items-center gap-4 text-sm">
								{[
									{ color: "#16a34a", label: "0–30 → Healthy" },
									{ color: "#f59e0b", label: "31–60 → Warning" },
									{ color: "#ef4444", label: "61–100 → Critical" },
								].map(({ color, label }) => (
									<div key={label} className="flex items-center gap-2">
										<span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
										<span>{label}</span>
									</div>
								))}
							</div>
						</div>

						<ChartContainer
							id="stress-forecast"
							config={{ stress: { label: "Stress" } }}
							className="h-64 w-full"
						>
							<LineChart data={forecast}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis
									dataKey="date"
									tick={{ fill: "#374151", fontSize: 12 }}
									interval={
										forecast.length
											? Math.max(0, Math.ceil(forecast.length / 6) - 1)
											: 0
									}
								/>
								<YAxis domain={[0, 100]} tick={{ fill: "#374151" }} />
								<Tooltip />
								<ReferenceArea y1={0} y2={healthyMax} fill="rgba(16,185,129,0.08)" />
								<ReferenceArea y1={healthyMax} y2={warningMax} fill="rgba(250,204,21,0.06)" />
								<ReferenceArea y1={warningMax} y2={100} fill="rgba(239,68,68,0.06)" />
								<Line
									type="monotone"
									dataKey="predicted_stress"
									stroke="var(--color-chart-1, #16a34a)"
									strokeWidth={2}
									dot={{ r: 2 }}
									activeDot={{ r: 4 }}
								/>
							</LineChart>
						</ChartContainer>
					</div>
				)}
			</div>

			{/* ── Correlation section ── */}
			{/* <div className="bg-white rounded-lg p-4 w-full text-black shadow-sm">
				<h3 className="text-sm font-medium mb-2">Sensor Correlation</h3>

				{corrLoading ? (
					<div className="text-sm text-muted-foreground">Loading correlation…</div>
				) : corrError ? (
					<div className="text-destructive text-sm">{corrError}</div>
				) : (
					<div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
						<ScatterPanel data={scatterPanels} />

						<div className="p-4 bg-slate-50 rounded-lg">
							<div className="text-xs text-muted-foreground mb-1">Model Insights</div>
							<div className="text-sm font-semibold mb-3">Feature Influence</div>
							{importances.length === 0 ? (
								<div className="text-xs text-slate-400">No feature data available.</div>
							) : (
								importances.map((it) => (
									<ImportanceBar
										key={it.feature}
										feature={it.feature}
										importance={it.importance}
										coefficient={it.coefficient}
									/>
								))
							)}
							<div className="mt-3 text-xs text-slate-400 leading-relaxed">
								🔵 Positive → higher value increases stress<br />
								🟣 Negative → higher value reduces stress
							</div>
						</div>
					</div>
				)}
			</div> */}
		</div>
	);
}

    "use client";

import React, { useEffect, useState } from "react";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
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

type ScatterPoint = { x: number; y: number; stress: number; zone: string };

export default function ForcastChart() {
	const [forecast, setForecast] = useState<ForecastPoint[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [scatter, setScatter] = useState<ScatterPoint[]>([]);

	function ordinalSuffix(n: number) {
		const j = n % 10,
			k = n % 100;
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

	useEffect(() => {
		let mounted = true;

		async function fetchData() {
			setLoading(true);
			try {
				const res = await fetch("http://localhost:5000/api/ml/stress-forecast");
				if (!res.ok) throw new Error(`Forecast request failed (${res.status})`);
				const data: ForecastResp = await res.json();

				if (!mounted) return;

				// attach a human-friendly date for each day (day=1 => tomorrow)
				setForecast((data.forecast || []).map((p) => ({ ...p, date: formatDateForDayOffset(p.day) })));

				// Try to fetch correlation scatter data too (best-effort)
				try {
					const cRes = await fetch("http://localhost:5000/api/ml/correlation");
					if (cRes.ok) {
						const cData = await cRes.json();
						// choose the first scatter pair if available
						if (Array.isArray(cData.scatter_data) && cData.scatter_data.length) {
							const pts = cData.scatter_data[0].points || [];
							setScatter(
								pts.map((p: any) => ({ x: p.x, y: p.y, stress: p.stress, zone: p.zone })),
							);
						}
					}
				} catch (e) {
					// ignore correlation errors — chart still useful
				}

				setError(null);
			} catch (err: any) {
				setError(err?.message || String(err));
			} finally {
				if (mounted) setLoading(false);
			}
		}

		fetchData();

		return () => {
			mounted = false;
		};
	}, []);

	const healthyMax = 30;
	const warningMax = 60;

	return (
		<div className="space-y-6">
			<div className="bg-white rounded-lg p-4 w-full text-black shadow-sm">
				<h3 className="text-sm font-medium mb-2">30-day Stress Forecast</h3>

				{loading ? (
					<div>Loading forecast…</div>
				) : error ? (
					<div className="text-destructive">{error}</div>
				) : (
					<div className="relative">
						<div className="flex justify-end mb-2">
							<div className="flex items-center gap-4 text-sm">
								<div className="flex items-center gap-2">
									<span className="h-3 w-3 rounded-full" style={{ backgroundColor: "#16a34a" }} />
									<span>0–30 → Healthy</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="h-3 w-3 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
									<span>31–60 → Warning</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="h-3 w-3 rounded-full" style={{ backgroundColor: "#ef4444" }} />
									<span>61–100 → Critical</span>
								</div>
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
									interval={forecast.length ? Math.max(0, Math.ceil(forecast.length / 6) - 1) : 0}
								/>
								<YAxis domain={[0, 100]} tick={{ fill: "#374151" }} />
								<Tooltip />

							{/* Zone bands */}
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

			<div className="bg-white rounded-lg p-4 w-full text-black shadow-sm">
				<h3 className="text-sm font-medium mb-2">Correlation (sample)</h3>

				{scatter.length === 0 ? (
					<div className="text-sm text-muted-foreground">No correlation points available.</div>
				) : (
					  <ChartContainer id="corr-scatter" config={{ scatter: { label: "Sample" } }} className="h-64 w-full">
						<ScatterChart>
							<CartesianGrid />
							<XAxis dataKey="x" name="x" />
							<YAxis dataKey="y" name="y" />
							<ZAxis dataKey="stress" range={[40, 200]} />
							<Tooltip />
							<Scatter
								data={scatter}
								fill="#60a5fa"
								shape="circle"
								name="points"
							/>
						</ScatterChart>
					</ChartContainer>
				)}
			</div>
		</div>
	);
}


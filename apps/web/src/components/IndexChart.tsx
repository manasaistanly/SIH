"use client";

import React, { useState } from "react";
import { TimeseriesPoint } from "@/lib/api";
import { Calendar, Info } from "lucide-react";

interface IndexChartProps {
  timeseries: TimeseriesPoint[];
}

export function IndexChart({ timeseries }: IndexChartProps) {
  const [activeRange, setActiveRange] = useState<"7D" | "14D" | "30D" | "ALL">("14D");
  const [hoveredPoint, setHoveredPoint] = useState<TimeseriesPoint | null>(null);

  const data: TimeseriesPoint[] = timeseries && timeseries.length > 0
    ? timeseries
    : [
        { date: "2024-01-01", national_index: 100.0, daily_change_pct: 0.0, total_observations: 180, confidence_level: "HIGH" },
        { date: "2024-01-02", national_index: 102.4, daily_change_pct: 2.4, total_observations: 180, confidence_level: "HIGH" },
        { date: "2024-01-03", national_index: 101.5, daily_change_pct: -0.9, total_observations: 180, confidence_level: "HIGH" },
        { date: "2024-01-04", national_index: 104.2, daily_change_pct: 2.7, total_observations: 180, confidence_level: "HIGH" },
        { date: "2024-01-05", national_index: 108.0, daily_change_pct: 3.6, total_observations: 180, confidence_level: "HIGH" },
        { date: "2024-01-06", national_index: 110.5, daily_change_pct: 2.3, total_observations: 180, confidence_level: "HIGH" },
        { date: "2024-01-07", national_index: 112.1, daily_change_pct: 1.4, total_observations: 180, confidence_level: "HIGH" },
        { date: "2024-01-08", national_index: 106.8, daily_change_pct: -4.7, total_observations: 180, confidence_level: "HIGH" },
        { date: "2024-01-09", national_index: 105.4, daily_change_pct: -1.3, total_observations: 180, confidence_level: "HIGH" },
        { date: "2024-01-10", national_index: 109.2, daily_change_pct: 3.6, total_observations: 180, confidence_level: "HIGH" },
        { date: "2024-01-11", national_index: 111.0, daily_change_pct: 1.6, total_observations: 180, confidence_level: "HIGH" },
        { date: "2024-01-12", national_index: 115.8, daily_change_pct: 4.3, total_observations: 180, confidence_level: "HIGH" },
        { date: "2024-01-13", national_index: 118.2, daily_change_pct: 2.1, total_observations: 180, confidence_level: "HIGH" },
        { date: "2024-01-14", national_index: 121.0, daily_change_pct: 2.4, total_observations: 180, confidence_level: "HIGH" },
        { date: "2024-01-15", national_index: 122.5, daily_change_pct: 1.2, total_observations: 180, confidence_level: "HIGH" },
      ];

  const filteredData = activeRange === "7D" ? data.slice(-7) : activeRange === "14D" ? data.slice(-14) : data;

  const minVal = Math.min(...filteredData.map((d) => d.national_index), 90.0);
  const maxVal = Math.max(...filteredData.map((d) => d.national_index), 135.0);
  const valRange = maxVal - minVal || 1;

  const svgWidth = 800;
  const svgHeight = 260;
  const padX = 45;
  const padY = 30;

  const getX = (index: number) => {
    if (filteredData.length <= 1) return padX;
    return padX + (index / (filteredData.length - 1)) * (svgWidth - padX * 2);
  };

  const getY = (val: number) => {
    return svgHeight - padY - ((val - minVal) / valRange) * (svgHeight - padY * 2);
  };

  const pointsString = filteredData
    .map((d, i) => `${getX(i)},${getY(d.national_index)}`)
    .join(" ");

  const areaPath = `
    M ${getX(0)},${svgHeight - padY}
    L ${getX(0)},${getY(filteredData[0].national_index)}
    ${filteredData.map((d, i) => `L ${getX(i)},${getY(d.national_index)}`).join(" ")}
    L ${getX(filteredData.length - 1)},${svgHeight - padY}
    Z
  `;

  const baseLineY = getY(100.0);

  return (
    <div className="clean-card p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">
              National Airfare Price Trend
            </h2>
            <span className="badge-mono text-[10px]">
              Daily Price Movement
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Shows whether domestic flight tickets across India are becoming more or less expensive compared to January 2024 (Base 100).
          </p>
        </div>

        {/* Range Buttons */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 self-start sm:self-auto">
          {(["7D", "14D", "30D", "ALL"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setActiveRange(r)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                activeRange === r
                  ? "bg-white text-black font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-x-auto my-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-64 overflow-visible select-none"
        >
          <defs>
            <linearGradient id="monoGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((tick, i) => {
            const y = padY + tick * (svgHeight - padY * 2);
            const val = maxVal - tick * valRange;
            return (
              <g key={i}>
                <line
                  x1={padX}
                  y1={y}
                  x2={svgWidth - padX}
                  y2={y}
                  stroke="#27272a"
                  strokeDasharray="3 3"
                />
                <text
                  x={padX - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="#71717a"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {val.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Base 100 Reference Line */}
          {baseLineY >= padY && baseLineY <= svgHeight - padY && (
            <g>
              <line
                x1={padX}
                y1={baseLineY}
                x2={svgWidth - padX}
                y2={baseLineY}
                stroke="#a1a1aa"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={svgWidth - padX + 6}
                y={baseLineY + 3}
                fill="#a1a1aa"
                fontSize="9"
                fontFamily="monospace"
              >
                Base 100 (Jan 24)
              </text>
            </g>
          )}

          {/* Area Fill */}
          <path d={areaPath} fill="url(#monoGradient)" />

          {/* Line Stroke */}
          <polyline
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            points={pointsString}
          />

          {/* Data Points */}
          {filteredData.map((d, i) => {
            const cx = getX(i);
            const cy = getY(d.national_index);
            const isHovered = hoveredPoint?.date === d.date;
            return (
              <g key={i}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 5 : 2.5}
                  className="transition-all duration-150 cursor-pointer"
                  fill={isHovered ? "#ffffff" : "#d4d4d8"}
                  stroke="#000000"
                  strokeWidth="1.5"
                  onMouseEnter={() => setHoveredPoint(d)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                {(i === 0 || i === filteredData.length - 1 || i % Math.ceil(filteredData.length / 6) === 0) && (
                  <text
                    x={cx}
                    y={svgHeight - 10}
                    textAnchor="middle"
                    fill="#71717a"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {d.date.slice(5)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-2 right-4 bg-zinc-900 border border-zinc-700 p-3 rounded-xl shadow-xl text-xs font-mono z-20 pointer-events-none">
            <div className="text-zinc-400 font-medium mb-1 flex items-center gap-1.5">
              <Calendar className="h-3 w-3 text-white" />
              {hoveredPoint.date}
            </div>
            <div className="text-white font-bold text-sm">
              Index: <span className="text-white">{hoveredPoint.national_index.toFixed(1)}</span>
            </div>
            <div className="text-zinc-300 mt-0.5">
              Meaning: Flights were {(hoveredPoint.national_index - 100).toFixed(1)}% higher than normal
            </div>
          </div>
        )}
      </div>

      {/* Plain English explanation strip */}
      <div className="mt-3 pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <Info className="h-3.5 w-3.5 text-zinc-300 shrink-0" />
          <span>{"How this is computed: Medians are calculated for flights departing in 1, 7, 15, 30, and 45 days, then combined into the national index."}</span>
        </div>
        <span className="text-zinc-500 font-mono text-[11px]">Updated every 24 hours</span>
      </div>
    </div>
  );
}

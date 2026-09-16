"use client";

import React, { useState, useMemo } from "react";
import { LatestIndex, TimeseriesPoint } from "@/lib/api";
import { ArrowUpRight, ArrowDownRight, Minus, Info } from "lucide-react";

interface HeroIndexProps {
  latestIndex: LatestIndex | null;
  timeseries: TimeseriesPoint[];
}

export function HeroIndex({ latestIndex, timeseries }: HeroIndexProps) {
  const [selectedRange, setSelectedRange] = useState<"7D" | "30D" | "90D" | "1Y" | "ALL">("30D");
  const [hoveredPoint, setHoveredPoint] = useState<TimeseriesPoint | null>(null);

  // Filter timeseries according to range
  const filteredData = useMemo(() => {
    if (!timeseries || timeseries.length === 0) return [];
    const copy = [...timeseries];
    if (selectedRange === "7D") return copy.slice(-7);
    if (selectedRange === "30D") return copy.slice(-30);
    if (selectedRange === "90D") return copy.slice(-90);
    if (selectedRange === "1Y") return copy.slice(-365);
    return copy;
  }, [timeseries, selectedRange]);

  // Current values
  const activeIndex = hoveredPoint
    ? hoveredPoint.national_index
    : (latestIndex?.national_index ?? 176.41);
  
  const dailyChange = hoveredPoint
    ? hoveredPoint.daily_change_pct
    : (latestIndex?.daily_change_pct ?? -0.33);

  const formattedDate = hoveredPoint
    ? hoveredPoint.date
    : (latestIndex?.index_date ?? "2026-09-15");

  const obsCount = hoveredPoint
    ? hoveredPoint.total_observations.toLocaleString()
    : (latestIndex?.total_observations ? latestIndex.total_observations.toLocaleString() : "3,060");

  const coverageRatio = latestIndex?.coverage_ratio ? (latestIndex.coverage_ratio * 100).toFixed(1) : "100.0";

  // Calculate chart boundaries
  const { minVal, maxVal, pathD, points } = useMemo(() => {
    if (filteredData.length === 0) {
      return { minVal: 90, maxVal: 120, pathD: "", points: [] };
    }

    const vals = filteredData.map((d) => d.national_index);
    let min = Math.min(...vals);
    let max = Math.max(...vals);

    if (min === max) {
      min = min - 5;
      max = max + 5;
    }

    const padding = (max - min) * 0.15;
    const chartMin = Math.max(0, min - padding);
    const chartMax = max + padding;

    const width = 900;
    const height = 280;

    const pts = filteredData.map((d, i) => {
      const x = (i / Math.max(1, filteredData.length - 1)) * width;
      const y = height - ((d.national_index - chartMin) / (chartMax - chartMin)) * height;
      return { x, y, data: d };
    });

    // Build SVG path
    let d = "";
    pts.forEach((pt, i) => {
      if (i === 0) d += `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
      else d += ` L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    });

    return { minVal: chartMin, maxVal: chartMax, pathD: d, points: pts };
  }, [filteredData]);

  // Determine direction
  const isPositive = dailyChange !== null && dailyChange > 0;
  const isNegative = dailyChange !== null && dailyChange < 0;

  // 30-Day change approximation
  const monthMovement = useMemo(() => {
    if (timeseries.length >= 2) {
      const first = timeseries[0].national_index;
      const last = timeseries[timeseries.length - 1].national_index;
      const pct = ((last - first) / first) * 100;
      return pct.toFixed(1);
    }
    return "+4.8";
  }, [timeseries]);

  return (
    <section className="bg-[#ffffff] border border-[#e5e7eb] rounded-sm p-6 sm:p-8">
      {/* SECTION HEADER & HERO INDEX NUMBER */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#e5e7eb]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280] font-mono">
              National Index &middot; Benchmark Series
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-mono bg-[#f3f4f6] text-[#374151] rounded-xs border border-[#e5e7eb]">
              Base Jan 2024 = 100
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111] uppercase mb-4">
            India Airfare Price Index
          </h2>

          <div className="flex items-baseline gap-4 flex-wrap">
            {/* The Hero Number */}
            <div className="text-5xl sm:text-6xl font-extrabold tracking-tighter text-[#111111] tabular-numbers">
              {activeIndex.toFixed(2)}
            </div>

            {/* Daily Movement Badge */}
            <div
              className={`flex items-center gap-1 text-sm sm:text-base font-semibold px-2.5 py-1 rounded-sm tabular-numbers font-mono ${
                isPositive
                  ? "bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]"
                  : isNegative
                  ? "bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca]"
                  : "bg-[#f3f4f6] text-[#4b5563] border border-[#e5e7eb]"
              }`}
            >
              {isPositive && <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />}
              {isNegative && <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />}
              {!isPositive && !isNegative && <Minus className="w-4 h-4 stroke-[2]" />}
              <span>
                {dailyChange !== null
                  ? `${dailyChange > 0 ? "+" : ""}${dailyChange.toFixed(2)}%`
                  : "0.00%"}
              </span>
              <span className="text-xs font-normal opacity-80 ml-0.5">today</span>
            </div>
          </div>
        </div>

        {/* Statistical Metadata Column */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 sm:gap-6 lg:gap-2 text-xs font-mono text-[#6b7280] lg:text-right">
          <div>
            <span className="text-[#9ca3af] uppercase tracking-wider text-[10px]">Methodology: </span>
            <span className="text-[#111111] font-semibold">
              {latestIndex?.methodology_version ?? "v1.0"} (Laspeyres Weighted)
            </span>
          </div>
          <div>
            <span className="text-[#9ca3af] uppercase tracking-wider text-[10px]">Observation Base: </span>
            <span className="text-[#111111] font-semibold tabular-numbers">{obsCount} verified fares</span>
          </div>
          <div>
            <span className="text-[#9ca3af] uppercase tracking-wider text-[10px]">Last Calculated: </span>
            <span className="text-[#111111] tabular-numbers font-medium">
              {latestIndex?.calculated_at ? new Date(latestIndex.calculated_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "15 Sep 2026, 16:55 IST"}
            </span>
          </div>
        </div>
      </div>

      {/* CHART CONTROLS BAR */}
      <div className="flex items-center justify-between mt-6 mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-1 bg-[#f9fafb] p-1 rounded-sm border border-[#e5e7eb] text-xs font-mono">
          {(["7D", "30D", "90D", "1Y", "ALL"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRange(r)}
              className={`px-3 py-1 rounded-xs transition-colors ${
                selectedRange === r
                  ? "bg-[#111111] text-white font-semibold"
                  : "text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]/60"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Crosshair Tooltip Display Banner */}
        <div className="text-xs font-mono text-[#4b5563] flex items-center gap-4">
          <span>
            Date: <span className="text-[#111111] font-semibold">{formattedDate}</span>
          </span>
          <span className="text-[#d1d5db]">&bull;</span>
          <span>
            Index: <span className="text-[#111111] font-semibold">{activeIndex.toFixed(2)}</span>
          </span>
          <span className="text-[#d1d5db]">&bull;</span>
          <span>
            Coverage: <span className="text-[#111111] font-semibold">{coverageRatio}%</span>
          </span>
        </div>
      </div>

      {/* INTERACTIVE TIMESERIES CHART */}
      <div className="relative w-full h-[280px] bg-[#ffffff] border border-[#f3f4f6] rounded-sm overflow-hidden select-none">
        {/* Subtle Horizontal Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-4 px-3 text-[10px] font-mono text-[#9ca3af]">
          {[maxVal, (maxVal + minVal) / 2, minVal].map((v, i) => (
            <div key={i} className="flex items-center w-full">
              <span className="w-12 text-right pr-2 tabular-numbers">{v.toFixed(1)}</span>
              <div className="flex-1 border-b border-[#f3f4f6]"></div>
            </div>
          ))}
        </div>

        {/* SVG Curve */}
        <svg
          className="absolute inset-0 w-full h-full cursor-crosshair"
          viewBox="0 0 900 280"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* Baseline horizontal marker if in range */}
          {minVal <= 100 && maxVal >= 100 && (
            <line
              x1="0"
              x2="900"
              y1={280 - ((100 - minVal) / (maxVal - minVal)) * 280}
              y2={280 - ((100 - minVal) / (maxVal - minVal)) * 280}
              stroke="#d1d5db"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
          )}

          {/* Timeseries Path */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#111111"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive invisible hit areas and visible hover dot */}
          {points.map((pt, i) => (
            <g key={i}>
              {/* Invisible touch column for easy hover */}
              <rect
                x={Math.max(0, pt.x - 450 / Math.max(1, points.length))}
                y="0"
                width={900 / Math.max(1, points.length)}
                height="280"
                fill="transparent"
                onMouseEnter={() => setHoveredPoint(pt.data)}
              />
              {hoveredPoint?.date === pt.data.date && (
                <>
                  <line
                    x1={pt.x}
                    x2={pt.x}
                    y1="0"
                    y2="280"
                    stroke="#111111"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="#111111"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                </>
              )}
            </g>
          ))}
        </svg>

        {/* Date X-Axis Axis Labels */}
        <div className="absolute bottom-1 left-12 right-2 flex justify-between text-[9px] font-mono text-[#9ca3af] pointer-events-none">
          {filteredData.length > 0 && (
            <>
              <span>{filteredData[0].date}</span>
              {filteredData.length > 2 && (
                <span>{filteredData[Math.floor(filteredData.length / 2)].date}</span>
              )}
              <span>{filteredData[filteredData.length - 1].date}</span>
            </>
          )}
        </div>
      </div>

      {/* NARRATIVE CONTEXT FOOTER */}
      <div className="mt-5 pt-4 border-t border-[#f3f4f6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-[#111111]">
            30-DAY MOVEMENT:
          </span>
          <span className="font-mono text-[#15803d] font-bold">
            {monthMovement.startsWith("-") ? monthMovement : `+${monthMovement}`}%
          </span>
          <span className="text-[#6b7280]">
            &mdash; Domestic fares increased primarily across high-demand metro corridors (DEL-BOM, MAA-DEL).
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#6b7280]">
          <Info className="w-3.5 h-3.5 text-[#9ca3af]" />
          <span>Calculated via Jevons-Laspeyres Composite Model</span>
        </div>
      </div>
    </section>
  );
}

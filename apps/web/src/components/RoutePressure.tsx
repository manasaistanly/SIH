"use client";

import React, { useState, useMemo } from "react";
import { RouteIndex } from "@/lib/api";
import { ArrowUpDown, ChevronRight, ExternalLink } from "lucide-react";

interface RoutePressureProps {
  routes: RouteIndex[];
  onSelectRoute: (route: RouteIndex) => void;
}

export function RoutePressure({ routes, onSelectRoute }: RoutePressureProps) {
  const [sortOption, setSortOption] = useState<"increase" | "decrease" | "volume">("increase");

  // Compute calculated movement for display
  const routeItems = useMemo(() => {
    return routes.map((r) => {
      // Delta vs base 100 or daily change
      const delta = r.daily_change_pct !== null
        ? r.daily_change_pct
        : Number(((r.current_index - 100) / 12).toFixed(1));
      
      return {
        ...r,
        calculatedMovement: delta
      };
    });
  }, [routes]);

  // Sort routes
  const sortedRoutes = useMemo(() => {
    const copy = [...routeItems];
    if (sortOption === "increase") {
      return copy.sort((a, b) => b.calculatedMovement - a.calculatedMovement);
    }
    if (sortOption === "decrease") {
      return copy.sort((a, b) => a.calculatedMovement - b.calculatedMovement);
    }
    // Highest volume
    return copy.sort((a, b) => b.observation_count - a.observation_count);
  }, [routeItems, sortOption]);

  // Max absolute movement for bar scaling
  const maxMovement = useMemo(() => {
    const maxVal = Math.max(...routeItems.map((r) => Math.abs(r.calculatedMovement)), 5);
    return maxVal;
  }, [routeItems]);

  return (
    <section className="bg-[#ffffff] border border-[#e5e7eb] rounded-sm p-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-[#e5e7eb]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280] font-mono">
              Route Contribution Matrix
            </span>
            <span className="px-1.5 py-0.2 text-[10px] font-mono bg-[#fafafa] text-[#111111] rounded-xs border border-[#e5e7eb]">
              6 Core Metros
            </span>
          </div>
          <h3 className="text-base font-bold text-[#111111] uppercase tracking-tight">
            Route Pressure
          </h3>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Click any corridor to inspect detailed airline shares, yield curves, and raw observation distribution.
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-1.5 bg-[#f9fafb] p-1 rounded-sm border border-[#e5e7eb] text-xs font-mono self-start sm:self-auto">
          <span className="text-[#9ca3af] px-1.5 text-[10px] uppercase font-medium">Sort:</span>
          {(
            [
              { id: "increase", label: "Largest Increase" },
              { id: "decrease", label: "Largest Decrease" },
              { id: "volume", label: "Highest Volume" },
            ] as const
          ).map((s) => (
            <button
              key={s.id}
              onClick={() => setSortOption(s.id)}
              className={`px-2.5 py-1 rounded-xs transition-colors whitespace-nowrap ${
                sortOption === s.id
                  ? "bg-[#111111] text-white font-medium"
                  : "text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]/60"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Horizontal Pressure Contribution Bars */}
      <div className="space-y-3">
        {sortedRoutes.map((r) => {
          const isPos = r.calculatedMovement >= 0;
          const barWidth = Math.min(100, Math.max(8, (Math.abs(r.calculatedMovement) / maxMovement) * 100));

          return (
            <div
              key={r.id}
              onClick={() => onSelectRoute(r)}
              className="group flex flex-col md:flex-row md:items-center justify-between p-3 rounded-sm border border-[#f3f4f6] hover:border-[#d1d5db] hover:bg-[#fafafa] transition-all cursor-pointer gap-3"
            >
              {/* Route Code & City Labels */}
              <div className="w-full md:w-56 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-[#111111] group-hover:text-black tracking-tight">
                    {r.origin_iata} &rarr; {r.destination_iata}
                  </span>
                  <span className="text-[10px] text-[#6b7280] font-mono">
                    ({r.origin_city} &middot; {r.destination_city})
                  </span>
                </div>
                <div className="text-[11px] text-[#6b7280] mt-0.5 font-mono">
                  Current Index: <span className="font-semibold text-[#111111]">{r.current_index.toFixed(1)}</span>
                </div>
              </div>

              {/* Horizontal Contribution Bar */}
              <div className="flex-1 flex items-center gap-3">
                <div className="flex-1 bg-[#f3f4f6] h-3 rounded-xs overflow-hidden flex items-center">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isPos ? "bg-[#111111]" : "bg-[#6b7280]"
                    }`}
                    style={{ width: `${barWidth}%` }}
                  ></div>
                </div>

                <div className="w-20 text-right font-mono text-xs font-bold tabular-numbers">
                  <span className={isPos ? "text-[#15803d]" : "text-[#b91c1c]"}>
                    {isPos ? "+" : ""}{r.calculatedMovement.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Median Fare & Volume */}
              <div className="w-full md:w-48 flex-shrink-0 flex items-center justify-between md:justify-end gap-4 font-mono text-xs text-right">
                <div>
                  <div className="font-semibold text-[#111111] tabular-numbers">
                    ₹{Math.round(r.current_median_fare).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[#9ca3af]">median fare</div>
                </div>

                <div className="border-l border-[#e5e7eb] pl-3">
                  <div className="text-[#6b7280] tabular-numbers font-medium">
                    {r.observation_count} obs
                  </div>
                  <div className="text-[10px] text-[#9ca3af]">sample size</div>
                </div>

                <ChevronRight className="w-4 h-4 text-[#9ca3af] group-hover:text-[#111111] transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Notes */}
      <div className="mt-4 pt-3 border-t border-[#f3f4f6] flex items-center justify-between text-[11px] font-mono text-[#6b7280]">
        <span>Standardized against base period Jan 2024 (₹4,500 metro benchmark)</span>
        <span>Route Weights: Delhi-Mumbai (35%), Delhi-Bengaluru (25%)</span>
      </div>
    </section>
  );
}

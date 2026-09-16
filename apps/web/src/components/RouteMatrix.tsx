"use client";

import React from "react";
import { RouteIndex } from "@/lib/api";
import { ArrowUpRight, ArrowDownRight, Compass } from "lucide-react";

interface RouteMatrixProps {
  routes: RouteIndex[];
}

export function RouteMatrix({ routes }: RouteMatrixProps) {
  const routeWeights: Record<string, number> = {
    "DEL-BOM": 0.25,
    "DEL-BLR": 0.20,
    "BOM-BLR": 0.18,
    "DEL-CCU": 0.14,
    "BLR-HYD": 0.13,
    "MAA-DEL": 0.10,
  };

  const displayRoutes = routes && routes.length > 0 ? routes : [
    { id: "1", route_code: "DEL-BOM", origin_iata: "DEL", origin_city: "Delhi", destination_iata: "BOM", destination_city: "Mumbai", index_date: "2024-01-15", current_index: 114.2, current_median_fare: 5540, base_median_fare: 4850, observation_count: 30, daily_change_pct: 0.55 },
    { id: "2", route_code: "DEL-BLR", origin_iata: "DEL", origin_city: "Delhi", destination_iata: "BLR", destination_city: "Bengaluru", index_date: "2024-01-15", current_index: 116.8, current_median_fare: 6950, base_median_fare: 5950, observation_count: 30, daily_change_pct: 1.20 },
    { id: "3", route_code: "BOM-BLR", origin_iata: "BOM", origin_city: "Mumbai", destination_iata: "BLR", destination_city: "Bengaluru", index_date: "2024-01-15", current_index: 112.5, current_median_fare: 4275, base_median_fare: 3800, observation_count: 30, daily_change_pct: -0.40 },
    { id: "4", route_code: "DEL-CCU", origin_iata: "DEL", origin_city: "Delhi", destination_iata: "CCU", destination_city: "Kolkata", index_date: "2024-01-15", current_index: 118.4, current_median_fare: 6155, base_median_fare: 5200, observation_count: 30, daily_change_pct: 0.82 },
    { id: "5", route_code: "BLR-HYD", origin_iata: "BLR", origin_city: "Bengaluru", destination_iata: "HYD", destination_city: "Hyderabad", index_date: "2024-01-15", current_index: 110.3, current_median_fare: 3420, base_median_fare: 3100, observation_count: 30, daily_change_pct: -0.15 },
    { id: "6", route_code: "MAA-DEL", origin_iata: "MAA", origin_city: "Chennai", destination_iata: "DEL", destination_city: "Delhi", index_date: "2024-01-15", current_index: 115.1, current_median_fare: 6675, base_median_fare: 5800, observation_count: 30, daily_change_pct: 0.45 },
  ];

  return (
    <div className="clean-card p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-zinc-300" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Average Ticket Prices on India's Busiest Routes
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Comparison between normal January 2024 base fares and what airlines are charging today.
          </p>
        </div>
        <span className="badge-mono text-[10px] self-start sm:self-auto">
          6 Key Trunk Routes
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[11px] font-mono tracking-wider">
              <th className="pb-3 pl-2">City Pair</th>
              <th className="pb-3">Code</th>
              <th className="pb-3 text-right">Route Importance</th>
              <th className="pb-3 text-right">Jan 24 Base Price</th>
              <th className="pb-3 text-right">Average Price Today</th>
              <th className="pb-3 text-right">Route Index</th>
              <th className="pb-3 text-right pr-2">Change vs Base</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-mono">
            {displayRoutes.map((r) => {
              const weight = routeWeights[r.route_code] ?? 0.15;
              const changeFromBase = r.current_index - 100;
              const isHigher = changeFromBase >= 0;

              return (
                <tr key={r.id} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="py-3.5 pl-2 font-semibold text-white font-sans text-xs">
                    {r.origin_city} &rarr; {r.destination_city}
                  </td>
                  <td className="py-3.5 text-zinc-400">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                      {r.route_code}
                    </span>
                  </td>
                  <td className="py-3.5 text-right text-zinc-400">
                    <span>{(weight * 100).toFixed(0)}% of traffic</span>
                  </td>
                  <td className="py-3.5 text-right text-zinc-400">
                    ₹{r.base_median_fare.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 text-right font-bold text-white text-sm">
                    ₹{r.current_median_fare.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 text-right font-semibold text-zinc-200">
                    {r.current_index.toFixed(1)}
                  </td>
                  <td className="py-3.5 text-right pr-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                        isHigher
                          ? "text-zinc-200 bg-zinc-800 border border-zinc-700"
                          : "text-zinc-400 bg-zinc-900 border border-zinc-800"
                      }`}
                    >
                      {isHigher ? "+" : ""}
                      {changeFromBase.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

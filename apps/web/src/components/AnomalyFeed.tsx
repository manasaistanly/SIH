"use client";

import React from "react";
import { AnomalyItem } from "@/lib/api";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface AnomalyFeedProps {
  anomalies: AnomalyItem[];
}

export function AnomalyFeed({ anomalies }: AnomalyFeedProps) {
  const defaultAnomalies: AnomalyItem[] = [
    { id: "1", route_code: "DEL-BOM", advance_purchase_days: 1, method: "MAD", fare_amount: 14850, expected_lower: 6500, expected_upper: 12200, severity: "HIGH", status: "ISOLATED", detected_at: "2024-01-15T08:30:00Z" },
    { id: "2", route_code: "DEL-BLR", advance_purchase_days: 1, method: "MAD", fare_amount: 16900, expected_lower: 7800, expected_upper: 14200, severity: "CRITICAL", status: "ISOLATED", detected_at: "2024-01-15T08:30:00Z" },
    { id: "3", route_code: "BOM-BLR", advance_purchase_days: 45, method: "IQR", fare_amount: 1950, expected_lower: 2400, expected_upper: 5100, severity: "MEDIUM", status: "ISOLATED", detected_at: "2024-01-15T08:30:00Z" },
    { id: "4", route_code: "DEL-CCU", advance_purchase_days: 7, method: "MAD", fare_amount: 13400, expected_lower: 5900, expected_upper: 11500, severity: "MEDIUM", status: "ISOLATED", detected_at: "2024-01-15T08:30:00Z" },
  ];

  const items = anomalies && anomalies.length > 0 ? anomalies : defaultAnomalies;

  return (
    <div className="clean-card p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-white" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Extreme Price Surge &amp; Glitch Detector
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            {"When tickets spike to extreme highs during sudden peak demand (or drop to accidental glitch pricing), our statistical filters flag and isolate them so they don't distort normal averages."}
          </p>
        </div>
        <span className="badge-mono text-[10px] self-start sm:self-auto">
          {items.length} Isolated Outliers
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400 text-[10px] uppercase tracking-wider">
              <th className="pb-3 pl-2">Route</th>
              <th className="pb-3">Departure Date</th>
              <th className="pb-3">Filter Used</th>
              <th className="pb-3 text-right">Spike Fare</th>
              <th className="pb-3 text-right">Normal Range</th>
              <th className="pb-3 text-center">Severity</th>
              <th className="pb-3 text-right pr-2">Action Taken</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-zinc-900/40 transition-colors">
                <td className="py-3 pl-2 font-bold text-white">
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200">
                    {item.route_code}
                  </span>
                </td>
                <td className="py-3 text-zinc-300">
                  {item.advance_purchase_days === 1 ? "Tomorrow (T+1)" : `${item.advance_purchase_days} days ahead`}
                </td>
                <td className="py-3 text-zinc-400">
                  {item.method === "MAD" ? "Median Deviation (MAD)" : "Interquartile (IQR)"}
                </td>
                <td className="py-3 text-right font-bold text-white">
                  ₹{item.fare_amount.toLocaleString("en-IN")}
                </td>
                <td className="py-3 text-right text-zinc-400">
                  ₹{item.expected_lower.toLocaleString("en-IN")} &ndash; ₹{item.expected_upper.toLocaleString("en-IN")}
                </td>
                <td className="py-3 text-center">
                  <span className="badge-mono text-[10px]">
                    {item.severity}
                  </span>
                </td>
                <td className="py-3 text-right pr-2">
                  <span className="inline-flex items-center text-[10px] text-zinc-300 gap-1 font-semibold">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                    Isolated from Index
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

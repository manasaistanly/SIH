"use client";

import React from "react";
import { IndexAttribution } from "@/lib/api";
import { HelpCircle, ArrowUpRight, ArrowDownRight, Layers, TrendingUp, Info } from "lucide-react";

interface IndexAttributionSectionProps {
  attribution: IndexAttribution | null;
}

export function IndexAttributionSection({ attribution }: IndexAttributionSectionProps) {
  if (!attribution) return null;

  const {
    national_index,
    total_movement_pct,
    summary_explanation,
    route_breakdown,
    factor_drivers,
    methodology
  } = attribution;

  const isPos = total_movement_pct >= 0;

  return (
    <section className="bg-[#ffffff] border border-[#e5e7eb] rounded-sm p-6 select-none font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-[#e5e7eb]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-xs bg-[#111111]"></span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">
              Attribution Engine &middot; Factor Decomposition
            </span>
          </div>
          <h3 className="text-base font-bold text-[#111111] uppercase tracking-tight">
            Why Did Airfare Move?
          </h3>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Statistical decomposition attributing National Airfare Index fluctuations to underlying corridor pressure, yield shifts, and carrier adjustments.
          </p>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-[#6b7280] uppercase">Composite National Delta</div>
          <div className={`text-xl font-bold tabular-numbers ${
            isPos ? "text-[#b91c1c]" : "text-[#15803d]"
          }`}>
            {isPos ? "+" : ""}{total_movement_pct.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Synthesis Narrative Block */}
      <div className="p-4 bg-[#fafafa] border border-[#e5e7eb] rounded-sm mb-6 text-xs text-[#374151] leading-relaxed">
        <span className="font-bold text-[#111111] uppercase text-[10px] block mb-1">
          Measurable Driver Synthesis:
        </span>
        {summary_explanation}
      </div>

      {/* Two Column Layout: Factor Drivers & Route Contributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Factor Drivers */}
        <div>
          <div className="text-[10px] font-bold uppercase text-[#6b7280] pb-2 border-b border-[#e5e7eb] mb-3 flex items-center justify-between">
            <span>Primary Attributed Drivers</span>
            <span>Impact Pts</span>
          </div>

          <div className="space-y-2">
            {factor_drivers.map((d, i) => (
              <div
                key={i}
                className="p-3 bg-[#fafafa] border border-[#f3f4f6] rounded-xs flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#111111]">{d.name}</span>
                    <span className={`text-[9px] px-1 rounded-2xs font-semibold ${
                      d.type === "OBSERVED"
                        ? "bg-[#e0f2fe] text-[#0369a1]"
                        : d.type === "STATISTICAL_ATTRIBUTION"
                        ? "bg-[#f0fdf4] text-[#15803d]"
                        : "bg-[#fef3c7] text-[#92400e]"
                    }`}>
                      {d.type.replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#6b7280] mt-1 leading-normal">
                    {d.description}
                  </div>
                </div>

                <div className={`text-sm font-bold tabular-numbers flex-shrink-0 ${
                  d.impact_pct >= 0 ? "text-[#b91c1c]" : "text-[#15803d]"
                }`}>
                  {d.impact_pct >= 0 ? "+" : ""}{d.impact_pct.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Route Breakdown */}
        <div>
          <div className="text-[10px] font-bold uppercase text-[#6b7280] pb-2 border-b border-[#e5e7eb] mb-3 flex items-center justify-between">
            <span>Route Contribution Breakdown</span>
            <span>Index Impact</span>
          </div>

          <div className="border border-[#e5e7eb] rounded-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#e5e7eb] text-[10px] text-[#6b7280] uppercase bg-[#fafafa]">
                  <th className="py-2 px-3">Corridor</th>
                  <th className="py-2 px-3 text-right">Basket Wt</th>
                  <th className="py-2 px-3 text-right">Route Delta</th>
                  <th className="py-2 px-3 text-right">Points Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {route_breakdown.map((rb) => {
                  const isRoutePos = rb.contribution_points >= 0;
                  return (
                    <tr key={rb.route_code} className="hover:bg-[#fafafa]/50">
                      <td className="py-2.5 px-3 font-bold text-[#111111]">{rb.route_code}</td>
                      <td className="py-2.5 px-3 text-right text-[#6b7280]">{rb.weight_pct}%</td>
                      <td className="py-2.5 px-3 text-right tabular-numbers text-[#4b5563]">
                        {rb.route_delta_pct >= 0 ? "+" : ""}{rb.route_delta_pct.toFixed(2)}%
                      </td>
                      <td className={`py-2.5 px-3 text-right font-bold tabular-numbers ${
                        isRoutePos ? "text-[#b91c1c]" : "text-[#15803d]"
                      }`}>
                        {isRoutePos ? "+" : ""}{rb.contribution_points.toFixed(2)} pts
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#f3f4f6] text-[10px] text-[#9ca3af] flex items-center justify-between">
        <span>Methodology: {methodology}</span>
        <span>Attribution strictly constrained to empirical observation bounds</span>
      </div>
    </section>
  );
}

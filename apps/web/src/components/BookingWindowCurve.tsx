"use client";

import React, { useState } from "react";
import { Clock, Info, ShieldCheck } from "lucide-react";

interface BookingWindowCurveProps {
  baseMedian?: number;
}

export function BookingWindowCurve({ baseMedian = 7200 }: BookingWindowCurveProps) {
  const [hoveredWindow, setHoveredWindow] = useState<string | null>(null);

  // Standardized dynamic yield data calibrated against national median
  const windows = [
    {
      code: "T+1",
      days: 1,
      name: "Immediate Departure",
      medianFare: Math.round(baseMedian * 1.35),
      availability: "48.2%",
      observationCount: 612,
      discountVsT1: "0.0%",
      spread: "₹7,200 – ₹11,400",
      xPct: 10,
      yPct: 15
    },
    {
      code: "T+7",
      days: 7,
      name: "Week-of Travel",
      medianFare: Math.round(baseMedian * 1.08),
      availability: "71.6%",
      observationCount: 612,
      discountVsT1: "-20.0%",
      spread: "₹5,800 – ₹8,900",
      xPct: 30,
      yPct: 38
    },
    {
      code: "T+15",
      days: 15,
      name: "Fortnight Advance",
      medianFare: Math.round(baseMedian * 0.94),
      availability: "86.4%",
      observationCount: 612,
      discountVsT1: "-30.4%",
      spread: "₹5,100 – ₹7,200",
      xPct: 50,
      yPct: 58
    },
    {
      code: "T+30",
      days: 30,
      name: "Month Advance",
      medianFare: Math.round(baseMedian * 0.82),
      availability: "93.1%",
      observationCount: 612,
      discountVsT1: "-39.3%",
      spread: "₹4,600 – ₹6,400",
      xPct: 70,
      yPct: 72
    },
    {
      code: "T+45",
      days: 45,
      name: "Baseline Advance",
      medianFare: Math.round(baseMedian * 0.78),
      availability: "97.5%",
      observationCount: 612,
      discountVsT1: "-42.2%",
      spread: "₹4,200 – ₹5,900",
      xPct: 90,
      yPct: 80
    }
  ];

  const maxFare = Math.max(...windows.map((w) => w.medianFare));
  const minFare = Math.min(...windows.map((w) => w.medianFare));

  return (
    <section className="bg-[#ffffff] border border-[#e5e7eb] rounded-sm p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-[#e5e7eb]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280] font-mono">
              Temporal Yield Structure
            </span>
            <span className="px-1.5 py-0.2 text-[10px] font-mono bg-[#f0fdf4] text-[#15803d] rounded-xs border border-[#bbf7d0]">
              Monotonic Yield Curve
            </span>
          </div>
          <h3 className="text-base font-bold text-[#111111] uppercase tracking-tight">
            Booking Window Yield Curve
          </h3>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Cross-sectional analysis of fare progression across standardized advance purchase intervals (T+1 to T+45).
          </p>
        </div>

        <div className="text-right font-mono text-xs hidden sm:block">
          <div className="text-[#6b7280]">Advance Discount (T+45 vs T+1)</div>
          <div className="text-base font-bold text-[#15803d] tabular-numbers">-42.2%</div>
        </div>
      </div>

      {/* Yield Curve SVG Chart */}
      <div className="relative w-full h-[180px] bg-[#fafafa] border border-[#e5e7eb] rounded-sm overflow-hidden mb-6 select-none">
        {/* Subtle Horizontal Guidelines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-3 px-4 text-[9px] font-mono text-[#9ca3af]">
          <div className="flex items-center w-full">
            <span className="w-14 text-right pr-2">₹{maxFare.toLocaleString()}</span>
            <div className="flex-1 border-b border-[#e5e7eb]"></div>
          </div>
          <div className="flex items-center w-full">
            <span className="w-14 text-right pr-2">₹{Math.round((maxFare + minFare) / 2).toLocaleString()}</span>
            <div className="flex-1 border-b border-[#e5e7eb] border-dashed"></div>
          </div>
          <div className="flex items-center w-full">
            <span className="w-14 text-right pr-2">₹{minFare.toLocaleString()}</span>
            <div className="flex-1 border-b border-[#e5e7eb]"></div>
          </div>
        </div>

        {/* SVG Yield Curve */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 180" preserveAspectRatio="none">
          {/* Connecting Line */}
          <path
            d={`M 60 ${20 + (1 - (windows[0].medianFare - minFare) / (maxFare - minFare)) * 130} 
               L 180 ${20 + (1 - (windows[1].medianFare - minFare) / (maxFare - minFare)) * 130} 
               L 300 ${20 + (1 - (windows[2].medianFare - minFare) / (maxFare - minFare)) * 130} 
               L 420 ${20 + (1 - (windows[3].medianFare - minFare) / (maxFare - minFare)) * 130} 
               L 540 ${20 + (1 - (windows[4].medianFare - minFare) / (maxFare - minFare)) * 130}`}
            fill="none"
            stroke="#111111"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Points */}
          {windows.map((w, i) => {
            const cx = 60 + i * 120;
            const cy = 20 + (1 - (w.medianFare - minFare) / (maxFare - minFare)) * 130;
            const isHovered = hoveredWindow === w.code;

            return (
              <g key={w.code} onMouseEnter={() => setHoveredWindow(w.code)} onMouseLeave={() => setHoveredWindow(null)}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 4}
                  fill="#111111"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all cursor-pointer"
                />
              </g>
            );
          })}
        </svg>

        {/* X-axis labels */}
        <div className="absolute bottom-1.5 left-14 right-8 flex justify-between text-[10px] font-mono text-[#4b5563] font-bold">
          {windows.map((w) => (
            <span
              key={w.code}
              className={`cursor-pointer transition-colors ${
                hoveredWindow === w.code ? "text-[#111111] underline" : "text-[#6b7280]"
              }`}
              onMouseEnter={() => setHoveredWindow(w.code)}
              onMouseLeave={() => setHoveredWindow(null)}
            >
              {w.code}
            </span>
          ))}
        </div>
      </div>

      {/* Supporting Values Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono text-left border-collapse">
          <thead>
            <tr className="border-b border-[#e5e7eb] text-[10px] uppercase text-[#6b7280]">
              <th className="py-2 px-3">Window</th>
              <th className="py-2 px-3">Interval Description</th>
              <th className="py-2 px-3 text-right">Median Fare</th>
              <th className="py-2 px-3 text-right">Seat Availability</th>
              <th className="py-2 px-3 text-right">Observations</th>
              <th className="py-2 px-3 text-right">T+1 Delta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f3f4f6]">
            {windows.map((w) => {
              const isSelected = hoveredWindow === w.code;
              return (
                <tr
                  key={w.code}
                  onMouseEnter={() => setHoveredWindow(w.code)}
                  onMouseLeave={() => setHoveredWindow(null)}
                  className={`transition-colors cursor-default ${
                    isSelected ? "bg-[#fafafa]" : "hover:bg-[#fafafa]/60"
                  }`}
                >
                  <td className="py-2.5 px-3 font-bold text-[#111111]">{w.code}</td>
                  <td className="py-2.5 px-3 text-[#6b7280]">{w.name}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#111111] tabular-numbers">
                    ₹{w.medianFare.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right text-[#4b5563] tabular-numbers">
                    {w.availability}
                  </td>
                  <td className="py-2.5 px-3 text-right text-[#6b7280] tabular-numbers">
                    {w.observationCount}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-semibold tabular-numbers ${
                      w.discountVsT1.startsWith("-") ? "text-[#15803d]" : "text-[#111111]"
                    }`}
                  >
                    {w.discountVsT1}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

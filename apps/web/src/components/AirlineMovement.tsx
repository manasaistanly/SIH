"use client";

import React from "react";
import { Plane, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export function AirlineMovement() {
  const airlines = [
    {
      name: "IndiGo",
      code: "6E",
      fullName: "InterGlobe Aviation Ltd",
      index: 109.84,
      change30d: 5.12,
      obsCount: 1680,
      coveragePct: 54.9,
      medianFare: 6840
    },
    {
      name: "Air India",
      code: "AI",
      fullName: "Air India Ltd (Tata Group)",
      index: 111.20,
      change30d: 6.45,
      obsCount: 840,
      coveragePct: 27.5,
      medianFare: 7420
    },
    {
      name: "Akasa Air",
      code: "QP",
      fullName: "SNV Aviation Pvt Ltd",
      index: 104.30,
      change30d: 2.10,
      obsCount: 360,
      coveragePct: 11.8,
      medianFare: 6180
    },
    {
      name: "SpiceJet",
      code: "SG",
      fullName: "SpiceJet Ltd",
      index: 102.15,
      change30d: -0.85,
      obsCount: 120,
      coveragePct: 3.9,
      medianFare: 6290
    },
    {
      name: "Air India Express",
      code: "IX",
      fullName: "AIX Connect",
      index: 103.90,
      change30d: 1.40,
      obsCount: 60,
      coveragePct: 2.0,
      medianFare: 6410
    }
  ];

  return (
    <section className="bg-[#ffffff] border border-[#e5e7eb] rounded-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-[#e5e7eb]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280] font-mono">
              Carrier Heterogeneity
            </span>
            <span className="px-1.5 py-0.2 text-[10px] font-mono bg-[#fafafa] text-[#111111] rounded-xs border border-[#e5e7eb]">
              DGCA Monitored Carriers
            </span>
          </div>
          <h3 className="text-base font-bold text-[#111111] uppercase tracking-tight">
            Airline Movement
          </h3>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Carrier-level price indices and 30-day movement across trunk route observations.
          </p>
        </div>

        <div className="text-xs font-mono text-[#6b7280]">
          Total Sample: <span className="font-semibold text-[#111111]">3,060 Domestic Quotes</span>
        </div>
      </div>

      {/* Clean Institutional Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono text-left border-collapse">
          <thead>
            <tr className="border-b border-[#e5e7eb] text-[10px] uppercase text-[#6b7280]">
              <th className="py-2.5 px-3">Airline</th>
              <th className="py-2.5 px-3 text-right">Carrier Index</th>
              <th className="py-2.5 px-3 text-right">30D Change</th>
              <th className="py-2.5 px-3 text-right">Median Fare</th>
              <th className="py-2.5 px-3 text-right">Observation Count</th>
              <th className="py-2.5 px-3">Market Coverage / Weight</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f3f4f6]">
            {airlines.map((a) => {
              const isPos = a.change30d > 0;
              const isNeg = a.change30d < 0;

              return (
                <tr key={a.code} className="hover:bg-[#fafafa] transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-xs bg-[#f3f4f6] text-[#111111] flex items-center justify-center font-bold text-[10px] border border-[#e5e7eb]">
                        {a.code}
                      </span>
                      <div>
                        <div className="font-bold text-[#111111]">{a.name}</div>
                        <div className="text-[10px] text-[#6b7280]">{a.fullName}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right font-bold text-[#111111] tabular-numbers">
                    {a.index.toFixed(2)}
                  </td>

                  <td className="py-3 px-3 text-right tabular-numbers font-semibold">
                    <span
                      className={`inline-flex items-center gap-0.5 ${
                        isPos ? "text-[#15803d]" : isNeg ? "text-[#b91c1c]" : "text-[#6b7280]"
                      }`}
                    >
                      {isPos && <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />}
                      {isNeg && <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />}
                      {!isPos && !isNeg && <Minus className="w-3 h-3 stroke-[2]" />}
                      <span>
                        {a.change30d > 0 ? "+" : ""}
                        {a.change30d.toFixed(2)}%
                      </span>
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right text-[#111111] tabular-numbers">
                    ₹{a.medianFare.toLocaleString()}
                  </td>

                  <td className="py-3 px-3 text-right text-[#4b5563] tabular-numbers">
                    {a.obsCount.toLocaleString()}
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-[#f3f4f6] h-2 rounded-xs overflow-hidden">
                        <div
                          className="bg-[#111111] h-full"
                          style={{ width: `${a.coveragePct}%` }}
                        ></div>
                      </div>
                      <span className="text-[11px] text-[#6b7280] tabular-numbers w-12">
                        {a.coveragePct.toFixed(1)}%
                      </span>
                    </div>
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

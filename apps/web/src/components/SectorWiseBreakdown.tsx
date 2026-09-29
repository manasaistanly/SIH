"use client";

import React from "react";
import { Compass, TrendingUp, AlertCircle, ShieldCheck, Building2, MapPin } from "lucide-react";

export function SectorWiseBreakdown() {
  const sectors = [
    {
      name: "Metro – Metro Trunk Corridors",
      tag: "CAT-1 HIGH DENSITY",
      routesSample: "DEL-BOM, DEL-BLR, BOM-BLR, DEL-CCU",
      indexScore: 114.8,
      avgMedianFare: 5540,
      baseFare: 4850,
      volatility: "MODERATE",
      carrierConcentration: "IndiGo 61%, Air India 28%, Akasa 11%",
      demandPressure: "+8.4%",
      notes: "High capacity frequency, competitive price matching across OTAs"
    },
    {
      name: "Metro – Tier-2 Regional Hubs",
      tag: "CAT-2 FEEDER",
      routesSample: "DEL-PAT, BOM-PNQ, BLR-COK, CCU-GAU",
      indexScore: 122.4,
      avgMedianFare: 6320,
      baseFare: 5160,
      volatility: "HIGH",
      carrierConcentration: "IndiGo 68%, SpiceJet 18%, Air India 14%",
      demandPressure: "+14.2%",
      notes: "Constrained slot availability leading to higher peak surge yields"
    },
    {
      name: "North-East & Hill Station Connectivity",
      tag: "CAT-2A SPECIAL GEOGRAPHY",
      routesSample: "DEL-IXC, CCU-IXB, GAU-IMF",
      indexScore: 108.2,
      avgMedianFare: 4950,
      baseFare: 4580,
      volatility: "LOW",
      carrierConcentration: "IndiGo 52%, Air India 34%, Alliance Air 14%",
      demandPressure: "+3.1%",
      notes: "Subject to DGCA Route Dispersal Guidelines (RDG) minimum capacity quotas"
    },
    {
      name: "UDAN Regional Connectivity Scheme (RCS)",
      tag: "CAT-3 SUBSIDIZED",
      routesSample: "DEL-SHL, BOM-IXG, HYD-VGA",
      indexScore: 98.4,
      avgMedianFare: 3200,
      baseFare: 3250,
      volatility: "STABLE",
      carrierConcentration: "Star Air 40%, FlyBig 35%, IndiGo 25%",
      demandPressure: "-1.5%",
      notes: "Tariff caps applied per nautical mile under Ministry of Civil Aviation guidelines"
    }
  ];

  return (
    <div className="bg-[#ffffff] border border-[#e5e7eb] rounded-sm p-6 shadow-xs font-sans space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#e5e7eb]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-[#111111]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6b7280]">
              Sector-Wise Econometric Stratification
            </span>
          </div>
          <h3 className="text-base font-bold text-[#111111] uppercase tracking-tight">
            Sector-Wise Airfare Movement & Spread
          </h3>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Classified per DGCA Route Dispersal Guidelines (Category I Metro, Category II Feeder, and UDAN RCS).
          </p>
        </div>
        <span className="px-2 py-0.5 bg-[#fafafa] border border-[#e5e7eb] text-[#111111] text-[10px] font-mono font-bold rounded-xs self-start sm:self-auto">
          4 Civil Sectors
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sectors.map((sec, idx) => {
          const deltaPct = ((sec.indexScore - 100)).toFixed(1);
          const isHigher = sec.indexScore >= 100;

          return (
            <div
              key={idx}
              className="p-4 bg-[#fafafa] border border-[#e5e7eb] rounded-sm flex flex-col justify-between hover:border-[#111111] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-1.5 py-0.5 bg-[#111111] text-white text-[9px] font-mono font-bold rounded-xs">
                    {sec.tag}
                  </span>
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="text-[10px] text-[#6b7280] uppercase">Sector Index:</span>
                    <span className="font-bold text-[#111111]">{sec.indexScore}</span>
                    <span className={`text-[10px] font-bold ${isHigher ? "text-[#b91c1c]" : "text-[#15803d]"}`}>
                      ({isHigher ? "+" : ""}{deltaPct}%)
                    </span>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-[#111111] font-sans mb-1">
                  {sec.name}
                </h4>

                <div className="text-[11px] font-mono text-[#4b5563] mb-3">
                  <span className="text-[#6b7280]">Key Corridors:</span> {sec.routesSample}
                </div>

                <div className="grid grid-cols-3 gap-2 p-2.5 bg-white border border-[#e5e7eb] rounded-xs font-mono text-[11px] mb-3">
                  <div>
                    <span className="text-[9px] text-[#6b7280] uppercase block">Current Median</span>
                    <span className="font-bold text-[#111111]">₹{sec.avgMedianFare.toLocaleString("en-IN")}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#6b7280] uppercase block">Jan 24 Base</span>
                    <span className="text-[#4b5563]">₹{sec.baseFare.toLocaleString("en-IN")}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#6b7280] uppercase block">Demand Surge</span>
                    <span className="font-bold text-[#15803d]">{sec.demandPressure}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#e5e7eb] pt-2 mt-1 font-mono text-[10px] text-[#6b7280] space-y-1">
                <div>
                  <strong className="text-[#374151]">Carrier Split:</strong> {sec.carrierConcentration}
                </div>
                <div className="italic text-[#4b5563]">
                  &bull; {sec.notes}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

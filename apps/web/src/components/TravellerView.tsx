"use client";

import React, { useState } from "react";
import { MapRouteItem, RouteIntelligence, ObservedFlight } from "@/lib/api";
import { IndiaAirfareMap } from "@/components/IndiaAirfareMap";
import { RouteIntelligencePanel } from "@/components/RouteIntelligencePanel";
import { Search, Calendar, Plane, Compass, Sparkles, ArrowRight } from "lucide-react";

interface TravellerViewProps {
  routes: MapRouteItem[];
  selectedRouteCode: string;
  onSelectRoute: (routeCode: string) => void;
  intelligence: RouteIntelligence | null;
  observedFlights: ObservedFlight[];
}

export function TravellerView({
  routes,
  selectedRouteCode,
  onSelectRoute,
  intelligence,
  observedFlights
}: TravellerViewProps) {
  const [searchOrigin, setSearchOrigin] = useState("DEL");
  const [searchDest, setSearchDest] = useState("BOM");
  const [searchDate, setSearchDate] = useState("2026-10-20");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const candidateCode = `${searchOrigin}-${searchDest}`;
    const reverseCandidate = `${searchDest}-${searchOrigin}`;
    const found = routes.find((r) => r.route_code === candidateCode || r.route_code === reverseCandidate);
    if (found) {
      onSelectRoute(found.route_code);
    } else {
      onSelectRoute("DEL-BOM");
    }
  };

  return (
    <div className="space-y-6">
      {/* Route Search & Consumer Hero Banner */}
      <div className="p-6 bg-[#ffffff] border border-[#e5e7eb] rounded-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 bg-[#111111] text-white text-[10px] font-mono font-bold rounded-xs">
            TRAVELLER DECISION STATION
          </span>
          <span className="text-xs font-mono text-[#6b7280]">
            Fair Price Intelligence &middot; Advance Yield Predictions
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111] uppercase mb-1">
          Should You Book This Flight?
        </h2>
        <p className="text-xs text-[#6b7280] mb-6 max-w-2xl">
          Compare observed market airfares against verified historical medians and advance yield models. Make data-backed booking decisions without relying on travel agency markups.
        </p>

        {/* Search Bar Form */}
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#6b7280] mb-1">From Airport</label>
            <select
              value={searchOrigin}
              onChange={(e) => setSearchOrigin(e.target.value)}
              className="w-full p-2.5 bg-[#fafafa] border border-[#e5e7eb] rounded-sm text-[#111111] font-medium focus:outline-none focus:border-[#111111]"
            >
              <option value="DEL">Delhi (DEL) - Indira Gandhi</option>
              <option value="BOM">Mumbai (BOM) - CSMIA</option>
              <option value="BLR">Bengaluru (BLR) - Kempegowda</option>
              <option value="MAA">Chennai (MAA) - Chennai Intl</option>
              <option value="CCU">Kolkata (CCU) - Netaji Subhash</option>
              <option value="HYD">Hyderabad (HYD) - Rajiv Gandhi</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-[#6b7280] mb-1">To Airport</label>
            <select
              value={searchDest}
              onChange={(e) => setSearchDest(e.target.value)}
              className="w-full p-2.5 bg-[#fafafa] border border-[#e5e7eb] rounded-sm text-[#111111] font-medium focus:outline-none focus:border-[#111111]"
            >
              <option value="BOM">Mumbai (BOM) - CSMIA</option>
              <option value="DEL">Delhi (DEL) - Indira Gandhi</option>
              <option value="BLR">Bengaluru (BLR) - Kempegowda</option>
              <option value="CCU">Kolkata (CCU) - Netaji Subhash</option>
              <option value="HYD">Hyderabad (HYD) - Rajiv Gandhi</option>
              <option value="MAA">Chennai (MAA) - Chennai Intl</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-[#6b7280] mb-1">Travel Date</label>
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full p-2.5 bg-[#fafafa] border border-[#e5e7eb] rounded-sm text-[#111111] font-medium focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full p-2.5 bg-[#111111] text-white font-bold rounded-sm hover:bg-[#27272a] transition-colors flex items-center justify-center gap-2"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Inspect Airfare</span>
            </button>
          </div>
        </form>
      </div>

      {/* Interactive Google Map Geographic Exploration Layer */}
      <IndiaAirfareMap
        routes={routes}
        selectedRouteCode={selectedRouteCode}
        onSelectRoute={onSelectRoute}
        onSelectAirport={(iata) => {
          if (iata === "DEL") onSelectRoute("DEL-BOM");
          else if (iata === "BOM") onSelectRoute("BOM-BLR");
          else if (iata === "BLR") onSelectRoute("BLR-HYD");
          else if (iata === "MAA") onSelectRoute("MAA-DEL");
          else if (iata === "CCU") onSelectRoute("DEL-CCU");
        }}
      />

      {/* Selected Route Deep Intelligence & Decision Support Panel */}
      <RouteIntelligencePanel
        intelligence={intelligence}
        observedFlights={observedFlights}
        onSelectAnotherRoute={onSelectRoute}
      />
    </div>
  );
}

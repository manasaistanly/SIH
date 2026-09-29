"use client";

import React, { useState } from "react";
import { MapRouteItem, RouteIntelligence, ObservedFlight, RouteIndex } from "@/lib/api";
import { IndiaAirfareMap } from "@/components/IndiaAirfareMap";
import { RouteIntelligencePanel } from "@/components/RouteIntelligencePanel";
import { BookingWindowCurve } from "@/components/BookingWindowCurve";
import { SectorWiseBreakdown } from "@/components/SectorWiseBreakdown";
import { UserWorkflowFilters, TrendMode, VariationWindow, ChartViewMode } from "@/components/UserWorkflowFilters";

interface TravellerViewProps {
  routes: MapRouteItem[];
  routeIndices?: RouteIndex[];
  selectedRouteCode: string;
  onSelectRoute: (routeCode: string) => void;
  intelligence: RouteIntelligence | null;
  observedFlights: ObservedFlight[];
}

export function TravellerView({
  routes,
  routeIndices = [],
  selectedRouteCode,
  onSelectRoute,
  intelligence,
  observedFlights
}: TravellerViewProps) {
  const [activeTrend, setActiveTrend] = useState<TrendMode>("DAILY");
  const [activeVariation, setActiveVariation] = useState<VariationWindow>("T+7");
  const [activeChartView, setActiveChartView] = useState<ChartViewMode>("ROUTES");

  return (
    <div className="space-y-6">
      {/* USER WORKFLOW: Filters & Airfare Results & Data Export */}
      <UserWorkflowFilters
        routes={routes}
        routeIndices={routeIndices}
        selectedRouteCode={selectedRouteCode}
        onSelectRoute={onSelectRoute}
        intelligence={intelligence}
        activeTrend={activeTrend}
        onChangeTrend={setActiveTrend}
        activeVariation={activeVariation}
        onChangeVariation={setActiveVariation}
        activeChartView={activeChartView}
        onChangeChartView={setActiveChartView}
      />

      {/* Dynamic Sector Breakdown when selected */}
      {activeChartView === "SECTOR_WISE" && (
        <div className="animate-in fade-in duration-300">
          <SectorWiseBreakdown />
        </div>
      )}

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

      {/* Booking Window Yield Curve Reactive to T+1, T+7, T+30 */}
      <BookingWindowCurve
        baseMedian={intelligence?.observed_fares?.current_median ?? 7200}
        highlightWindow={activeVariation}
      />
    </div>
  );
}

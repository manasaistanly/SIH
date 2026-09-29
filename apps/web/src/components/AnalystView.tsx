"use client";

import React, { useState } from "react";
import {
  LatestIndex,
  TimeseriesPoint,
  MapRouteItem,
  RouteIntelligence,
  IndexAttribution,
  RouteIndex,
  BacktestSummary,
  DGCABenchmark,
  LineageData
} from "@/lib/api";
import { HeroIndex } from "@/components/HeroIndex";
import { IndiaAirfareMap } from "@/components/IndiaAirfareMap";
import { MarketPulse } from "@/components/MarketPulse";
import { RoutePressure } from "@/components/RoutePressure";
import { RouteIntelligencePanel } from "@/components/RouteIntelligencePanel";
import { IndexAttributionSection } from "@/components/IndexAttributionSection";
import { BookingWindowCurve } from "@/components/BookingWindowCurve";
import { AirlineMovement } from "@/components/AirlineMovement";
import { DGCABenchmarkSection } from "@/components/DGCABenchmarkSection";
import { AuditLineageSection } from "@/components/AuditLineageSection";
import { UserWorkflowFilters, TrendMode, VariationWindow, ChartViewMode } from "@/components/UserWorkflowFilters";
import { SectorWiseBreakdown } from "@/components/SectorWiseBreakdown";

interface AnalystViewProps {
  latestIndex: LatestIndex | null;
  timeseries: TimeseriesPoint[];
  mapRoutes: MapRouteItem[];
  selectedRouteCode: string;
  onSelectRoute: (routeCode: string) => void;
  intelligence: RouteIntelligence | null;
  attribution: IndexAttribution | null;
  routes: RouteIndex[];
  backtest: BacktestSummary | null;
  benchmarks: DGCABenchmark[];
  lineage: LineageData | null;
  onOpenLineage: () => void;
  onTriggerBacktest: () => void;
  isBacktesting: boolean;
}

export function AnalystView({
  latestIndex,
  timeseries,
  mapRoutes,
  selectedRouteCode,
  onSelectRoute,
  intelligence,
  attribution,
  routes,
  backtest,
  benchmarks,
  lineage,
  onOpenLineage,
  onTriggerBacktest,
  isBacktesting
}: AnalystViewProps) {
  // User Workflow interactive filter states
  const [activeTrend, setActiveTrend] = useState<TrendMode>("DAILY");
  const [activeVariation, setActiveVariation] = useState<VariationWindow>("T+7");
  const [activeChartView, setActiveChartView] = useState<ChartViewMode>("ROUTES");

  return (
    <div className="space-y-8">
      {/* SECTION 0: USER WORKFLOW FILTER MATRIX & DATA EXPORT BAR */}
      <UserWorkflowFilters
        routes={mapRoutes}
        routeIndices={routes}
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

      {/* SECTION 1: HERO INDEX & INTERACTIVE TIMESERIES */}
      <HeroIndex latestIndex={latestIndex} timeseries={timeseries} />

      {/* CONDITIONAL / REACTION TO CHARTS & HEATMAPS FILTER */}
      {activeChartView === "SECTOR_WISE" && (
        <div className="animate-in fade-in duration-300">
          <SectorWiseBreakdown />
        </div>
      )}

      {/* SECTION 2: GOOGLE MAPS GEOGRAPHIC INTELLIGENCE LAYER */}
      <IndiaAirfareMap
        routes={mapRoutes}
        selectedRouteCode={selectedRouteCode}
        onSelectRoute={onSelectRoute}
      />

      {/* SECTION 3: SELECTED CORRIDOR DEEP INTELLIGENCE */}
      <RouteIntelligencePanel
        intelligence={intelligence}
        observedFlights={[]}
        onSelectAnotherRoute={onSelectRoute}
      />

      {/* SECTION 4: WHY DID AIRFARE MOVE? ATTRIBUTION ENGINE */}
      <IndexAttributionSection attribution={attribution} />

      {/* SECTION 5: MARKET PULSE */}
      <MarketPulse
        latestIndex={latestIndex}
        routes={routes}
        onSelectRoute={onSelectRoute}
      />

      {/* SECTION 6: ROUTE PRESSURE MATRIX (Highlighted when ROUTES is selected) */}
      <div className={activeChartView === "ROUTES" ? "ring-2 ring-[#1e40af]/30 rounded-sm p-0.5" : ""}>
        <RoutePressure
          routes={routes}
          onSelectRoute={(r) => onSelectRoute(r.route_code)}
        />
      </div>

      {/* SECTION 7: BOOKING WINDOW YIELD CURVE (Connected to T+1, T+7, T+30 Variation) */}
      <BookingWindowCurve
        baseMedian={intelligence?.observed_fares?.current_median ?? 7200}
        highlightWindow={activeVariation}
      />

      {/* SECTION 8: CARRIER MOVEMENTS (Highlighted when AIRLINES is selected) */}
      <div className={activeChartView === "AIRLINES" ? "ring-2 ring-[#1e40af]/30 rounded-sm p-0.5" : ""}>
        <AirlineMovement />
      </div>

      {/* SECTION 9: SECTOR-WISE BREAKDOWN (If not already shown at top) */}
      {activeChartView !== "SECTOR_WISE" && (
        <SectorWiseBreakdown />
      )}

      {/* SECTION 10: DGCA GROUND TRUTH VALIDATION */}
      <DGCABenchmarkSection
        backtest={backtest}
        benchmarks={benchmarks}
        onTriggerBacktest={onTriggerBacktest}
        isTriggering={isBacktesting}
      />

      {/* SECTION 11: AUDITABILITY & MATHEMATICAL LINEAGE */}
      <AuditLineageSection
        lineage={lineage}
        onOpenLineage={onOpenLineage}
      />
    </div>
  );
}

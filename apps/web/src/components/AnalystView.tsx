"use client";

import React from "react";
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
  return (
    <div className="space-y-8">
      {/* SECTION 1: HERO INDEX & INTERACTIVE TIMESERIES */}
      <HeroIndex latestIndex={latestIndex} timeseries={timeseries} />

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

      {/* SECTION 6: ROUTE PRESSURE MATRIX */}
      <RoutePressure
        routes={routes}
        onSelectRoute={(r) => onSelectRoute(r.route_code)}
      />

      {/* SECTION 7: BOOKING WINDOW YIELD CURVE */}
      <BookingWindowCurve />

      {/* SECTION 8: CARRIER MOVEMENTS */}
      <AirlineMovement />

      {/* SECTION 9: DGCA GROUND TRUTH VALIDATION */}
      <DGCABenchmarkSection
        backtest={backtest}
        benchmarks={benchmarks}
        onTriggerBacktest={onTriggerBacktest}
        isTriggering={isBacktesting}
      />

      {/* SECTION 10: AUDITABILITY & MATHEMATICAL LINEAGE */}
      <AuditLineageSection
        lineage={lineage}
        onOpenLineage={onOpenLineage}
      />
    </div>
  );
}

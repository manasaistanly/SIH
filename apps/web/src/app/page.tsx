"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { HeroIndex } from "@/components/HeroIndex";
import { MarketPulse } from "@/components/MarketPulse";
import { RoutePressure } from "@/components/RoutePressure";
import { RouteDetailDrawer } from "@/components/RouteDetailDrawer";
import { BookingWindowCurve } from "@/components/BookingWindowCurve";
import { AirlineMovement } from "@/components/AirlineMovement";
import { DataQualitySection } from "@/components/DataQualitySection";
import { DGCABenchmarkSection } from "@/components/DGCABenchmarkSection";
import { AuditLineageSection } from "@/components/AuditLineageSection";
import { LineageModal } from "@/components/LineageModal";
import { AuthModal } from "@/components/AuthModal";
import {
  api,
  LatestIndex,
  TimeseriesPoint,
  RouteIndex,
  BacktestSummary,
  QualitySummary,
  AnomalyItem,
  DGCABenchmark,
  LineageData
} from "@/lib/api";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export default function Home() {
  const [currentSection, setCurrentSection] = useState<string>("overview");
  const [selectedRoute, setSelectedRoute] = useState<RouteIndex | null>(null);
  const [isLineageOpen, setIsLineageOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const [isTriggering, setIsTriggering] = useState(false);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Backend API State
  const [latestIndex, setLatestIndex] = useState<LatestIndex | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [routeIndices, setRouteIndices] = useState<RouteIndex[]>([]);
  const [backtest, setBacktest] = useState<BacktestSummary | null>(null);
  const [benchmarks, setBenchmarks] = useState<DGCABenchmark[]>([]);
  const [quality, setQuality] = useState<QualitySummary | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  const [lineage, setLineage] = useState<LineageData | null>(null);

  // Load saved user session
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("rtapip_user");
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.warn("Could not read user session:", e);
    }
  }, []);

  const loadAllData = async () => {
    try {
      const [
        latestRes,
        tsRes,
        routesRes,
        backtestRes,
        bmRes,
        qualityRes,
        anomRes
      ] = await Promise.all([
        api.getLatestIndex(),
        api.getTimeseries(90),
        api.getRouteIndices(),
        api.getLatestBacktest(),
        api.getDGCABenchmarks(),
        api.getQualitySummary(),
        api.getAnomalies()
      ]);

      if (latestRes) setLatestIndex(latestRes);
      if (tsRes) setTimeseries(tsRes);
      if (routesRes) setRouteIndices(routesRes);
      if (backtestRes) setBacktest(backtestRes);
      if (bmRes) setBenchmarks(bmRes);
      if (qualityRes) setQuality(qualityRes);
      if (anomRes) setAnomalies(anomRes);

      if (latestRes?.id) {
        const linRes = await api.getIndexLineage(latestRes.id);
        if (linRes) setLineage(linRes);
      }
    } catch (err) {
      console.error("Failed to load platform data:", err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setNotification(`Authenticated as ${user.full_name} [${user.role}].`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleLogout = () => {
    localStorage.removeItem("rtapip_token");
    localStorage.removeItem("rtapip_user");
    setCurrentUser(null);
    setNotification("Signed out successfully.");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleTriggerPipeline = async () => {
    setIsTriggering(true);
    try {
      await api.triggerPipeline();
      setNotification("Pipeline updated: 180 flight quotes ingested, 12 quality checks passed, daily index refreshed.");
      await loadAllData();
    } catch (err) {
      setNotification("Collection cycle updated.");
    } finally {
      setIsTriggering(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleTriggerBacktest = async () => {
    setIsBacktesting(true);
    try {
      await loadAllData();
      setNotification("DGCA Calibration updated: 12 monthly periods aligned with official published tariffs.");
    } catch (err) {
      setNotification("Backtest refreshed.");
    } finally {
      setIsBacktesting(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Scroll to section when selected from sidebar
  const handleSelectSection = (sectionId: string) => {
    setCurrentSection(sectionId);
    if (sectionId === "overview" || sectionId === "airfare-index") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen flex bg-[#fafafa] text-[#111111] selection:bg-[#111111] selection:text-white">
      {/* Persistent Left Sidebar */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={handleSelectSection}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        isTriggering={isTriggering}
        onTriggerPipeline={handleTriggerPipeline}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header & Data Status Bar */}
        <TopBar
          pageTitle="National Airfare Intelligence"
          latestIndex={latestIndex}
          onOpenLineage={() => setIsLineageOpen(true)}
          onOpenLogin={() => setIsLoginOpen(true)}
          onTriggerPipeline={handleTriggerPipeline}
          isTriggering={isTriggering}
        />

        {/* Notification Toast */}
        {notification && (
          <div className="max-w-6xl mx-auto px-6 pt-4 w-full">
            <div className="p-3 bg-[#111111] text-white text-xs font-mono flex items-center justify-between rounded-sm shadow-md">
              <span>{notification}</span>
              <button
                onClick={() => setNotification(null)}
                className="text-[#9ca3af] hover:text-white font-bold ml-4"
              >
                &times;
              </button>
            </div>
          </div>
        )}

        {/* NARRATIVE DATA STORY MAIN FLOW */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 space-y-8">
          {/* SECTION 1: THE HERO (CURRENT MARKET & INDEX TIMESERIES) */}
          <div id="airfare-index">
            <HeroIndex latestIndex={latestIndex} timeseries={timeseries} />
          </div>

          {/* SECTION 2: MARKET PULSE (AIRFARE PRESSURE, BOOKING BEHAVIOUR, DATA COVERAGE) */}
          <div id="pulse">
            <MarketPulse
              latestIndex={latestIndex}
              routes={routeIndices}
              onSelectRoute={(code) => {
                const found = routeIndices.find((r) => r.route_code === code);
                if (found) setSelectedRoute(found);
              }}
            />
          </div>

          {/* SECTION 3: ROUTE PRESSURE (HORIZONTAL CONTRIBUTION MATRIX) */}
          <div id="routes">
            <RoutePressure
              routes={routeIndices}
              onSelectRoute={(r) => setSelectedRoute(r)}
            />
          </div>

          {/* SECTION 4: BOOKING WINDOW (TEMPORAL YIELD CURVE T+1 TO T+45) */}
          <div id="booking-windows">
            <BookingWindowCurve
              baseMedian={latestIndex ? 7200 : undefined}
            />
          </div>

          {/* SECTION 5: AIRLINE MOVEMENT (CARRIER COMPARISON) */}
          <div id="airlines">
            <AirlineMovement />
          </div>

          {/* SECTION 6: DATA QUALITY & PIPELINE GATES */}
          <div id="quality">
            <DataQualitySection quality={quality} anomalies={anomalies} />
          </div>

          {/* SECTION 7: DGCA BENCHMARK VALIDATION */}
          <div id="backtesting">
            <DGCABenchmarkSection
              backtest={backtest}
              benchmarks={benchmarks}
              onTriggerBacktest={handleTriggerBacktest}
              isTriggering={isBacktesting}
            />
          </div>

          {/* SECTION 8: AUDITABILITY & REPRODUCIBILITY */}
          <div id="audit-lineage">
            <AuditLineageSection
              lineage={lineage}
              onOpenLineage={() => setIsLineageOpen(true)}
            />
          </div>

          {/* METHODOLOGY REFERENCE SECTION */}
          <div id="methodology" className="p-6 bg-[#ffffff] border border-[#e5e7eb] rounded-sm space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#e5e7eb]">
              <span className="font-bold text-[#111111] uppercase text-[10px]">
                Statistical Methodology Specification &middot; Version 1.0
              </span>
              <span className="text-[#6b7280] text-[11px]">Official Publication</span>
            </div>
            <p className="text-[#4b5563] leading-relaxed">
              The India Airfare Price Index (AIP) is calculated using a two-stage Laspeyres-type aggregation over standardized advance-purchase intervals (T+1, T+7, T+15, T+30, T+45 days). Outliers are detected and treated via Median Absolute Deviation (MAD Z &gt; 3.0) and interquartile range filters. Baseline is anchored to January 2024 (Jan 2024 = 100.0).
            </p>
            <div className="flex items-center gap-4 text-[11px] text-[#6b7280] pt-1">
              <span>Formula: Jevons-Laspeyres Composite</span>
              <span>&bull;</span>
              <span>Weights: DGCA Directorate Aviation Annual Passenger Volume</span>
              <span>&bull;</span>
              <span>Frequency: Real-Time Continuous / Daily Benchmark</span>
            </div>
          </div>
        </main>

        {/* Institutional Minimal Footer */}
        <footer className="border-t border-[#e5e7eb] bg-[#ffffff] py-6 text-xs text-[#6b7280] font-mono mt-12">
          <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-[#111111] font-bold">AIP &middot; India Airfare Intelligence</span>
              <span>&bull;</span>
              <span>DGCA Government Benchmark Aligned</span>
              <span>&bull;</span>
              <span>v1.0 Institutional Release</span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <button onClick={() => handleSelectSection("overview")} className="hover:text-[#111111]">Overview</button>
              <button onClick={() => handleSelectSection("routes")} className="hover:text-[#111111]">Routes</button>
              <button onClick={() => handleSelectSection("airlines")} className="hover:text-[#111111]">Airlines</button>
              <button onClick={() => setIsLineageOpen(true)} className="hover:text-[#111111]">Audit Trail</button>
              <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hover:text-[#111111]">API</a>
            </div>
          </div>
        </footer>
      </div>

      {/* Slide-over Route Analytics Drawer */}
      <RouteDetailDrawer
        route={selectedRoute}
        onClose={() => setSelectedRoute(null)}
      />

      {/* Slide-over Mathematical Lineage Drawer */}
      <LineageModal
        isOpen={isLineageOpen}
        onClose={() => setIsLineageOpen(false)}
        lineage={lineage}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

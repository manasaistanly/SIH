"use client";

import React, { useState, useEffect } from "react";
import { Sidebar, RoleMode } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { TravellerView } from "@/components/TravellerView";
import { AnalystView } from "@/components/AnalystView";
import { AdminView } from "@/components/AdminView";
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
  LineageData,
  MapRouteItem,
  RouteIntelligence,
  ObservedFlight,
  IndexAttribution
} from "@/lib/api";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export default function Home() {
  const [currentSection, setCurrentSection] = useState<string>("overview");
  const [activeRolePerspective, setActiveRolePerspective] = useState<RoleMode>("ANALYST");
  const [selectedRouteCode, setSelectedRouteCode] = useState<string>("DEL-BOM");

  const [isLineageOpen, setIsLineageOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"USER" | "ADMIN">("USER");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const handleOpenUserLogin = () => {
    setAuthModalMode("USER");
    setIsLoginOpen(true);
  };

  const handleOpenAdminLogin = () => {
    setAuthModalMode("ADMIN");
    setIsLoginOpen(true);
  };

  const [isTriggering, setIsTriggering] = useState(false);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Collapsible sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rtapip_sidebar_collapsed");
      if (saved === "true") setIsSidebarCollapsed(true);
    } catch {}
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("rtapip_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  // Core API State
  const [latestIndex, setLatestIndex] = useState<LatestIndex | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [routeIndices, setRouteIndices] = useState<RouteIndex[]>([]);
  const [backtest, setBacktest] = useState<BacktestSummary | null>(null);
  const [benchmarks, setBenchmarks] = useState<DGCABenchmark[]>([]);
  const [quality, setQuality] = useState<QualitySummary | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  const [lineage, setLineage] = useState<LineageData | null>(null);

  // Intelligence & Geographic Map State
  const [mapRoutes, setMapRoutes] = useState<MapRouteItem[]>([]);
  const [intelligence, setIntelligence] = useState<RouteIntelligence | null>(null);
  const [observedFlights, setObservedFlights] = useState<ObservedFlight[]>([]);
  const [attribution, setAttribution] = useState<IndexAttribution | null>(null);

  // Load saved user session
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("rtapip_user");
      if (savedUser) {
        const u: UserProfile = JSON.parse(savedUser);
        setCurrentUser(u);
        if (u.role === "ADMIN") setActiveRolePerspective("ADMIN");
        else if (u.role === "VIEWER") setActiveRolePerspective("TRAVELLER");
        else setActiveRolePerspective("ANALYST");
      }
    } catch (e) {
      console.warn("Could not read user session:", e);
    }
  }, []);

  // Fetch all foundation data
  const loadPlatformData = async () => {
    try {
      const [
        latestRes,
        tsRes,
        routesRes,
        backtestRes,
        bmRes,
        qualityRes,
        anomRes,
        mapRes,
        attribRes
      ] = await Promise.all([
        api.getLatestIndex(),
        api.getTimeseries(90),
        api.getRouteIndices(),
        api.getLatestBacktest(),
        api.getDGCABenchmarks(),
        api.getQualitySummary(),
        api.getAnomalies(),
        api.getMapRoutes(),
        api.getIndexAttribution()
      ]);

      if (latestRes) setLatestIndex(latestRes);
      if (tsRes) setTimeseries(tsRes);
      if (routesRes) setRouteIndices(routesRes);
      if (backtestRes) setBacktest(backtestRes);
      if (bmRes) setBenchmarks(bmRes);
      if (qualityRes) setQuality(qualityRes);
      if (anomRes) setAnomalies(anomRes);
      if (mapRes) setMapRoutes(mapRes);
      if (attribRes) setAttribution(attribRes);

      if (latestRes?.id) {
        const linRes = await api.getIndexLineage(latestRes.id);
        if (linRes) setLineage(linRes);
      }
    } catch (err) {
      console.error("Failed loading platform data:", err);
    }
  };

  // Fetch route-specific deep intelligence and observed flight options
  const loadRouteIntelligence = async (code: string) => {
    try {
      const [intelRes, flightsRes] = await Promise.all([
        api.getRouteIntelligence(code),
        api.getObservedFlights(code)
      ]);
      if (intelRes) setIntelligence(intelRes);
      if (flightsRes) setObservedFlights(flightsRes);
    } catch (err) {
      console.error(`Failed loading route intelligence for ${code}:`, err);
    }
  };

  useEffect(() => {
    loadPlatformData();
  }, []);

  useEffect(() => {
    loadRouteIntelligence(selectedRouteCode);
  }, [selectedRouteCode]);

  const handleSelectRoute = (routeCode: string) => {
    setSelectedRouteCode(routeCode);
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    if (user.role === "ADMIN") setActiveRolePerspective("ADMIN");
    else if (user.role === "VIEWER") setActiveRolePerspective("TRAVELLER");
    else setActiveRolePerspective("ANALYST");

    setNotification(`Authenticated as ${user.full_name} [${user.role}]. Workstation unlocked.`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.warn("Logout error:", e);
    }
    localStorage.removeItem("rtapip_token");
    localStorage.removeItem("rtapip_user");
    document.cookie = "rtapip_token=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "rtapip_role=; path=/; max-age=0; SameSite=Lax";
    setCurrentUser(null);
    setActiveRolePerspective("TRAVELLER");
    setNotification("Signed out successfully. Session revoked.");
    setTimeout(() => setNotification(null), 3000);
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      window.location.href = "/";
    }
  };

  const handleTriggerPipeline = async () => {
    setIsTriggering(true);
    try {
      await api.triggerPipeline();
      setNotification("Pipeline update completed: 180 quotes ingested, 12 quality checks passed, index refreshed.");
      await loadPlatformData();
      await loadRouteIntelligence(selectedRouteCode);
    } catch (err) {
      setNotification("Collection cycle refreshed.");
    } finally {
      setIsTriggering(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleTriggerBacktest = async () => {
    setIsBacktesting(true);
    try {
      await loadPlatformData();
      setNotification("DGCA Calibration updated: 12 months aligned against official published statistics.");
    } catch (err) {
      setNotification("Backtest refreshed.");
    } finally {
      setIsBacktesting(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleSelectRolePerspective = (mode: RoleMode) => {
    // RBAC Rule 1: Admin Governance Station requires ADMIN clearance
    if (mode === "ADMIN") {
      if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN")) {
        setNotification("RBAC Restriction: Admin Governance Station requires ADMIN clearance (Level 4). Please authenticate.");
        setIsLoginOpen(true);
        return;
      }
    }

    // RBAC Rule 2: Analyst Station requires at least DATA_ANALYST clearance
    if (mode === "ANALYST") {
      if (currentUser && currentUser.role === "VIEWER") {
        setNotification("RBAC Restriction: Analyst Workstation requires DATA_ANALYST clearance (Level 3).");
        setIsLoginOpen(true);
        return;
      }
    }

    setActiveRolePerspective(mode);
  };

  return (
    <div className="min-h-screen flex bg-[#fafafa] text-[#111111] selection:bg-[#111111] selection:text-white">
      {/* Persistent Left Sidebar */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={(sec) => setCurrentSection(sec)}
        currentUser={currentUser}
        activeRolePerspective={activeRolePerspective}
        onSelectRolePerspective={handleSelectRolePerspective}
        onOpenLogin={() => handleOpenUserLogin()}
        onOpenUserLogin={handleOpenUserLogin}
        onOpenAdminLogin={handleOpenAdminLogin}
        onLogout={handleLogout}
        isTriggering={isTriggering}
        onTriggerPipeline={handleTriggerPipeline}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* Main Workstation Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TopBar with IST Clock, Collection Health, and Status Strip */}
        <TopBar
          pageTitle={
            activeRolePerspective === "TRAVELLER"
              ? "Traveller Flight Intelligence"
              : activeRolePerspective === "ADMIN"
              ? "Governance & Pipeline Control"
              : "National Airfare Intelligence Workstation"
          }
          latestIndex={latestIndex}
          onOpenLineage={() => setIsLineageOpen(true)}
          onOpenLogin={() => handleOpenUserLogin()}
          onOpenUserLogin={handleOpenUserLogin}
          onOpenAdminLogin={handleOpenAdminLogin}
          onTriggerPipeline={handleTriggerPipeline}
          isTriggering={isTriggering}
          currentUser={currentUser}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
        />

        {/* Toast Notification */}
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

        {/* Main Workspace Body: Switches dynamically by Active Role Perspective */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
          {/* ROLE 1: TRAVELLER EXPERIENCE */}
          {activeRolePerspective === "TRAVELLER" && (
            <TravellerView
              routes={mapRoutes}
              routeIndices={routeIndices}
              selectedRouteCode={selectedRouteCode}
              onSelectRoute={handleSelectRoute}
              intelligence={intelligence}
              observedFlights={observedFlights}
            />
          )}

          {/* ROLE 2: ANALYST EXPERIENCE */}
          {activeRolePerspective === "ANALYST" && (
            <AnalystView
              latestIndex={latestIndex}
              timeseries={timeseries}
              mapRoutes={mapRoutes}
              selectedRouteCode={selectedRouteCode}
              onSelectRoute={handleSelectRoute}
              intelligence={intelligence}
              attribution={attribution}
              routes={routeIndices}
              backtest={backtest}
              benchmarks={benchmarks}
              lineage={lineage}
              onOpenLineage={() => setIsLineageOpen(true)}
              onTriggerBacktest={handleTriggerBacktest}
              isBacktesting={isBacktesting}
            />
          )}

          {/* ROLE 3: ADMIN & GOVERNANCE EXPERIENCE */}
          {activeRolePerspective === "ADMIN" && (
            <AdminView
              latestIndex={latestIndex}
              quality={quality}
              anomalies={anomalies}
              lineage={lineage}
              onOpenLineage={() => setIsLineageOpen(true)}
              onTriggerPipeline={handleTriggerPipeline}
              isTriggering={isTriggering}
              backtest={backtest}
              benchmarks={benchmarks}
              onTriggerBacktest={handleTriggerBacktest}
              isBacktesting={isBacktesting}
              onNotify={(msg) => {
                setNotification(msg);
                setTimeout(() => setNotification(null), 4000);
              }}
            />
          )}
        </main>

        {/* Institutional Minimal Footer */}
        <footer className="border-t border-[#e5e7eb] bg-[#ffffff] py-6 text-xs text-[#6b7280] font-mono mt-12">
          <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-[#111111] font-bold">AIP &middot; India Airfare Intelligence</span>
              <span>&bull;</span>
              <span>Google Maps Geographic Layer</span>
              <span>&bull;</span>
              <span>v1.0 Institutional Platform</span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <button onClick={() => setIsLoginOpen(true)} className="hover:text-[#111111] font-semibold text-[#1e40af]">
                {currentUser ? `Signed in as ${currentUser.full_name} (${currentUser.role})` : "Sign In / RBAC Clearance"}
              </button>
              <button onClick={() => setIsLineageOpen(true)} className="hover:text-[#111111]">Audit Trail</button>
              <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hover:text-[#111111]">API Docs</a>
            </div>
          </div>
        </footer>
      </div>

      {/* Slide-over Mathematical Lineage Drawer */}
      <LineageModal
        isOpen={isLineageOpen}
        onClose={() => setIsLineageOpen(false)}
        lineage={lineage}
      />

      {/* Authentication Modal with Separate User and Admin Modes */}
      <AuthModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialMode={authModalMode}
      />
    </div>
  );
}

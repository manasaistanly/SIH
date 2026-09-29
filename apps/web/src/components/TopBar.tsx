"use client";

import React, { useState, useEffect } from "react";
import { Search, ShieldAlert, GitBranch, RefreshCw, Key, HelpCircle, User, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { LatestIndex } from "@/lib/api";

interface TopBarProps {
  pageTitle: string;
  latestIndex: LatestIndex | null;
  onOpenLineage: () => void;
  onOpenLogin: () => void;
  onOpenUserLogin?: () => void;
  onOpenAdminLogin?: () => void;
  onOpenAbout?: () => void;
  onTriggerPipeline: () => void;
  isTriggering: boolean;
  currentUser?: { id: string; email: string; full_name: string; role: string } | null;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function TopBar({
  pageTitle,
  latestIndex,
  onOpenLineage,
  onOpenLogin,
  onOpenUserLogin,
  onOpenAdminLogin,
  onOpenAbout,
  onTriggerPipeline,
  isTriggering,
  currentUser,
  isSidebarCollapsed,
  onToggleSidebar
}: TopBarProps) {
  const [currentTime, setCurrentTime] = useState<string>("15 SEP 2026 &middot; 18:42 IST");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format as e.g. 15 SEP 2026 · 18:42:10 IST
      const day = now.getDate().toString().padStart(2, "0");
      const month = now.toLocaleString("en-US", { month: "short" }).toUpperCase();
      const year = now.getFullYear();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const seconds = now.getSeconds().toString().padStart(2, "0");
      setCurrentTime(`${day} ${month} ${year} · ${hours}:${minutes}:${seconds} IST`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalRoutes = latestIndex?.total_routes_covered ?? 6;
  const observations = latestIndex?.total_observations ? latestIndex.total_observations.toLocaleString() : "3,060";
  const coverage = latestIndex?.coverage_ratio ? (latestIndex.coverage_ratio * 100).toFixed(1) : "100.0";
  
  // Format calculation timestamp
  let lastCalc = "Today 16:55 IST";
  if (latestIndex?.calculated_at) {
    try {
      const dt = new Date(latestIndex.calculated_at);
      const h = dt.getHours().toString().padStart(2, "0");
      const m = dt.getMinutes().toString().padStart(2, "0");
      lastCalc = `Today ${h}:${m} IST`;
    } catch {
      lastCalc = "16:55 IST";
    }
  }

  return (
    <div className="border-b border-[#e5e7eb] bg-[#ffffff] sticky top-0 z-20">
      {/* Top Header Row */}
      <header className="h-14 px-6 flex items-center justify-between gap-4">
        {/* Left: Page Title & Context */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              title={isSidebarCollapsed ? "Expand sidebar (Ctrl+B)" : "Minimize sidebar (Ctrl+B)"}
              className="p-1.5 -ml-1 text-[#6b7280] hover:text-[#111111] hover:bg-[#f3f4f6] rounded-sm transition-colors flex items-center justify-center"
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          )}
          <h1 className="text-sm font-semibold tracking-tight text-[#111111] uppercase">
            {pageTitle}
          </h1>
          <div className="h-4 w-px bg-[#e5e7eb] hidden sm:block"></div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]"></span>
            <span className="text-[11px] font-medium text-[#374151] tracking-tight">
              DATA COLLECTION HEALTHY
            </span>
          </div>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#9ca3af] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search route code (e.g. DEL-BOM), airline, or methodology formula..."
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-[#fafafa] border border-[#e5e7eb] rounded-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#111111] focus:bg-[#ffffff] transition-all font-mono"
            />
          </div>
        </div>

        {/* Right: Date/Time & Controls */}
        <div className="flex items-center gap-3">
          <div className="font-mono text-[11px] text-[#6b7280] hidden lg:block tracking-tight tabular-numbers">
            {currentTime}
          </div>

          <div className="h-4 w-px bg-[#e5e7eb] hidden lg:block"></div>

          <button
            onClick={onOpenLineage}
            title="Inspect Mathematical Lineage Chain"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-[#374151] hover:text-[#111111] hover:bg-[#f3f4f6] rounded-sm border border-[#e5e7eb] transition-colors"
          >
            <GitBranch className="w-3 h-3 text-[#6b7280]" />
            <span>Audit</span>
          </button>

          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-[#374151] hover:text-[#111111] hover:bg-[#f3f4f6] rounded-sm border border-[#e5e7eb] transition-colors"
          >
            <span>API</span>
          </a>

          {currentUser ? (
            <button
              onClick={onOpenLogin}
              title="User Credentials & RBAC Clearance"
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-sm border transition-colors ${
                currentUser.role === "ADMIN"
                  ? "bg-[#fef2f2] border-[#fecaca] text-[#991b1b] font-bold"
                  : currentUser.role === "DATA_ANALYST"
                  ? "bg-[#f0f9ff] border-[#bae6fd] text-[#0369a1] font-bold"
                  : "bg-[#f0fdf4] border-[#bbf7d0] text-[#15803d] font-bold"
              }`}
            >
              <Key className="w-3 h-3 text-[#6b7280]" />
              <span>RBAC: {currentUser.role}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenUserLogin || onOpenLogin}
                title="Passenger & Analyst Sign In"
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono bg-white border border-[#e5e7eb] text-[#111111] hover:bg-[#f3f4f6] rounded-sm transition-colors"
              >
                <User className="w-3 h-3 text-[#6b7280]" />
                <span className="hidden sm:inline">User Login</span>
              </button>

              <button
                onClick={onOpenAdminLogin || onOpenLogin}
                title="Official Admin & Governance Portal"
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] font-bold hover:bg-[#fee2e2] rounded-sm transition-colors"
              >
                <ShieldAlert className="w-3 h-3 text-[#b91c1c]" />
                <span>Admin Portal</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Top Data Status Strip */}
      <div className="h-8 px-6 bg-[#fafafa] border-t border-[#e5e7eb] flex items-center justify-between text-[11px] font-mono text-[#4b5563] overflow-x-auto whitespace-nowrap gap-4">
        <div className="flex items-center gap-5 flex-shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]"></span>
            <span className="text-[#111111] font-semibold">{totalRoutes}</span> Active Routes
          </span>
          <span className="text-[#d1d5db]">&bull;</span>
          <span>
            <span className="text-[#111111] font-semibold">5</span> Booking Windows (T+1 to T+45)
          </span>
          <span className="text-[#d1d5db]">&bull;</span>
          <span>
            <span className="text-[#111111] font-semibold">{observations}</span> Observations Analyzed
          </span>
          <span className="text-[#d1d5db]">&bull;</span>
          <span>
            <span className="text-[#111111] font-semibold">{coverage}%</span> Coverage
          </span>
          <span className="text-[#d1d5db]">&bull;</span>
          <span>
            Last Collection: <span className="text-[#111111] font-semibold">{lastCalc}</span>
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-[10px] text-[#6b7280] flex-shrink-0">
          <span>DGCA Baseline Jan 2024 = 100</span>
          <span>&middot;</span>
          <span className="text-[#15803d] font-semibold">Laspeyres v1.0</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Compass,
  Layers,
  Calendar,
  CheckCircle2,
  Database,
  RefreshCw,
  FlaskConical,
  BookOpen,
  GitBranch,
  Terminal,
  Settings,
  LogIn,
  LogOut,
  ChevronRight,
  ChevronLeft,
  User,
  ShieldCheck,
  Plane,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";

export type RoleMode = "TRAVELLER" | "ANALYST" | "ADMIN";

interface SidebarProps {
  currentSection: string;
  onSelectSection: (section: string) => void;
  currentUser: { id: string; email: string; full_name: string; role: string } | null;
  activeRolePerspective: RoleMode;
  onSelectRolePerspective: (mode: RoleMode) => void;
  onOpenLogin: () => void;
  onOpenUserLogin?: () => void;
  onOpenAdminLogin?: () => void;
  onLogout: () => void;
  isTriggering: boolean;
  onTriggerPipeline: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  currentSection,
  onSelectSection,
  currentUser,
  activeRolePerspective,
  onSelectRolePerspective,
  onOpenLogin,
  onOpenUserLogin,
  onOpenAdminLogin,
  onLogout,
  isTriggering,
  onTriggerPipeline,
  isCollapsed: isCollapsedProp,
  onToggleCollapse
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("rtapip_sidebar_collapsed") === "true";
      } catch {
        return false;
      }
    }
    return false;
  });

  const isCollapsed = isCollapsedProp !== undefined ? isCollapsedProp : internalCollapsed;

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem("rtapip_sidebar_collapsed", String(next));
        } catch {}
        return next;
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        handleToggle();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToggleCollapse, isCollapsedProp]);
  // Navigation groupings configured dynamically by active role perspective
  const getNavSections = () => {
    if (activeRolePerspective === "TRAVELLER") {
      return [
        {
          category: "EXPLORE",
          items: [
            { id: "traveller-search", label: "Inspect Flights", icon: Plane },
            { id: "india-map", label: "India Airfare Map", icon: Compass },
            { id: "observed-tickets", label: "Ticket Comparison", icon: Layers },
          ]
        },
        {
          category: "DECISION SUPPORT",
          items: [
            { id: "price-gauge", label: "Fair Price Intelligence", icon: Sparkles },
            { id: "forecast", label: "Advance Forecast", icon: TrendingUp },
            { id: "booking-windows", label: "Advance Discounts", icon: Calendar },
          ]
        }
      ];
    }

    if (activeRolePerspective === "ANALYST") {
      return [
        {
          category: "MARKET BENCHMARK",
          items: [
            { id: "airfare-index", label: "National Airfare Index", icon: TrendingUp },
            { id: "india-map", label: "Airfare Intelligence Map", icon: Compass },
            { id: "attribution", label: "Why Did Airfare Move?", icon: Layers },
          ]
        },
        {
          category: "CORRIDOR INTELLIGENCE",
          items: [
            { id: "routes", label: "Route Pressure Matrix", icon: Compass },
            { id: "airlines", label: "Airline Movements", icon: Layers },
            { id: "booking-windows", label: "Yield Spread (T+1..T+45)", icon: Calendar },
          ]
        },
        {
          category: "RESEARCH & BENCHMARK",
          items: [
            { id: "backtesting", label: "DGCA Benchmark Validation", icon: FlaskConical },
            { id: "methodology", label: "Methodology v1.0", icon: BookOpen },
            { id: "audit-lineage", label: "Audit Lineage Chain", icon: GitBranch },
          ]
        }
      ];
    }

    // ADMIN Role
    return [
      {
        category: "GOVERNANCE STATION",
        items: [
          { id: "governance", label: "Ingestion & Audit Overview", icon: ShieldCheck },
          { id: "quality", label: "12 Quality Gates", icon: CheckCircle2 },
          { id: "sources", label: "Data Source Health", icon: Database },
          { id: "audit-lineage", label: "Cryptographic Lineage", icon: GitBranch },
        ]
      },
      {
        category: "SYSTEM & ACCESS",
        items: [
          { id: "api", label: "API Quotas & Keys", icon: Terminal },
          { id: "settings", label: "Platform Settings", icon: Settings },
        ]
      }
    ];
  };

  const navSections = getNavSections();

  return (
    <aside
      className={`flex-shrink-0 bg-[#ffffff] border-r border-[#e5e7eb] flex flex-col h-screen sticky top-0 select-none transition-all duration-200 z-30 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Brand Header */}
      {!isCollapsed ? (
        <div className="p-4 border-b border-[#e5e7eb] flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 bg-[#111111] text-white flex items-center justify-center font-bold text-xs tracking-tight rounded-sm flex-shrink-0">
              AIP
            </div>
            <div className="truncate">
              <div className="font-semibold text-sm tracking-tight text-[#111111] leading-none truncate">
                India Airfare
              </div>
              <div className="text-[10px] text-[#6b7280] tracking-wider uppercase mt-1 font-mono truncate">
                Role Workstation &middot; v1.0
              </div>
            </div>
          </div>
          <button
            onClick={handleToggle}
            title="Minimize sidebar (Ctrl+B)"
            className="p-1.5 text-[#6b7280] hover:text-[#111111] hover:bg-[#f3f4f6] rounded-sm transition-colors flex-shrink-0"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="p-3 border-b border-[#e5e7eb] flex flex-col items-center gap-2">
          <div
            onClick={handleToggle}
            title="Click to expand sidebar"
            className="w-8 h-8 bg-[#111111] text-white flex items-center justify-center font-bold text-xs tracking-tight rounded-sm flex-shrink-0 cursor-pointer hover:bg-[#27272a] transition-colors"
          >
            AIP
          </div>
          <button
            onClick={handleToggle}
            title="Expand sidebar (Ctrl+B)"
            className="p-1 text-[#6b7280] hover:text-[#111111] hover:bg-[#f3f4f6] rounded-sm transition-colors"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Authenticated Station Clearance Display */}
      {!isCollapsed ? (
        <div className="p-3 border-b border-[#e5e7eb] bg-[#fafafa]">
          <div className="flex items-center justify-between text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-1 font-mono">
            <span>Active Station</span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded-xs font-mono font-bold ${
                currentUser?.role === "ADMIN"
                  ? "bg-[#fee2e2] text-[#991b1b]"
                  : currentUser?.role === "DATA_ANALYST"
                  ? "bg-[#e0f2fe] text-[#075985]"
                  : currentUser?.role === "POLICY_ANALYST"
                  ? "bg-[#f3e8ff] text-[#6b21a8]"
                  : "bg-[#e5e7eb] text-[#374151]"
              }`}
            >
              {currentUser?.role === "ADMIN"
                ? "LEVEL 4"
                : currentUser?.role === "DATA_ANALYST"
                ? "LEVEL 3"
                : currentUser?.role === "POLICY_ANALYST"
                ? "LEVEL 2"
                : currentUser?.role === "VIEWER"
                ? "LEVEL 1"
                : "PUBLIC"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="font-bold text-xs font-mono text-[#111111] truncate mr-1">
              {activeRolePerspective === "ADMIN"
                ? "Governance Station"
                : activeRolePerspective === "ANALYST"
                ? "Analyst Workstation"
                : "Passenger Station"}
            </div>
            <button
              onClick={onOpenLogin}
              className="text-[10px] font-mono text-[#1e40af] hover:underline flex items-center gap-1 font-bold flex-shrink-0"
              title="Authenticate with another role via Login Page"
            >
              <LogIn className="w-3 h-3" />
              <span>Switch</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="py-2.5 px-1 border-b border-[#e5e7eb] bg-[#fafafa] flex flex-col items-center justify-center">
          <button
            onClick={onOpenLogin}
            title={`Active Station: ${
              activeRolePerspective === "ADMIN"
                ? "Governance Station"
                : activeRolePerspective === "ANALYST"
                ? "Analyst Workstation"
                : "Passenger Station"
            } (${currentUser?.role || "PUBLIC"}). Click to switch/login.`}
            className={`w-9 h-7 rounded-sm flex items-center justify-center text-[10px] font-mono font-bold border transition-colors shadow-2xs ${
              currentUser?.role === "ADMIN"
                ? "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]"
                : currentUser?.role === "DATA_ANALYST"
                ? "bg-[#e0f2fe] text-[#075985] border-[#bae6fd]"
                : currentUser?.role === "POLICY_ANALYST"
                ? "bg-[#f3e8ff] text-[#6b21a8] border-[#e9d5ff]"
                : "bg-[#e5e7eb] text-[#374151] border-[#d1d5db]"
            }`}
          >
            {currentUser?.role === "ADMIN"
              ? "L4"
              : currentUser?.role === "DATA_ANALYST"
              ? "L3"
              : currentUser?.role === "POLICY_ANALYST"
              ? "L2"
              : currentUser?.role === "VIEWER"
              ? "L1"
              : "PUB"}
          </button>
        </div>
      )}

      {/* Navigation Groups */}
      {!isCollapsed ? (
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 text-xs">
          {navSections.map((group) => (
            <div key={group.category} className="space-y-1">
              <div className="px-2.5 text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5 font-mono">
                {group.category}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectSection(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-sm transition-colors text-left ${
                      isActive
                        ? "bg-[#111111] text-white font-medium shadow-2xs"
                        : "text-[#374151] hover:text-[#111111] hover:bg-[#f3f4f6]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-[#6b7280]"}`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3 h-3 text-white/70" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-3 text-xs flex flex-col items-center">
          {navSections.map((group, gIdx) => (
            <div key={group.category} className="w-full flex flex-col items-center space-y-1">
              {gIdx > 0 && <div className="w-6 h-px bg-[#e5e7eb] my-1" />}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectSection(item.id)}
                    title={`${item.label} (${group.category})`}
                    className={`w-10 h-10 flex items-center justify-center rounded-sm transition-all relative ${
                      isActive
                        ? "bg-[#111111] text-white shadow-sm"
                        : "text-[#4b5563] hover:text-[#111111] hover:bg-[#f3f4f6]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#4b5563]"}`} />
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white rounded-r" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Pipeline Trigger (Only for Admin role) */}
      {activeRolePerspective === "ADMIN" && (
        !isCollapsed ? (
          <div className="p-3 border-t border-[#e5e7eb] bg-[#fafafa]">
            <div className="flex items-center justify-between text-[11px] mb-2 text-[#4b5563]">
              <span className="flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-[#15803d] animate-pulse"></span>
                <span className="font-bold text-[#111111]">Ingestion Active</span>
              </span>
              <span className="font-mono text-[10px] text-[#6b7280]">Admin Only</span>
            </div>
            <button
              onClick={onTriggerPipeline}
              disabled={isTriggering}
              className="w-full flex items-center justify-center gap-1.5 text-[11px] font-medium py-1.5 px-2.5 bg-[#ffffff] border border-[#e5e7eb] text-[#111111] rounded-sm hover:bg-[#f9fafb] active:bg-[#f3f4f6] transition-colors disabled:opacity-50 font-mono"
            >
              <RefreshCw className={`w-3 h-3 ${isTriggering ? "animate-spin text-[#6b7280]" : "text-[#111111]"}`} />
              <span>{isTriggering ? "Ingesting..." : "Run Ingestion Cycle"}</span>
            </button>
          </div>
        ) : (
          <div className="p-2 border-t border-[#e5e7eb] bg-[#fafafa] flex justify-center">
            <button
              onClick={onTriggerPipeline}
              disabled={isTriggering}
              title={isTriggering ? "Ingesting..." : "Run Ingestion Cycle (Admin Only)"}
              className="w-10 h-10 flex items-center justify-center rounded-sm bg-[#ffffff] border border-[#e5e7eb] hover:bg-[#f9fafb] active:bg-[#f3f4f6] text-[#111111] transition-colors disabled:opacity-50 shadow-2xs"
            >
              <RefreshCw className={`w-4 h-4 ${isTriggering ? "animate-spin text-[#6b7280]" : "text-[#111111]"}`} />
            </button>
          </div>
        )
      )}

      {/* User Profile & Auth Footer */}
      {!isCollapsed ? (
        <div className="p-3 border-t border-[#e5e7eb] bg-[#ffffff]">
          {currentUser ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-6 h-6 rounded-full bg-[#111111] text-white flex items-center justify-center text-[10px] font-bold font-mono flex-shrink-0">
                  {currentUser.full_name.charAt(0)}
                </div>
                <div className="truncate">
                  <div className="text-[11px] font-medium text-[#111111] truncate">
                    {currentUser.full_name}
                  </div>
                  <div
                    className={`text-[9px] uppercase tracking-wider font-mono font-bold ${
                      currentUser.role === "ADMIN"
                        ? "text-[#b91c1c]"
                        : currentUser.role === "DATA_ANALYST"
                        ? "text-[#0369a1]"
                        : currentUser.role === "POLICY_ANALYST"
                        ? "text-[#7c3aed]"
                        : "text-[#15803d]"
                    }`}
                  >
                    RBAC: {currentUser.role}
                  </div>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 text-[#6b7280] hover:text-[#b91c1c] hover:bg-[#fef2f2] rounded-sm transition-colors flex-shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-1.5 font-mono text-[11px]">
              <button
                onClick={onOpenUserLogin || onOpenLogin}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#111111] text-white rounded-sm hover:bg-[#27272a] transition-colors font-medium shadow-2xs"
              >
                <User className="w-3.5 h-3.5" />
                <span>User &amp; Analyst Sign In</span>
              </button>
              <button
                onClick={onOpenAdminLogin || onOpenLogin}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] rounded-sm hover:bg-[#fee2e2] transition-colors font-bold"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#b91c1c]" />
                <span>Admin Portal Login</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-2 border-t border-[#e5e7eb] bg-[#ffffff] flex flex-col items-center gap-2">
          {currentUser ? (
            <>
              <div
                title={`User: ${currentUser.full_name} (${currentUser.role})`}
                className="w-8 h-8 rounded-full bg-[#111111] text-white flex items-center justify-center text-xs font-bold font-mono cursor-pointer"
                onClick={onOpenLogin}
              >
                {currentUser.full_name.charAt(0)}
              </div>
              <button
                onClick={onLogout}
                title="Sign Out"
                className="w-8 h-8 flex items-center justify-center text-[#6b7280] hover:text-[#b91c1c] hover:bg-[#fef2f2] rounded-sm transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onOpenUserLogin || onOpenLogin}
                title="User & Analyst Sign In"
                className="w-10 h-10 flex items-center justify-center rounded-sm bg-[#111111] text-white hover:bg-[#27272a] transition-colors shadow-2xs"
              >
                <User className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenAdminLogin || onOpenLogin}
                title="Admin Portal Login"
                className="w-10 h-10 flex items-center justify-center rounded-sm bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] hover:bg-[#fee2e2] transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-[#b91c1c]" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Minimize / Expand Toggle Rail at Bottom */}
      <div className="border-t border-[#e5e7eb] bg-[#fafafa] p-1.5 flex items-center justify-center">
        <button
          onClick={handleToggle}
          title={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Minimize sidebar (Ctrl+B)"}
          className="w-full flex items-center justify-center gap-1.5 py-1 px-1.5 text-[11px] font-mono text-[#6b7280] hover:text-[#111111] hover:bg-[#f3f4f6] rounded-sm transition-colors"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-3.5 h-3.5" />
          ) : (
            <>
              <PanelLeftClose className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-wider font-semibold">Minimize</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

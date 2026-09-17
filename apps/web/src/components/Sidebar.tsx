"use client";

import React from "react";
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
  User,
  ShieldCheck,
  Plane,
  Sparkles
} from "lucide-react";

export type RoleMode = "TRAVELLER" | "ANALYST" | "ADMIN";

interface SidebarProps {
  currentSection: string;
  onSelectSection: (section: string) => void;
  currentUser: { id: string; email: string; full_name: string; role: string } | null;
  activeRolePerspective: RoleMode;
  onSelectRolePerspective: (mode: RoleMode) => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  isTriggering: boolean;
  onTriggerPipeline: () => void;
}

export function Sidebar({
  currentSection,
  onSelectSection,
  currentUser,
  activeRolePerspective,
  onSelectRolePerspective,
  onOpenLogin,
  onLogout,
  isTriggering,
  onTriggerPipeline
}: SidebarProps) {
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
    <aside className="w-64 flex-shrink-0 bg-[#ffffff] border-r border-[#e5e7eb] flex flex-col h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#e5e7eb]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#111111] text-white flex items-center justify-center font-bold text-xs tracking-tight rounded-sm">
            AIP
          </div>
          <div>
            <div className="font-semibold text-sm tracking-tight text-[#111111] leading-none">
              India Airfare Intelligence
            </div>
            <div className="text-[10px] text-[#6b7280] tracking-wider uppercase mt-1 font-mono">
              Role Workstation &middot; v1.0
            </div>
          </div>
        </div>
      </div>

      {/* Role Perspective Switcher Pill */}
      <div className="p-3 border-b border-[#e5e7eb] bg-[#fafafa]">
        <div className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-1.5 font-mono">
          Workstation Perspective
        </div>
        <div className="grid grid-cols-3 gap-1 bg-[#f3f4f6] p-0.5 rounded-sm font-mono text-[10px]">
          {(["TRAVELLER", "ANALYST", "ADMIN"] as const).map((mode) => {
            const isSelected = activeRolePerspective === mode;
            return (
              <button
                key={mode}
                onClick={() => onSelectRolePerspective(mode)}
                className={`py-1 text-center font-bold rounded-xs transition-colors ${
                  isSelected
                    ? "bg-[#111111] text-white shadow-2xs"
                    : "text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]"
                }`}
              >
                {mode === "TRAVELLER" ? "User" : mode === "ANALYST" ? "Analyst" : "Admin"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Groups */}
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

      {/* Pipeline Trigger (Only for Admin role) */}
      {activeRolePerspective === "ADMIN" && (
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
      )}

      {/* User Profile & Auth Footer */}
      <div className="p-3 border-t border-[#e5e7eb] bg-[#ffffff]">
        {currentUser ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded-full bg-[#111111] text-white flex items-center justify-center text-[10px] font-bold font-mono">
                {currentUser.full_name.charAt(0)}
              </div>
              <div className="truncate">
                <div className="text-[11px] font-medium text-[#111111] truncate">
                  {currentUser.full_name}
                </div>
                <div className={`text-[9px] uppercase tracking-wider font-mono font-bold ${
                  currentUser.role === "ADMIN"
                    ? "text-[#b91c1c]"
                    : currentUser.role === "ANALYST"
                    ? "text-[#0369a1]"
                    : "text-[#15803d]"
                }`}>
                  {currentUser.role}
                </div>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 text-[#6b7280] hover:text-[#b91c1c] hover:bg-[#fef2f2] rounded-sm transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="w-full flex items-center justify-center gap-1.5 text-[11px] font-medium py-1.5 px-3 bg-[#111111] text-white rounded-sm hover:bg-[#27272a] transition-colors font-mono"
          >
            <LogIn className="w-3 h-3" />
            <span>Sign In / Role Access</span>
          </button>
        )}
      </div>
    </aside>
  );
}

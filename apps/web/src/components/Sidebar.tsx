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
  ChevronRight
} from "lucide-react";

interface SidebarProps {
  currentSection: string;
  onSelectSection: (section: string) => void;
  currentUser: { id: string; email: string; full_name: string; role: string } | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  isTriggering: boolean;
  onTriggerPipeline: () => void;
}

export function Sidebar({
  currentSection,
  onSelectSection,
  currentUser,
  onOpenLogin,
  onLogout,
  isTriggering,
  onTriggerPipeline
}: SidebarProps) {
  const navSections = [
    {
      category: "OVERVIEW",
      items: [
        { id: "overview", label: "Market Overview", icon: TrendingUp }
      ]
    },
    {
      category: "MARKET",
      items: [
        { id: "airfare-index", label: "Airfare Index", icon: TrendingUp },
        { id: "routes", label: "Route Pressure", icon: Compass },
        { id: "airlines", label: "Airline Movements", icon: Layers },
        { id: "booking-windows", label: "Booking Windows", icon: Calendar }
      ]
    },
    {
      category: "DATA",
      items: [
        { id: "quality", label: "Data Quality", icon: CheckCircle2 },
        { id: "sources", label: "Data Sources", icon: Database },
        { id: "collection", label: "Collection Runs", icon: RefreshCw }
      ]
    },
    {
      category: "RESEARCH",
      items: [
        { id: "backtesting", label: "DGCA Benchmark", icon: FlaskConical },
        { id: "methodology", label: "Methodology v1.0", icon: BookOpen },
        { id: "audit-lineage", label: "Audit Lineage", icon: GitBranch }
      ]
    },
    {
      category: "SYSTEM",
      items: [
        { id: "api", label: "API Reference", icon: Terminal },
        { id: "settings", label: "System Config", icon: Settings }
      ]
    }
  ];

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
              Statistical Station &middot; v1.0
            </div>
          </div>
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

      {/* Pipeline Quick Trigger */}
      <div className="p-3 border-t border-[#e5e7eb] bg-[#fafafa]">
        <div className="flex items-center justify-between text-[11px] mb-2 text-[#4b5563]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#15803d] animate-pulse"></span>
            <span className="font-medium text-[#111111]">Feed Active</span>
          </span>
          <span className="font-mono text-[10px] text-[#6b7280]">30-Min Cadence</span>
        </div>
        <button
          onClick={onTriggerPipeline}
          disabled={isTriggering}
          className="w-full flex items-center justify-center gap-1.5 text-[11px] font-medium py-1.5 px-2.5 bg-[#ffffff] border border-[#e5e7eb] text-[#111111] rounded-sm hover:bg-[#f9fafb] active:bg-[#f3f4f6] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isTriggering ? "animate-spin text-[#6b7280]" : "text-[#111111]"}`} />
          <span>{isTriggering ? "Calculating..." : "Run Ingestion Cycle"}</span>
        </button>
      </div>

      {/* System Status & User Profile Footer */}
      <div className="p-3 border-t border-[#e5e7eb] bg-[#ffffff]">
        {currentUser ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded-full bg-[#111111] text-white flex items-center justify-center text-[10px] font-bold">
                {currentUser.full_name.charAt(0)}
              </div>
              <div className="truncate">
                <div className="text-[11px] font-medium text-[#111111] truncate">
                  {currentUser.full_name}
                </div>
                <div className="text-[10px] text-[#6b7280] uppercase tracking-wider font-mono">
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
            className="w-full flex items-center justify-center gap-1.5 text-[11px] font-medium py-1.5 px-3 bg-[#111111] text-white rounded-sm hover:bg-[#27272a] transition-colors"
          >
            <LogIn className="w-3 h-3" />
            <span>Sign In / Access Keys</span>
          </button>
        )}
      </div>
    </aside>
  );
}

"use client";

import React from "react";
import { Plane, User, LogOut, RefreshCw, FileText, ArrowRight } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface HeaderProps {
  currentView: "landing" | "dashboard";
  onViewChange: (view: "landing" | "dashboard") => void;
  currentUser: UserProfile | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenLineage: () => void;
  onTriggerPipeline: () => void;
  isTriggering: boolean;
}

export function Header({
  currentView,
  onViewChange,
  currentUser,
  onOpenLogin,
  onLogout,
  onOpenLineage,
  onTriggerPipeline,
  isTriggering,
}: HeaderProps) {
  return (
    <header className="border-b border-zinc-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Mode Switcher */}
        <div className="flex items-center gap-6">
          <div
            onClick={() => onViewChange("landing")}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="h-8 w-8 rounded-lg bg-black text-white flex items-center justify-center transition-colors">
              <Plane className="h-4 w-4 transform -rotate-45" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                RT-APIP
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 border border-zinc-200 text-zinc-600 font-normal">
                  India
                </span>
              </div>
              <div className="text-[10px] text-zinc-500 hidden sm:block">
                National Airfare Price Index
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
            <button
              onClick={() => onViewChange("landing")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                currentView === "landing"
                  ? "text-zinc-900 bg-zinc-100 font-semibold"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              About &amp; Methodology
            </button>
            <button
              onClick={() => onViewChange("dashboard")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                currentView === "dashboard"
                  ? "text-zinc-900 bg-zinc-100 font-semibold"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Live Price Dashboard
            </button>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Audit Lineage */}
          {currentView === "dashboard" && (
            <button
              onClick={onOpenLineage}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-300 text-xs font-medium text-zinc-700 hover:text-zinc-900 transition-colors shadow-xs"
            >
              <FileText className="h-3.5 w-3.5 text-zinc-500" />
              Audit Lineage
            </button>
          )}

          {/* Run Pipeline */}
          {currentView === "dashboard" && (
            <button
              onClick={onTriggerPipeline}
              disabled={isTriggering}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black hover:bg-zinc-800 active:bg-zinc-900 disabled:opacity-50 text-xs font-semibold text-white transition-colors shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isTriggering ? "animate-spin" : ""}`} />
              {isTriggering ? "Running..." : "Collect Today"}
            </button>
          )}

          {/* User Profile or Sign In */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-200">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-100 border border-zinc-200 text-xs text-zinc-700">
                <User className="h-3.5 w-3.5 text-zinc-900" />
                <span className="font-semibold text-zinc-900 max-w-[100px] truncate">{currentUser.full_name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-700">
                  {currentUser.role}
                </span>
              </div>
              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-xs font-medium text-zinc-900 transition-colors flex items-center gap-1.5"
            >
              <User className="h-3.5 w-3.5 text-zinc-600" />
              Sign In
            </button>
          )}

          {/* Switch View CTA if on Landing */}
          {currentView === "landing" && (
            <button
              onClick={() => onViewChange("dashboard")}
              className="px-3.5 py-1.5 rounded-lg bg-black hover:bg-zinc-800 text-xs font-semibold text-white transition-colors flex items-center gap-1 shadow-xs"
            >
              Open Dashboard
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

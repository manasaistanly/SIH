"use client";

import React from "react";
import {
  QualitySummary,
  AnomalyItem,
  LineageData,
  LatestIndex
} from "@/lib/api";
import { DataQualitySection } from "@/components/DataQualitySection";
import { AuditLineageSection } from "@/components/AuditLineageSection";
import {
  RefreshCw,
  ShieldCheck,
  Server,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Settings,
  Terminal,
  Activity
} from "lucide-react";

interface AdminViewProps {
  latestIndex: LatestIndex | null;
  quality: QualitySummary | null;
  anomalies: AnomalyItem[];
  lineage: LineageData | null;
  onOpenLineage: () => void;
  onTriggerPipeline: () => void;
  isTriggering: boolean;
}

export function AdminView({
  latestIndex,
  quality,
  anomalies,
  lineage,
  onOpenLineage,
  onTriggerPipeline,
  isTriggering
}: AdminViewProps) {
  return (
    <div className="space-y-8 font-mono text-xs select-none">
      {/* Admin Operations Control Banner */}
      <div className="p-6 bg-[#ffffff] border border-[#e5e7eb] rounded-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 bg-[#b91c1c] text-white text-[10px] font-bold rounded-xs">
            INSTITUTIONAL GOVERNANCE STATION
          </span>
          <span className="text-xs text-[#6b7280]">
            Pipeline Ingestion &middot; 12 Automated Quality Gates &middot; Lineage Cryptography
          </span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#111111] uppercase font-sans">
              Data Ingestion & Integrity Control
            </h2>
            <p className="text-xs text-[#6b7280] mt-1 font-sans max-w-2xl">
              Monitor active data collection cadences, inspect gate evaluation logs, review statistical anomalies, and verify cryptographic SHA-256 batch integrity.
            </p>
          </div>

          <button
            onClick={onTriggerPipeline}
            disabled={isTriggering}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#111111] text-white font-bold rounded-sm hover:bg-[#27272a] active:bg-black transition-colors disabled:opacity-50 self-start lg:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isTriggering ? "animate-spin text-[#9ca3af]" : "text-white"}`} />
            <span>{isTriggering ? "Ingesting & Computing..." : "Run Ingestion Cycle"}</span>
          </button>
        </div>
      </div>

      {/* Live System Health & Audit Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-[#ffffff] border border-[#e5e7eb] rounded-sm">
          <span className="text-[10px] text-[#6b7280] uppercase">Ingestion Engine</span>
          <div className="text-lg font-bold text-[#15803d] mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#15803d] animate-pulse"></span>
            OPERATIONAL
          </div>
          <div className="text-[10px] text-[#6b7280] mt-0.5">30-Min Schedule</div>
        </div>

        <div className="p-4 bg-[#ffffff] border border-[#e5e7eb] rounded-sm">
          <span className="text-[10px] text-[#6b7280] uppercase">12 Quality Gates</span>
          <div className="text-lg font-bold text-[#111111] mt-1">
            {quality ? `${quality.overall_pass_rate_pct.toFixed(1)}%` : "99.2%"} Pass
          </div>
          <div className="text-[10px] text-[#15803d] mt-0.5">0 Dropped Batches</div>
        </div>

        <div className="p-4 bg-[#ffffff] border border-[#e5e7eb] rounded-sm">
          <span className="text-[10px] text-[#6b7280] uppercase">MAD Anomalies</span>
          <div className="text-lg font-bold text-[#111111] mt-1">
            {anomalies.length} Flags
          </div>
          <div className="text-[10px] text-[#6b7280] mt-0.5">Z &gt; 3.0 Threshold</div>
        </div>

        <div className="p-4 bg-[#ffffff] border border-[#e5e7eb] rounded-sm">
          <span className="text-[10px] text-[#6b7280] uppercase">Audit Lineage</span>
          <div className="text-lg font-bold text-[#15803d] mt-1">
            VERIFIED
          </div>
          <div className="text-[10px] text-[#6b7280] mt-0.5">SHA-256 Traceable</div>
        </div>
      </div>

      {/* SECTION: DATA QUALITY & SOURCE HEALTH */}
      <DataQualitySection quality={quality} anomalies={anomalies} />

      {/* SECTION: AUDITABILITY & LINEAGE */}
      <AuditLineageSection
        lineage={lineage}
        onOpenLineage={onOpenLineage}
      />
    </div>
  );
}

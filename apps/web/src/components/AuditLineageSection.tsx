"use client";

import React from "react";
import { GitBranch, ShieldCheck, ArrowRight, FileJson, CheckCircle } from "lucide-react";
import { LineageData } from "@/lib/api";

interface AuditLineageSectionProps {
  lineage: LineageData | null;
  onOpenLineage: () => void;
}

export function AuditLineageSection({ lineage, onOpenLineage }: AuditLineageSectionProps) {
  const traceNodes = [
    { name: "01. ROUTE BASKET", desc: "6 Core Metros & Weights" },
    { name: "02. OBSERVATIONS", desc: "3,060 Verified Quotes" },
    { name: "03. COLLECTION RUN", desc: "SHA-256 Checksum" },
    { name: "04. SOURCE AGGREGATION", desc: "Direct Carrier & GDS" },
    { name: "05. RAW SNAPSHOT", desc: "Immutable Payload" },
    { name: "06. METHODOLOGY v1.0", desc: "Jevons-Laspeyres Chain" }
  ];

  return (
    <section className="bg-[#ffffff] border border-[#e5e7eb] rounded-sm p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280] font-mono">
              Cryptographic Auditability & Reproducibility
            </span>
            <span className="px-1.5 py-0.2 text-[10px] font-mono bg-[#f0fdf4] text-[#15803d] rounded-xs border border-[#bbf7d0] flex items-center gap-1">
              <CheckCircle className="w-2.5 h-2.5" />
              Fully Traceable
            </span>
          </div>

          <h3 className="text-base font-bold text-[#111111] uppercase tracking-tight">
            Institutional Audit Lineage
          </h3>

          <p className="text-xs text-[#6b7280] leading-relaxed">
            Every index value is mathematically reproducible and verifiable. Each published index point links directly to its underlying route medians, advance-purchase observations, collection runs, immutable source snapshots, and versioned formula rules.
          </p>

          {/* Traceability Flow Nodes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2">
            {traceNodes.map((n, i) => (
              <div key={n.name} className="p-2 bg-[#fafafa] border border-[#f3f4f6] rounded-xs font-mono text-[10px]">
                <div className="font-bold text-[#111111] truncate">{n.name}</div>
                <div className="text-[#6b7280] text-[9px] truncate mt-0.5">{n.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex-shrink-0">
          <button
            onClick={onOpenLineage}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[#111111] text-white text-xs font-mono font-medium rounded-sm hover:bg-[#27272a] active:bg-black transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>VIEW AUDIT LINEAGE</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </div>
    </section>
  );
}

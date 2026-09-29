"use client";

import React, { useState } from "react";
import {
  Search,
  Download,
  Calendar,
  Layers,
  TrendingUp,
  Clock,
  Compass,
  FileSpreadsheet,
  FileJson,
  FileText,
  CheckCircle2,
  Filter,
  ArrowRight,
  Plane
} from "lucide-react";
import { MapRouteItem, RouteIntelligence, RouteIndex } from "@/lib/api";

export type TrendMode = "DAILY" | "WEEKLY" | "MONTHLY";
export type VariationWindow = "T+1" | "T+7" | "T+30";
export type ChartViewMode = "ROUTES" | "AIRLINES" | "SECTOR_WISE";

interface UserWorkflowFiltersProps {
  routes: MapRouteItem[];
  routeIndices: RouteIndex[];
  selectedRouteCode: string;
  onSelectRoute: (routeCode: string) => void;
  intelligence: RouteIntelligence | null;
  activeTrend: TrendMode;
  onChangeTrend: (trend: TrendMode) => void;
  activeVariation: VariationWindow;
  onChangeVariation: (variation: VariationWindow) => void;
  activeChartView: ChartViewMode;
  onChangeChartView: (view: ChartViewMode) => void;
}

export function UserWorkflowFilters({
  routes,
  routeIndices,
  selectedRouteCode,
  onSelectRoute,
  intelligence,
  activeTrend,
  onChangeTrend,
  activeVariation,
  onChangeVariation,
  activeChartView,
  onChangeChartView,
}: UserWorkflowFiltersProps) {
  const [origin, setOrigin] = useState("DEL");
  const [destination, setDestination] = useState("BOM");
  const [travelDate, setTravelDate] = useState("2026-10-20");
  const [selectedSector, setSelectedSector] = useState("ALL");
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Match current route data
  const currentRoute = routeIndices.find((r) => r.route_code === selectedRouteCode) || {
    route_code: selectedRouteCode,
    current_index: intelligence?.observed_fares?.current_index ?? 114.2,
    current_median_fare: intelligence?.observed_fares?.current_median ?? 5540,
    base_median_fare: intelligence?.observed_fares?.base_median ?? 4850,
    observation_count: intelligence?.observed_fares?.observation_count ?? 30,
    daily_change_pct: intelligence?.observed_fares?.change_7d_pct ? intelligence.observed_fares.change_7d_pct / 7 : 0.55,
  };

  const handleApplySearch = (e: React.FormEvent) => {
    e.preventDefault();
    const candidateCode = `${origin}-${destination}`;
    const reverseCandidate = `${destination}-${origin}`;
    const found = routes.find((r) => r.route_code === candidateCode || r.route_code === reverseCandidate);
    if (found) {
      onSelectRoute(found.route_code);
    } else {
      onSelectRoute("DEL-BOM");
    }
  };

  // Export functions (User exports the required data)
  const handleExportCSV = () => {
    setIsExporting(true);
    const headers = [
      "Route_Code",
      "Origin",
      "Destination",
      "Trend_Mode",
      "Variation_Window",
      "Current_Index",
      "Current_Median_Fare_INR",
      "Base_Median_Fare_INR",
      "Daily_Change_Pct",
      "Sample_Size",
      "Timestamp"
    ];
    
    const rows = (routeIndices.length > 0 ? routeIndices : [currentRoute]).map((r) => [
      r.route_code,
      r.route_code.split("-")[0],
      r.route_code.split("-")[1],
      activeTrend,
      activeVariation,
      r.current_index.toFixed(2),
      r.current_median_fare,
      r.base_median_fare,
      r.daily_change_pct ?? 0,
      r.observation_count,
      new Date().toISOString()
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `RT_APIP_${selectedRouteCode}_${activeTrend}_${activeVariation}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExporting(false);
    setExportNotice("Exported CSV dataset successfully.");
    setTimeout(() => setExportNotice(null), 3500);
  };

  const handleExportJSON = () => {
    setIsExporting(true);
    const payload = {
      platform: "RT-APIP National Airfare Platform",
      generated_at: new Date().toISOString(),
      filters: {
        trend_mode: activeTrend,
        variation_window: activeVariation,
        chart_view: activeChartView,
        sector: selectedSector,
        travel_date: travelDate,
      },
      selected_route: currentRoute,
      all_monitored_routes: routeIndices,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `RT_APIP_Dataset_${activeTrend}_${activeVariation}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExporting(false);
    setExportNotice("Exported JSON payload successfully.");
    setTimeout(() => setExportNotice(null), 3500);
  };

  return (
    <div className="bg-[#ffffff] border border-[#e5e7eb] rounded-sm p-6 shadow-xs font-sans space-y-6">
      {/* Workflow Step Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e5e7eb]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-[#111111] text-white text-[10px] font-mono font-bold rounded-xs tracking-wider">
              USER WORKFLOW CONTROL
            </span>
            <span className="text-xs font-mono text-[#6b7280]">
              Dashboard &rarr; Filters &rarr; Airfare Results &rarr; Data Export
            </span>
          </div>
          <h2 className="text-lg font-bold text-[#111111] tracking-tight uppercase">
            National Airfare Exploration & Yield Filter Matrix
          </h2>
        </div>

        {/* User exports the required data */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] text-white text-xs font-mono font-bold rounded-sm hover:bg-[#27272a] transition-colors shadow-xs"
            title="Download CSV dataset formatted for econometric modeling"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fafafa] border border-[#e5e7eb] text-[#111111] text-xs font-mono font-bold rounded-sm hover:bg-[#f4f4f5] transition-colors"
            title="Download structured JSON payload"
          >
            <FileJson className="w-3.5 h-3.5 text-[#6b7280]" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-2.5 bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] text-xs font-mono flex items-center gap-2 rounded-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#059669]" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Row 1: Search Inputs (From, To, Date, Sector) */}
      <form onSubmit={handleApplySearch} className="grid grid-cols-1 sm:grid-cols-5 gap-3 font-mono text-xs">
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#6b7280] mb-1">From Airport</label>
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full p-2 bg-[#fafafa] border border-[#e5e7eb] rounded-sm text-[#111111] font-medium focus:outline-none focus:border-[#111111]"
          >
            <option value="DEL">Delhi (DEL)</option>
            <option value="BOM">Mumbai (BOM)</option>
            <option value="BLR">Bengaluru (BLR)</option>
            <option value="MAA">Chennai (MAA)</option>
            <option value="CCU">Kolkata (CCU)</option>
            <option value="HYD">Hyderabad (HYD)</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-bold text-[#6b7280] mb-1">To Airport</label>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full p-2 bg-[#fafafa] border border-[#e5e7eb] rounded-sm text-[#111111] font-medium focus:outline-none focus:border-[#111111]"
          >
            <option value="BOM">Mumbai (BOM)</option>
            <option value="DEL">Delhi (DEL)</option>
            <option value="BLR">Bengaluru (BLR)</option>
            <option value="CCU">Kolkata (CCU)</option>
            <option value="HYD">Hyderabad (HYD)</option>
            <option value="MAA">Chennai (MAA)</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-bold text-[#6b7280] mb-1">Travel Date</label>
          <input
            type="date"
            value={travelDate}
            onChange={(e) => setTravelDate(e.target.value)}
            className="w-full p-2 bg-[#fafafa] border border-[#e5e7eb] rounded-sm text-[#111111] font-medium focus:outline-none focus:border-[#111111]"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase font-bold text-[#6b7280] mb-1">Sector Class</label>
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="w-full p-2 bg-[#fafafa] border border-[#e5e7eb] rounded-sm text-[#111111] font-medium focus:outline-none focus:border-[#111111]"
          >
            <option value="ALL">All Domestic Routes</option>
            <option value="METRO">Metro &ndash; Metro Trunk</option>
            <option value="TIER1">Metro &ndash; Tier-2 Regional</option>
            <option value="UDAN">UDAN RCS Priority</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full p-2 bg-[#111111] text-white font-bold rounded-sm hover:bg-[#27272a] transition-colors flex items-center justify-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Airfare</span>
          </button>
        </div>
      </form>

      {/* Row 2: Airfare Result Displayed (Summary Card) */}
      <div className="p-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-sm grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <span className="text-[10px] font-mono text-[#6b7280] uppercase">Selected Route</span>
          <div className="text-base font-bold text-[#111111] font-mono flex items-center gap-1 mt-0.5">
            <Plane className="w-4 h-4 text-[#111111]" />
            {selectedRouteCode}
          </div>
          <span className="text-[10px] font-mono text-[#15803d]">Monitored Trunk Basket</span>
        </div>

        <div>
          <span className="text-[10px] font-mono text-[#6b7280] uppercase">Airfare Index</span>
          <div className="text-base font-bold text-[#111111] font-mono mt-0.5">
            {currentRoute.current_index.toFixed(1)}
          </div>
          <span className="text-[10px] font-mono text-[#6b7280]">
            Base = 100.0 (Jan 2024)
          </span>
        </div>

        <div>
          <span className="text-[10px] font-mono text-[#6b7280] uppercase">Current Median Fare</span>
          <div className="text-base font-bold text-[#111111] font-mono mt-0.5">
            ₹{currentRoute.current_median_fare.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] font-mono text-[#6b7280]">
            Base: ₹{currentRoute.base_median_fare.toLocaleString("en-IN")}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-mono text-[#6b7280] uppercase">Price Variation</span>
          <div className={`text-base font-bold font-mono mt-0.5 ${
            currentRoute.current_index >= 100 ? "text-[#b91c1c]" : "text-[#15803d]"
          }`}>
            {currentRoute.current_index >= 100 ? "+" : ""}
            {(currentRoute.current_index - 100).toFixed(1)}% vs Base
          </div>
          <span className="text-[10px] font-mono text-[#6b7280]">
            Active Sample: {currentRoute.observation_count} quotes
          </span>
        </div>
      </div>

      {/* Row 3: 3-Tier Dedicated Filter Controls (matching diagram directly) */}
      <div className="p-4 bg-[#ffffff] border border-[#e5e7eb] rounded-sm space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#111111]" />
          <h3 className="text-xs font-mono font-bold uppercase text-[#111111] tracking-wide">
            Filter Dimensions
          </h3>
          <span className="text-[10px] font-mono text-[#6b7280]">
            Configure analysis horizon, advance yield window, and visualization layer
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {/* Dimension 1: Airfare Price Index Trends */}
          <div className="p-3 bg-[#fafafa] border border-[#e5e7eb] rounded-sm">
            <div className="flex items-center gap-1.5 mb-2 text-[#4b5563] font-bold text-[11px] uppercase">
              <TrendingUp className="w-3.5 h-3.5 text-[#111111]" />
              <span>Airfare Price Index Trends</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(["DAILY", "WEEKLY", "MONTHLY"] as TrendMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onChangeTrend(mode)}
                  className={`py-1.5 text-center text-xs font-bold rounded-xs transition-colors border ${
                    activeTrend === mode
                      ? "bg-[#111111] text-white border-[#111111] shadow-xs"
                      : "bg-[#ffffff] text-[#4b5563] border-[#d1d5db] hover:bg-[#f3f4f6]"
                  }`}
                >
                  {mode.charAt(0) + mode.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Dimension 2: Airfare Variations */}
          <div className="p-3 bg-[#fafafa] border border-[#e5e7eb] rounded-sm">
            <div className="flex items-center gap-1.5 mb-2 text-[#4b5563] font-bold text-[11px] uppercase">
              <Clock className="w-3.5 h-3.5 text-[#111111]" />
              <span>Airfare Variations</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(["T+1", "T+7", "T+30"] as VariationWindow[]).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => onChangeVariation(w)}
                  className={`py-1.5 text-center text-xs font-bold rounded-xs transition-colors border ${
                    activeVariation === w
                      ? "bg-[#15803d] text-white border-[#15803d] shadow-xs"
                      : "bg-[#ffffff] text-[#4b5563] border-[#d1d5db] hover:bg-[#f3f4f6]"
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Dimension 3: Charts and Heatmaps */}
          <div className="p-3 bg-[#fafafa] border border-[#e5e7eb] rounded-sm">
            <div className="flex items-center gap-1.5 mb-2 text-[#4b5563] font-bold text-[11px] uppercase">
              <Layers className="w-3.5 h-3.5 text-[#111111]" />
              <span>Charts and Heatmaps</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "ROUTES", label: "Routes" },
                { id: "AIRLINES", label: "Airlines" },
                { id: "SECTOR_WISE", label: "Sector wise" }
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onChangeChartView(c.id as ChartViewMode)}
                  className={`py-1.5 text-center text-xs font-bold rounded-xs transition-colors border ${
                    activeChartView === c.id
                      ? "bg-[#1e40af] text-white border-[#1e40af] shadow-xs"
                      : "bg-[#ffffff] text-[#4b5563] border-[#d1d5db] hover:bg-[#f3f4f6]"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

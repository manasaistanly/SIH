"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { MapRouteItem } from "@/lib/api";
import {
  Layers,
  MapPin,
  TrendingUp,
  AlertTriangle,
  Compass,
  Maximize2,
  Info,
  ChevronRight,
  Plane
} from "lucide-react";

export type MapMode =
  | "current_fare"
  | "change_7d"
  | "change_30d"
  | "historical_deviation"
  | "anomalies"
  | "passenger_volume"
  | "index_contribution"
  | "booking_pressure";

interface IndiaAirfareMapProps {
  routes: MapRouteItem[];
  selectedRouteCode: string | null;
  onSelectRoute: (routeCode: string) => void;
  onSelectAirport?: (iata: string) => void;
}

export function IndiaAirfareMap({
  routes,
  selectedRouteCode,
  onSelectRoute,
  onSelectAirport
}: IndiaAirfareMapProps) {
  const [activeMode, setActiveMode] = useState<MapMode>("change_30d");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [googleMapsFailed, setGoogleMapsFailed] = useState(false);
  const [hoveredRoute, setHoveredRoute] = useState<MapRouteItem | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapInstanceRef = useRef<any>(null);
  const polylinesRef = useRef<any[]>([]);
  const markersRef = useRef<any[]>([]);

  // Collect unique airports from routes
  const airports = useMemo(() => {
    const map = new Map<string, { iata: string; name: string; city: string; lat: number; lng: number; routesCount: number }>();
    routes.forEach((r) => {
      if (!map.has(r.origin.iata)) {
        map.set(r.origin.iata, { ...r.origin, routesCount: 1 });
      } else {
        map.get(r.origin.iata)!.routesCount += 1;
      }
      if (!map.has(r.destination.iata)) {
        map.set(r.destination.iata, { ...r.destination, routesCount: 1 });
      } else {
        map.get(r.destination.iata)!.routesCount += 1;
      }
    });
    return Array.from(map.values());
  }, [routes]);

  // Map Mode Metadata
  const modeConfigs: Record<
    MapMode,
    { label: string; desc: string; unit: string; format: (val: any) => string }
  > = {
    current_fare: {
      label: "Current Fare",
      desc: "Absolute current median airfare across monitored quotes",
      unit: "₹",
      format: (m) => `₹${Math.round(m.current_fare).toLocaleString()}`
    },
    change_7d: {
      label: "7D Price Change",
      desc: "Rolling 7-day corridor price percentage movement",
      unit: "%",
      format: (m) => `${m.change_7d_pct >= 0 ? "+" : ""}${m.change_7d_pct.toFixed(1)}%`
    },
    change_30d: {
      label: "30D Price Change",
      desc: "Monthly corridor price movement vs 30 days ago",
      unit: "%",
      format: (m) => `${m.change_30d_pct >= 0 ? "+" : ""}${m.change_30d_pct.toFixed(1)}%`
    },
    historical_deviation: {
      label: "Historical Deviation",
      desc: "Corridor price delta relative to base period (Jan 2024 = 100)",
      unit: "%",
      format: (m) => `${m.historical_deviation_pct >= 0 ? "+" : ""}${m.historical_deviation_pct.toFixed(1)}%`
    },
    anomalies: {
      label: "Statistical Anomalies",
      desc: "Corridors flagged by MAD outlier detector (Z > 3.0)",
      unit: "",
      format: (m) => (m.anomaly_flag ? "ELEVATED ANOMALY" : "NORMAL")
    },
    passenger_volume: {
      label: "Passenger Volume",
      desc: "DGCA official annual traffic weighting in national basket",
      unit: "wt",
      format: (m) => `${(m.passenger_volume_weight * 100).toFixed(0)}% Basket Wt`
    },
    index_contribution: {
      label: "Index Contribution",
      desc: "Weighted basis points contributed to the National Airfare Price Index",
      unit: "pts",
      format: (m) => `${m.national_index_contribution >= 0 ? "+" : ""}${m.national_index_contribution.toFixed(2)} pts`
    },
    booking_pressure: {
      label: "Booking Pressure",
      desc: "Yield curve spread between T+1 immediate and T+30 advance fares",
      unit: "%",
      format: (m) => `+${m.booking_pressure_spread_pct.toFixed(0)}% T+1 Spread`
    }
  };

  // Google Maps Style: Institutional Minimalist (Light Neutral #FAFAFA, subtle borders)
  const mapStyles = [
    { elementType: "geometry", stylers: [{ color: "#f8f9fa" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#495057" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
    { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#ced4da" }, { weight: 1 }] },
    { featureType: "administrative.province", elementType: "geometry.stroke", stylers: [{ color: "#e9ecef" }, { weight: 0.5 }] },
    { featureType: "landscape", stylers: [{ color: "#fcfcfc" }] },
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "road", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "water", stylers: [{ color: "#e3edf7" }] }
  ];

  // Helper for mode line color & stroke weight
  const getRouteStyling = (r: MapRouteItem, isSelected: boolean) => {
    const m = r.mode_metrics;
    let color = "#111111";
    let weight = 2.5;
    let opacity = 0.85;

    if (activeMode === "change_7d" || activeMode === "change_30d" || activeMode === "historical_deviation") {
      const val = activeMode === "change_7d" ? m.change_7d_pct : activeMode === "change_30d" ? m.change_30d_pct : m.historical_deviation_pct;
      color = val > 3 ? "#b91c1c" : val < -1 ? "#15803d" : "#4b5563";
      weight = isSelected ? 4.5 : Math.max(2, Math.min(5, Math.abs(val) / 2));
    } else if (activeMode === "anomalies") {
      color = m.anomaly_flag ? "#b91c1c" : "#9ca3af";
      weight = m.anomaly_flag ? 4 : 1.8;
      opacity = m.anomaly_flag ? 1.0 : 0.4;
    } else if (activeMode === "passenger_volume") {
      color = "#0f172a";
      weight = Math.max(2, m.passenger_volume_weight * 14);
    } else if (activeMode === "index_contribution") {
      color = m.national_index_contribution > 10 ? "#b91c1c" : "#1e293b";
      weight = Math.max(2, Math.abs(m.national_index_contribution) / 3);
    } else if (activeMode === "current_fare") {
      color = m.current_fare > 8000 ? "#b91c1c" : m.current_fare < 5000 ? "#15803d" : "#111111";
    }

    if (isSelected) {
      color = "#000000";
      weight = 5;
      opacity = 1.0;
    }

    return { color, weight, opacity };
  };

  // Load Google Maps Script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyDMBnA2Ud3NySBkP9CrcttVXa5yS_AHmuE";
    if (!apiKey) {
      setGoogleMapsFailed(true);
      return;
    }

    if ((window as any).google && (window as any).google.maps) {
      setMapLoaded(true);
      return;
    }

    const scriptId = "google-maps-script";
    if (document.getElementById(scriptId)) {
      setMapLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => {
      console.warn("Google Maps failed to load, falling back to SVG India layer.");
      setGoogleMapsFailed(true);
    };

    document.head.appendChild(script);
  }, []);

  // Initialize Google Maps instance
  useEffect(() => {
    if (!mapLoaded || googleMapsFailed || !mapContainerRef.current || !(window as any).google?.maps) {
      return;
    }

    if (!googleMapInstanceRef.current) {
      const map = new (window as any).google.maps.Map(mapContainerRef.current, {
        center: { lat: 21.7679, lng: 78.8718 }, // Geographic center of India
        zoom: 4.8,
        minZoom: 4,
        maxZoom: 9,
        styles: mapStyles,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: "cooperative"
      });
      googleMapInstanceRef.current = map;
    }

    const map = googleMapInstanceRef.current;

    // Clear previous polylines & markers
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // Render Routes as Geodesic Flight Paths
    routes.forEach((r) => {
      const isSelected = selectedRouteCode === r.route_code;
      const styling = getRouteStyling(r, isSelected);

      const polyline = new (window as any).google.maps.Polyline({
        path: [
          { lat: r.origin.lat, lng: r.origin.lng },
          { lat: r.destination.lat, lng: r.destination.lng }
        ],
        geodesic: true,
        strokeColor: styling.color,
        strokeOpacity: styling.opacity,
        strokeWeight: styling.weight,
        map: map,
        zIndex: isSelected ? 20 : 5
      });

      polyline.addListener("click", () => {
        onSelectRoute(r.route_code);
      });

      polyline.addListener("mouseover", () => {
        setHoveredRoute(r);
        polyline.setOptions({ strokeColor: "#000000", strokeWeight: styling.weight + 2 });
      });

      polyline.addListener("mouseout", () => {
        setHoveredRoute(null);
        polyline.setOptions({ strokeColor: styling.color, strokeWeight: styling.weight });
      });

      polylinesRef.current.push(polyline);
    });

    // Render Airport Markers
    airports.forEach((a) => {
      const marker = new (window as any).google.maps.Marker({
        position: { lat: a.lat, lng: a.lng },
        map: map,
        title: `${a.iata} - ${a.city}`,
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 5,
          fillColor: "#111111",
          fillOpacity: 0.9,
          strokeColor: "#ffffff",
          strokeWeight: 1.5
        }
      });

      marker.addListener("click", () => {
        if (onSelectAirport) onSelectAirport(a.iata);
      });

      markersRef.current.push(marker);
    });
  }, [mapLoaded, googleMapsFailed, routes, activeMode, selectedRouteCode]);

  // Selected route data
  const activeRouteData = routes.find((r) => r.route_code === selectedRouteCode);

  return (
    <div className="bg-[#ffffff] border border-[#e5e7eb] rounded-sm overflow-hidden flex flex-col select-none">
      {/* Map Control Toolbar */}
      <div className="p-4 bg-[#ffffff] border-b border-[#e5e7eb] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-xs bg-[#111111]"></span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280] font-mono">
              Geographic Intelligence Layer &middot; Google Maps Platform
            </span>
          </div>
          <h3 className="text-base font-bold text-[#111111] uppercase tracking-tight">
            Interactive India Airfare Map
          </h3>
          <p className="text-xs text-[#6b7280]">
            Select any corridor or airport pin to load live observations, yield curve, and price predictions.
          </p>
        </div>

        {/* 8-Mode Analytical Filter Selector */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 font-mono text-xs">
          <span className="text-[10px] text-[#9ca3af] uppercase font-semibold mr-1">Mode:</span>
          {(
            [
              { id: "change_30d", label: "30D Change" },
              { id: "current_fare", label: "Current Fare" },
              { id: "7d_change", idKey: "change_7d", label: "7D Change" },
              { id: "historical_deviation", label: "Hist Deviation" },
              { id: "anomalies", label: "Anomalies" },
              { id: "passenger_volume", label: "Passenger Vol" },
              { id: "index_contribution", label: "Index Contrib" },
              { id: "booking_pressure", label: "Booking Pressure" }
            ] as const
          ).map((m: any) => {
            const modeId = m.idKey || m.id;
            const isActive = activeMode === modeId;
            return (
              <button
                key={modeId}
                onClick={() => setActiveMode(modeId as MapMode)}
                className={`px-2.5 py-1 rounded-xs transition-colors whitespace-nowrap text-[11px] font-medium border ${
                  isActive
                    ? "bg-[#111111] text-white border-[#111111]"
                    : "bg-[#fafafa] text-[#4b5563] border-[#e5e7eb] hover:bg-[#f3f4f6]"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode Sub-banner Description */}
      <div className="px-4 py-2 bg-[#fafafa] border-b border-[#e5e7eb] flex items-center justify-between text-xs font-mono text-[#4b5563]">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-[#6b7280]" />
          <span>
            Active Layer: <strong className="text-[#111111]">{modeConfigs[activeMode].label}</strong> &mdash; {modeConfigs[activeMode].desc}
          </span>
        </div>
        <div className="text-[11px] text-[#6b7280] hidden sm:block">
          Click any flight corridor line to inspect
        </div>
      </div>

      {/* Main Map Viewport (Google Maps / SVG Fallback) */}
      <div className="relative w-full h-[460px] bg-[#fbfbfb]">
        {/* Google Maps Container */}
        {!googleMapsFailed && (
          <div ref={mapContainerRef} className="w-full h-full" />
        )}

        {/* Seamless Interactive SVG Fallback if Google Maps is disabled or offline */}
        {googleMapsFailed && (
          <div className="w-full h-full relative flex items-center justify-center p-4">
            <svg
              viewBox="65 5 35 35"
              className="w-full h-full max-h-[440px] cursor-crosshair select-none"
              style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.03))" }}
            >
              {/* India Base Geo Outline representation */}
              <path
                d="M 74 35 L 77 34 L 80 32 L 85 30 L 88 26 L 92 27 L 95 24 L 92 22 L 88 23 L 88 20 L 85 18 L 81 19 L 77 20 L 75 16 L 73 14 L 71 16 L 72 20 L 70 23 L 73 28 L 74 35 Z"
                fill="#f8fafc"
                stroke="#e2e8f0"
                strokeWidth="0.4"
              />

              {/* Connecting Corridors */}
              {routes.map((r) => {
                const isSelected = selectedRouteCode === r.route_code;
                const styling = getRouteStyling(r, isSelected);

                // Curved SVG quadratic bezier path
                const x1 = r.origin.lng;
                const y1 = 42 - r.origin.lat;
                const x2 = r.destination.lng;
                const y2 = 42 - r.destination.lat;
                const mx = (x1 + x2) / 2 + (y1 - y2) * 0.15;
                const my = (y1 + y2) / 2 + (x2 - x1) * 0.15;

                return (
                  <g key={r.route_code} onClick={() => onSelectRoute(r.route_code)} className="cursor-pointer">
                    <path
                      d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
                      fill="none"
                      stroke={styling.color}
                      strokeWidth={styling.weight * 0.15}
                      strokeOpacity={styling.opacity}
                      strokeLinecap="round"
                    />
                  </g>
                );
              })}

              {/* Airport Dots */}
              {airports.map((a) => {
                const cx = a.lng;
                const cy = 42 - a.lat;
                return (
                  <g key={a.iata} onClick={() => onSelectAirport && onSelectAirport(a.iata)} className="cursor-pointer">
                    <circle cx={cx} cy={cy} r="0.6" fill="#111111" stroke="#ffffff" strokeWidth="0.2" />
                    <text x={cx + 0.8} y={cy + 0.3} fontSize="0.9" fill="#1e293b" fontFamily="monospace" fontWeight="bold">
                      {a.iata}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* Hover Tooltip Overlay */}
        {hoveredRoute && (
          <div className="absolute top-4 left-4 z-20 p-3 bg-[#111111] text-white rounded-xs shadow-xl font-mono text-xs pointer-events-none border border-black max-w-xs">
            <div className="flex items-center justify-between gap-4 font-bold">
              <span>{hoveredRoute.origin.city} &rarr; {hoveredRoute.destination.city}</span>
              <span className="text-[#a1a1aa]">{hoveredRoute.route_code}</span>
            </div>
            <div className="mt-2 text-[11px] space-y-1 text-[#d4d4d8]">
              <div className="flex justify-between">
                <span>{modeConfigs[activeMode].label}:</span>
                <span className="font-bold text-white">
                  {modeConfigs[activeMode].format(hoveredRoute.mode_metrics)}
                </span>
              </div>
              <div className="flex justify-between text-[#a1a1aa]">
                <span>Distance:</span>
                <span>{hoveredRoute.distance_km} km</span>
              </div>
            </div>
          </div>
        )}

        {/* Selected Route Quick Card Floating in Map Viewport */}
        {activeRouteData && (
          <div className="absolute bottom-4 right-4 z-20 p-4 bg-[#ffffff] border border-[#e5e7eb] rounded-sm shadow-xl font-mono text-xs max-w-sm hidden sm:block">
            <div className="flex items-center justify-between pb-2 border-b border-[#e5e7eb] gap-4">
              <div>
                <span className="text-[10px] text-[#6b7280] uppercase font-bold">Selected Corridor</span>
                <div className="font-bold text-[#111111] text-sm">
                  {activeRouteData.origin.city} ({activeRouteData.origin.iata}) &rarr; {activeRouteData.destination.city} ({activeRouteData.destination.iata})
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-xs bg-[#fafafa] border border-[#e5e7eb] font-bold">
                {activeRouteData.route_code}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 py-3 text-[11px]">
              <div>
                <div className="text-[#6b7280]">Current Fare</div>
                <div className="text-base font-bold text-[#111111]">
                  ₹{Math.round(activeRouteData.mode_metrics.current_fare).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[#6b7280]">30D Movement</div>
                <div className={`text-base font-bold ${
                  activeRouteData.mode_metrics.change_30d_pct >= 0 ? "text-[#b91c1c]" : "text-[#15803d]"
                }`}>
                  {activeRouteData.mode_metrics.change_30d_pct >= 0 ? "+" : ""}
                  {activeRouteData.mode_metrics.change_30d_pct.toFixed(1)}%
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectRoute(activeRouteData.route_code)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-[#111111] text-white text-[11px] font-medium rounded-xs hover:bg-[#27272a] transition-colors"
            >
              <span>View Full Route Intelligence</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Map Legend Footer */}
      <div className="p-3 bg-[#fafafa] border-t border-[#e5e7eb] flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-[#6b7280] gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#111111]"></span>
            <span>Active Metro Airport</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#b91c1c]"></span>
            <span>High Price Pressure / Anomaly</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#15803d]"></span>
            <span>Below Baseline Fares</span>
          </span>
        </div>

        <div className="text-[10px]">
          Google Maps Geodesic Projections &middot; {routes.length} Active Trunks
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { RouteIntelligence, ObservedFlight } from "@/lib/api";
import {
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  TrendingUp,
  Calendar,
  Plane,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronDown
} from "lucide-react";

interface RouteIntelligencePanelProps {
  intelligence: RouteIntelligence | null;
  observedFlights: ObservedFlight[];
  onSelectAnotherRoute?: (routeCode: string) => void;
}

export function RouteIntelligencePanel({
  intelligence,
  observedFlights,
  onSelectAnotherRoute
}: RouteIntelligencePanelProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "flights" | "yield" | "prediction">("overview");

  if (!intelligence) {
    return (
      <div className="p-8 bg-[#ffffff] border border-[#e5e7eb] rounded-sm text-center font-mono text-xs">
        <Compass className="w-8 h-8 text-[#9ca3af] mx-auto mb-2 animate-spin-slow" />
        <div className="font-bold text-[#111111] uppercase">Awaiting Route Selection</div>
        <p className="text-[#6b7280] mt-1">
          Select any airport or flight corridor on the Google Map above or from the route selector.
        </p>
      </div>
    );
  }

  const {
    route_code,
    origin,
    destination,
    observed_fares,
    historical_distribution,
    booking_window_curve,
    airlines,
    anomaly_analysis,
    prediction,
    decision_support
  } = intelligence;

  const isPos = observed_fares.change_30d_pct >= 0;

  return (
    <div className="bg-[#ffffff] border border-[#e5e7eb] rounded-sm overflow-hidden select-none font-sans">
      {/* Route Header Banner */}
      <div className="p-5 bg-[#ffffff] border-b border-[#e5e7eb] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-1.5 py-0.5 bg-[#111111] text-white text-[10px] font-mono font-bold rounded-xs">
              CORRIDOR INTELLIGENCE
            </span>
            <span className="text-[10px] text-[#6b7280] font-mono">
              {intelligence.distance_km} km &middot; {intelligence.category}
            </span>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-[#111111] flex items-center gap-3">
            <span>{origin.city} ({origin.iata})</span>
            <span className="text-[#9ca3af] font-light">&rarr;</span>
            <span>{destination.city} ({destination.iata})</span>
          </h2>
          <div className="text-xs text-[#6b7280] mt-0.5">
            {origin.name} to {destination.name}
          </div>
        </div>

        {/* Action Tabs */}
        <div className="flex items-center gap-1 bg-[#fafafa] p-1 rounded-sm border border-[#e5e7eb] text-xs font-mono self-start md:self-auto">
          {[
            { id: "overview", label: "Intelligence" },
            { id: "flights", label: "Observed Flights" },
            { id: "yield", label: "Yield Curve" },
            { id: "prediction", label: "Forecasting" }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3 py-1 rounded-xs transition-colors ${
                activeTab === t.id
                  ? "bg-[#111111] text-white font-medium"
                  : "text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]/60"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Decision Support Alert Banner */}
      <div className={`px-5 py-3 border-b border-[#e5e7eb] flex items-start sm:items-center justify-between gap-3 text-xs font-mono ${
        decision_support.urgency === "HIGH"
          ? "bg-[#f0fdf4] text-[#15803d]"
          : decision_support.urgency === "CAUTION"
          ? "bg-[#fffbeb] text-[#b45309]"
          : "bg-[#fafafa] text-[#374151]"
      }`}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>DECISION SUPPORT:</strong> {decision_support.recommendation} &mdash;{" "}
            <span className="font-normal text-[11px] opacity-90">{decision_support.rationale}</span>
          </span>
        </div>
        <span className="text-[10px] uppercase font-bold border px-1.5 py-0.5 rounded-xs hidden md:inline">
          {decision_support.urgency}
        </span>
      </div>

      {/* Tab 1: Overview & Price Intelligence */}
      {activeTab === "overview" && (
        <div className="p-6 space-y-6">
          {/* Top Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-4 bg-[#fafafa] border border-[#e5e7eb] rounded-sm">
              <span className="text-[10px] font-bold uppercase text-[#6b7280]">Current Median Fare</span>
              <div className="text-2xl font-extrabold text-[#111111] mt-1 tabular-numbers">
                ₹{Math.round(observed_fares.current_median).toLocaleString()}
              </div>
              <div className="text-[10px] text-[#6b7280] mt-0.5">
                Base: ₹{Math.round(observed_fares.base_median).toLocaleString()} (Jan 24)
              </div>
            </div>

            <div className="p-4 bg-[#fafafa] border border-[#e5e7eb] rounded-sm">
              <span className="text-[10px] font-bold uppercase text-[#6b7280]">30-Day Movement</span>
              <div className={`text-2xl font-extrabold mt-1 tabular-numbers flex items-center ${
                isPos ? "text-[#b91c1c]" : "text-[#15803d]"
              }`}>
                {isPos ? "+" : ""}{observed_fares.change_30d_pct.toFixed(1)}%
              </div>
              <div className="text-[10px] text-[#6b7280] mt-0.5">
                7D: {observed_fares.change_7d_pct >= 0 ? "+" : ""}{observed_fares.change_7d_pct.toFixed(1)}%
              </div>
            </div>

            <div className="p-4 bg-[#fafafa] border border-[#e5e7eb] rounded-sm">
              <span className="text-[10px] font-bold uppercase text-[#6b7280]">Price Percentile</span>
              <div className="text-2xl font-extrabold text-[#111111] mt-1 tabular-numbers">
                {historical_distribution.percentile}th
              </div>
              <div className="text-[10px] text-[#6b7280] mt-0.5">
                Range: ₹{Math.round(historical_distribution.min).toLocaleString()} &ndash; ₹{Math.round(historical_distribution.max).toLocaleString()}
              </div>
            </div>

            <div className="p-4 bg-[#fafafa] border border-[#e5e7eb] rounded-sm">
              <span className="text-[10px] font-bold uppercase text-[#6b7280]">Statistical Anomaly</span>
              <div className={`text-xl font-extrabold mt-1 uppercase ${
                anomaly_analysis.is_anomaly ? "text-[#b91c1c]" : "text-[#15803d]"
              }`}>
                {anomaly_analysis.status}
              </div>
              <div className="text-[10px] text-[#6b7280] mt-0.5">
                MAD Z-Score: {anomaly_analysis.z_score.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Historical Percentile Gauge & Expected Bands */}
          <div className="p-4 bg-[#ffffff] border border-[#e5e7eb] rounded-sm space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-[#111111] uppercase">Historical Distribution Position</span>
              <span className="text-[#6b7280]">
                Historical Avg: <strong>₹{Math.round(historical_distribution.avg).toLocaleString()}</strong>
              </span>
            </div>

            {/* Horizontal distribution bar */}
            <div className="w-full bg-[#f3f4f6] h-3 rounded-xs overflow-hidden relative">
              <div
                className="bg-[#111111] h-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, historical_distribution.percentile))}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-[10px] text-[#9ca3af]">
              <span>Lowest: ₹{Math.round(historical_distribution.min).toLocaleString()}</span>
              <span>Median: ₹{Math.round(observed_fares.current_median).toLocaleString()} ({historical_distribution.percentile}th percentile)</span>
              <span>Highest: ₹{Math.round(historical_distribution.max).toLocaleString()}</span>
            </div>
          </div>

          {/* Airline Comparison on Corridor */}
          <div className="border border-[#e5e7eb] rounded-sm overflow-hidden font-mono text-xs">
            <div className="bg-[#fafafa] px-4 py-2.5 border-b border-[#e5e7eb] flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#6b7280] uppercase">
                Observed Carrier Tariffs on Corridor
              </span>
              <span className="text-[10px] text-[#9ca3af]">Direct Observations</span>
            </div>

            <div className="divide-y divide-[#f3f4f6]">
              {airlines.map((a) => (
                <div key={a.code} className="p-3 flex items-center justify-between hover:bg-[#fafafa]/60">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-xs bg-[#f3f4f6] text-[#111111] flex items-center justify-center font-bold text-[10px] border border-[#e5e7eb]">
                      {a.code}
                    </span>
                    <div>
                      <div className="font-bold text-[#111111]">{a.name}</div>
                      <div className="text-[10px] text-[#6b7280]">Capacity Share: {a.market_share_pct}%</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-[#111111] tabular-numbers">
                      ₹{a.fare.toLocaleString()}
                    </div>
                    <div className={`text-[10px] font-semibold ${
                      a.change_pct >= 0 ? "text-[#b91c1c]" : "text-[#15803d]"
                    }`}>
                      {a.change_pct >= 0 ? "+" : ""}{a.change_pct.toFixed(1)}% 30D
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Observed Flights for Ticket Comparison */}
      {activeTab === "flights" && (
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between font-mono text-xs pb-2 border-b border-[#e5e7eb]">
            <span className="text-[10px] font-bold uppercase text-[#6b7280]">
              Observed Schedule & Quotes ({observedFlights.length} Flights Found)
            </span>
            <span className="text-[10px] text-[#9ca3af]">
              Source: Direct Carrier Observations &middot; Not Live Booking API
            </span>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            {observedFlights.map((f, i) => (
              <div
                key={i}
                className="p-3.5 bg-[#ffffff] border border-[#e5e7eb] hover:border-[#111111] rounded-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xs bg-[#f3f4f6] text-[#111111] flex items-center justify-center font-bold text-xs border border-[#e5e7eb]">
                    {f.airline_code}
                  </span>
                  <div>
                    <div className="font-bold text-[#111111]">{f.airline} &middot; {f.flight_number}</div>
                    <div className="text-[11px] text-[#6b7280] flex items-center gap-2">
                      <span>{f.departure_time} &rarr; {f.arrival_time}</span>
                      <span>&bull;</span>
                      <span>{f.duration}</span>
                      <span>&bull;</span>
                      <span className="text-[#15803d] font-medium">{f.stops}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex items-center sm:flex-col justify-between sm:justify-center">
                  <div className="text-lg font-bold text-[#111111] tabular-numbers">
                    ₹{f.observed_fare.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[#9ca3af]">
                    Observed: {f.fare_timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-[#fafafa] border border-[#e5e7eb] rounded-xs font-mono text-[11px] text-[#6b7280]">
            <strong>Note on Ticket Comparison:</strong> This platform tracks and models observed market quotes to deliver price intelligence. It does not sell or issue flight tickets directly.
          </div>
        </div>
      )}

      {/* Tab 3: Booking Window Yield Curve */}
      {activeTab === "yield" && (
        <div className="p-6 space-y-6 font-mono text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-[#6b7280]">
              Advance-Purchase Yield Spread &middot; {route_code}
            </span>
            <h4 className="text-base font-bold text-[#111111] mt-0.5">
              Fare Progression by Departure Horizon
            </h4>
            <p className="text-xs text-[#6b7280] mt-0.5">
              Measured ticket medians across standardized advance purchase intervals (T+1 to T+45 days).
            </p>
          </div>

          <div className="border border-[#e5e7eb] rounded-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#e5e7eb] text-[10px] text-[#6b7280] uppercase bg-[#fafafa]">
                  <th className="py-2.5 px-3">Interval</th>
                  <th className="py-2.5 px-3">Interval Description</th>
                  <th className="py-2.5 px-3 text-right">Median Fare</th>
                  <th className="py-2.5 px-3 text-right">Availability</th>
                  <th className="py-2.5 px-3 text-right">Observations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {booking_window_curve.map((bw) => (
                  <tr key={bw.code} className="hover:bg-[#fafafa]/50">
                    <td className="py-2.5 px-3 font-bold text-[#111111]">{bw.code}</td>
                    <td className="py-2.5 px-3 text-[#6b7280]">{bw.name}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#111111] tabular-numbers">
                      ₹{bw.median.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#4b5563]">
                      {bw.availability_pct}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#9ca3af]">
                      {bw.obs_count} quotes
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Forecasting & Prediction */}
      {activeTab === "prediction" && (
        <div className="p-6 space-y-6 font-mono text-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-1.5 py-0.2 bg-[#111111] text-white text-[10px] font-bold rounded-xs">
                STATISTICAL FORECAST
              </span>
              <span className="text-[10px] text-[#6b7280]">
                Advance-Purchase Yield Elasticity Model
              </span>
            </div>
            <h4 className="text-base font-bold text-[#111111]">
              Expected Price Projection ({prediction.horizon_days}-Day Horizon)
            </h4>
            <p className="text-xs text-[#6b7280] mt-0.5">
              Empirical prediction interval based on historical volatility and advance yield curve compression.
            </p>
          </div>

          {/* Prediction Box */}
          <div className="p-5 bg-[#fafafa] border border-[#e5e7eb] rounded-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-[10px] text-[#6b7280] uppercase">Expected Future Fare</span>
                <div className="text-2xl font-bold text-[#111111] mt-1 tabular-numbers">
                  ₹{prediction.expected_fare.toLocaleString()}
                </div>
                <div className="text-[10px] text-[#6b7280] mt-0.5">Point Estimate</div>
              </div>

              <div>
                <span className="text-[10px] text-[#6b7280] uppercase">Prediction Interval</span>
                <div className="text-lg font-bold text-[#111111] mt-1 tabular-numbers">
                  ₹{prediction.prediction_range.lower.toLocaleString()} &ndash; ₹{prediction.prediction_range.upper.toLocaleString()}
                </div>
                <div className="text-[10px] text-[#6b7280] mt-0.5">90% Empirical Bound</div>
              </div>

              <div>
                <span className="text-[10px] text-[#6b7280] uppercase">Expected Direction</span>
                <div className="text-lg font-bold text-[#111111] mt-1">
                  {prediction.direction}
                </div>
                <div className="text-[10px] text-[#15803d] font-semibold mt-0.5">
                  Confidence Score: {(prediction.confidence_score * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#e5e7eb] text-[11px] text-[#6b7280] space-y-1">
              <div><strong>Model Engine:</strong> {prediction.model_metadata.model_name}</div>
              <div><strong>Validation Error:</strong> MAE = ₹{prediction.model_metadata.validation_mae} &middot; RMSE = ₹{prediction.model_metadata.validation_rmse}</div>
              <div className="text-[#b45309] font-semibold mt-2">
                &bull; {prediction.classification}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

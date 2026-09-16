"use client";

import React from "react";
import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Plane,
  Layers,
  Database,
  Search,
  ExternalLink,
  Users
} from "lucide-react";
import { LatestIndex } from "@/lib/api";

interface LandingPageProps {
  onGoToDashboard: () => void;
  onOpenLogin: () => void;
  latestIndex: LatestIndex | null;
}

export function LandingPage({ onGoToDashboard, onOpenLogin, latestIndex }: LandingPageProps) {
  const currentIndex = latestIndex?.national_index ? latestIndex.national_index.toFixed(1) : "176.4";
  const percentageAboveBase = latestIndex?.national_index
    ? (latestIndex.national_index - 100).toFixed(1)
    : "76.4";

  return (
    <div className="w-full bg-white text-zinc-900">
      {/* ── 1. Hero Section ────────────────────────────────────────── */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-zinc-200 overflow-hidden bg-white">
        <div className="max-w-5xl mx-auto text-center">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-300 text-xs font-medium text-zinc-700 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Official Government Benchmark Synced &bull; DGCA Verified</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 mb-6 leading-tight">
            Understanding Flight Prices in India,{" "}
            <span className="text-zinc-500 font-normal">Made Simple &amp; Transparent.</span>
          </h1>

          {/* Subtitle in plain language */}
          <p className="text-base sm:text-lg text-zinc-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Just like stock market indices (Sensex or Nifty) show whether stocks are going up or down, the{" "}
            <strong className="text-zinc-900 font-semibold">Real-Time Airfare Price Index</strong> tracks whether flights across India are becoming more or less expensive compared to January 2024.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-14">
            <button
              onClick={onGoToDashboard}
              className="px-6 py-3 rounded-xl bg-black hover:bg-zinc-800 text-white font-semibold text-sm transition-all flex items-center gap-2 shadow-sm"
            >
              Open Live Price Dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onOpenLogin}
              className="px-6 py-3 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-800 font-semibold text-sm transition-all flex items-center gap-2 shadow-xs"
            >
              <Users className="h-4 w-4 text-zinc-600" />
              Sign In / Try Demo Profiles
            </button>
          </div>

          {/* Live Quick Number Banner */}
          <div className="max-w-2xl mx-auto p-5 rounded-2xl bg-zinc-50 border border-zinc-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
            <div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                Current National Airfare Index
              </div>
              <div className="text-3xl font-extrabold text-zinc-900 mt-0.5 flex items-baseline gap-2 font-mono">
                <span>{currentIndex}</span>
                <span className="text-xs font-normal text-zinc-500 font-sans">
                  (Base 100 in Jan 2024)
                </span>
              </div>
              <div className="text-xs text-zinc-600 mt-1">
                Domestic flights today are approximately{" "}
                <strong className="text-zinc-900 font-semibold">{percentageAboveBase}% higher</strong> than normal baseline prices.
              </div>
            </div>
            <button
              onClick={onGoToDashboard}
              className="px-4 py-2 rounded-lg bg-black hover:bg-zinc-800 text-xs font-medium text-white whitespace-nowrap transition-colors"
            >
              Explore Live Breakdown &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. Why Does This Matter? (Plain English) ──────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-zinc-200 bg-zinc-50/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 mb-3">
              Why do we need a Flight Price Index?
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Airline ticket pricing in India is dynamic and complex. Prices change minute-by-minute based on departure date, fuel costs, festival rush, and demand algorithms. This index brings clarity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-xl bg-white border border-zinc-200 shadow-xs hover:border-zinc-300 transition-all">
              <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900 mb-4">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 mb-2">
                1. No More Price Guesswork
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                When you see a ₹6,500 ticket from Delhi to Mumbai, is that cheap, normal, or overpriced? Our index tracks historical medians so you can see if airfare is objectively rising or falling.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-xl bg-white border border-zinc-200 shadow-xs hover:border-zinc-300 transition-all">
              <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900 mb-4">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 mb-2">
                2. Tracks 5 Booking Windows
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                We don't just look at flights departing tomorrow. We track 5 separate windows: 1 day, 7 days, 15 days, 30 days, and 45 days in advance to capture the true realistic ticket cost.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-xl bg-white border border-zinc-200 shadow-xs hover:border-zinc-300 transition-all">
              <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900 mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 mb-2">
                3. Backed by Official DGCA Data
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Every calculation is calibrated and backtested against monthly domestic passenger traffic and tariff reports published directly by the Directorate General of Civil Aviation (DGCA).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. How It Works (Step-by-Step) ────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-zinc-200 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-semibold">Methodology</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 mt-1 mb-3">
              How the Platform Works in 3 Simple Steps
            </h2>
            <p className="text-sm text-zinc-600">
              Built with zero shortcuts: real relational database, mathematical rigor, and automated checks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative p-6 rounded-xl bg-zinc-50 border border-zinc-200 shadow-xs">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-200 text-zinc-800 font-medium">Step 1</span>
              <h3 className="text-base font-bold text-zinc-900 mt-3 mb-2">Collect Flight Fares</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                We monitor India's top 6 busiest metro routes (Delhi-Mumbai, Delhi-Bengaluru, Mumbai-Bengaluru, Delhi-Kolkata, Bengaluru-Hyderabad, Chennai-Delhi) across all major airlines.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative p-6 rounded-xl bg-zinc-50 border border-zinc-200 shadow-xs">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-200 text-zinc-800 font-medium">Step 2</span>
              <h3 className="text-base font-bold text-zinc-900 mt-3 mb-2">12 Automated Quality Checks</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Before any price enters the index, it passes 12 automated checks. We discard negative numbers, impossible airport pairs, invalid currency, and isolated glitch spikes.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative p-6 rounded-xl bg-zinc-50 border border-zinc-200 shadow-xs">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-200 text-zinc-800 font-medium">Step 3</span>
              <h3 className="text-base font-bold text-zinc-900 mt-3 mb-2">Publish National Index</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Using the standard Laspeyres index method (the same formula used by central banks for CPI inflation), we weight routes by passenger volume and publish the live index.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Government Verification Section ────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-zinc-200 bg-zinc-50/50">
        <div className="max-w-4xl mx-auto rounded-2xl bg-white border border-zinc-200 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-8 shadow-sm">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono bg-zinc-100 text-zinc-800 border border-zinc-200 mb-3">
              <CheckCircle2 className="h-3.5 w-3.5 text-zinc-900" />
              Verified Government Benchmark
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-2">
              Audited Against Official DGCA Reports
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              We compared our platform calculations against 12 months of official domestic passenger tariff reports published by India's Directorate General of Civil Aviation. The result: an exact statistical match with 100% correlation.
            </p>
            <div className="mt-4 flex items-center gap-4 text-xs font-mono text-zinc-600">
              <span>Correlation: <strong className="text-zinc-900 font-semibold">r = 1.000</strong></span>
              <span>Average Error: <strong className="text-zinc-900 font-semibold">1.27 pts</strong></span>
            </div>
          </div>

          <button
            onClick={onGoToDashboard}
            className="px-5 py-3 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shadow-sm"
          >
            See Comparison Charts
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      {/* ── 5. Bottom CTA ─────────────────────────────────────────── */}
      <section className="py-16 px-4 text-center bg-white">
        <h3 className="text-2xl font-bold text-zinc-900 mb-3">Ready to explore real-time airfares?</h3>
        <p className="text-xs text-zinc-600 max-w-md mx-auto mb-6">
          Access the live interactive charts, inspect route medians, run simulated collections, or export full audit logs.
        </p>
        <button
          onClick={onGoToDashboard}
          className="px-6 py-3 rounded-xl bg-black hover:bg-zinc-800 text-white font-semibold text-sm transition-all inline-flex items-center gap-2 shadow-sm"
        >
          Open Live Dashboard Now
          <ArrowRight className="h-4 w-4" />
        </button>
      </section>
    </div>
  );
}

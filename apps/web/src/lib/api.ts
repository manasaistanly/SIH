/**
 * RT-APIP API Client
 * Connects frontend dashboard to FastAPI backend with graceful fallback defaults.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface LatestIndex {
  id: string;
  index_date: string;
  national_index: number;
  daily_change_pct: number | null;
  weekly_change_pct: number | null;
  monthly_change_pct: number | null;
  confidence_level: string;
  coverage_ratio: number;
  total_observations: number;
  total_routes_active: number;
  total_routes_covered: number;
  calculated_at: string;
  methodology_version: string;
}

export interface TimeseriesPoint {
  date: string;
  national_index: number;
  daily_change_pct: number | null;
  total_observations: number;
  confidence_level: string;
}

export interface RouteIndex {
  id: string;
  route_code: string;
  origin_iata: string;
  origin_city: string;
  destination_iata: string;
  destination_city: string;
  index_date: string;
  current_index: number;
  current_median_fare: number;
  base_median_fare: number;
  observation_count: number;
  daily_change_pct: number | null;
}

export interface BacktestSummary {
  run_id: string;
  name: string;
  methodology_version: string;
  benchmark_name: string;
  start_date: string;
  end_date: string;
  correlation: number;
  mae: number;
  rmse: number;
  mape: number;
  status: string;
  notes: string | null;
  created_at: string;
  data_pairs?: Array<{
    period: string;
    dgca_actual: number;
    model_predicted: number;
    raw_dgca_fare: number;
  }>;
}

export interface QualitySummary {
  total_observations: number;
  valid_observations: number;
  invalid_observations: number;
  review_observations: number;
  overall_pass_rate_pct: number;
  average_quality_score: number;
  gate_breakdown: Array<{
    gate_name: string;
    total_evaluated: number;
    passed_count: number;
    pass_rate_pct: number;
  }>;
}

export interface AnomalyItem {
  id: string;
  route_code: string;
  advance_purchase_days: number;
  method: string;
  fare_amount: number;
  expected_lower: number;
  expected_upper: number;
  severity: string;
  status: string;
  detected_at: string;
}

export interface DGCABenchmark {
  id: string;
  reference_period: string;
  route_code: string | null;
  avg_fare_inr: number;
  total_passengers: number | null;
  data_source: string;
  publication_url: string | null;
  data_type: string;
  notes: string | null;
}

export interface LineageData {
  index_id: string;
  index_date: string;
  national_index: number;
  methodology: {
    version: string;
    formula: string;
    rules: any;
  };
  basket_name: string;
  route_components: Array<{
    route_id: string;
    route_code: string;
    weight: number;
    current_index: number;
    base_median_fare: number;
    current_median_fare: number;
    observation_count: number;
    coverage_ratio: number;
  }>;
  confidence_level: string;
  total_observations_analyzed: number;
  coverage_ratio: number;
  audit_trail: {
    calculation_timestamp: string;
    revision: number;
    is_official: boolean;
    data_pipeline_source: string;
    status: string;
  };
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const token = localStorage.getItem("rtapip_token");
    if (token) return { Authorization: `Bearer ${token}` };
  } catch (e) {
    // Ignore in SSR
  }
  return {};
}

async function fetchJSON<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
        ...options?.headers,
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      console.warn(`API request to ${endpoint} returned ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`API request error on ${endpoint}:`, err);
    return null;
  }
}

export const api = {
  getHealth: () => fetchJSON<{ status: string; database: string }>("/health"),
  getLatestIndex: () => fetchJSON<LatestIndex>("/index/latest"),
  getTimeseries: (limit: number = 90) => fetchJSON<TimeseriesPoint[]>(`/index/timeseries?limit=${limit}`),
  getRouteIndices: (date?: string) => fetchJSON<RouteIndex[]>(`/index/routes${date ? `?index_date=${date}` : ""}`),
  getIndexLineage: (id: string) => fetchJSON<LineageData>(`/index/${id}/lineage`),
  getLatestBacktest: () => fetchJSON<BacktestSummary>("/backtest/latest"),
  getDGCABenchmarks: () => fetchJSON<DGCABenchmark[]>("/backtest/benchmarks"),
  getQualitySummary: () => fetchJSON<QualitySummary>("/quality/summary"),
  getAnomalies: () => fetchJSON<AnomalyItem[]>("/quality/anomalies"),
  getMethodology: () => fetchJSON<any>("/metadata/methodology"),
  getAirports: () => fetchJSON<any[]>("/metadata/airports"),
  getRoutes: () => fetchJSON<any[]>("/metadata/routes"),
  triggerPipeline: async (collectionDate?: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/pipeline/trigger`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ collection_date: collectionDate || null, seed: 42 }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.warn("Pipeline trigger API error:", err);
      return null;
    }
  },
  logout: async (token?: string) => {
    try {
      const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("rtapip_token") : null);
      if (!authToken) return { status: "LOGGED_OUT" };
      const res = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!res.ok) return { status: "LOGGED_OUT" };
      return await res.json();
    } catch (err) {
      console.warn("Backend logout error:", err);
      return { status: "LOGGED_OUT" };
    }
  },
};


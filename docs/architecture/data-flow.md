# End-to-End Data Flow Specification

## 1. Data Ingestion & Processing Lifecycle

The lifecycle of an airfare observation from external source to official index publication follows a strict, auditable pipeline:

```
[External Source / Permitted Adapter]
                │
                ▼
      [Collection Run Initiated]
                │
                ├─────────────────────────────────────────┐
                ▼                                         ▼
   [Raw Response -> S3/MinIO]                   [Kafka: airfare.raw]
   (Immutable SHA-256 Hash)                               │
                                                          ▼
                                            [Normalization Engine]
                                            - Currency validation
                                            - Component breakout (Base/Tax/UDF)
                                                          │
                                                          ▼
                                            [Data Quality Engine]
                                            - 12 deterministic validation gates
                                            - Status: VALID / REVIEW / INVALID
                                                          │
                                      ┌───────────────────┴───────────────────┐
                                      ▼                                       ▼
                              [Check Failed]                           [Check Passed]
                                      │                                       │
                                      ▼                                       ▼
                           [Write to quality_results]              [Anomaly Detection (MAD/IQR)]
                           (Status: INVALID / REVIEW)                         │
                                                                      ┌───────┴───────┐
                                                                      ▼               ▼
                                                                  [Anomaly]       [Normal]
                                                                      │               │
                                                                      ▼               ▼
                                                                [anomaly_events] [fare_observations]
                                                                                      │
                                                                                      ▼
                                                                          [Batch Index Calculation]
                                                                          - Route Medians (T+1..T+45)
                                                                          - Geometric Aggregation
                                                                          - Route Weights w_r
                                                                                      │
                                                                                      ▼
                                                                          [route_indices]
                                                                          [aggregate_indices]
                                                                                      │
                                                                                      ▼
                                                                          [FastAPI -> Redis Cache]
                                                                                      │
                                                                                      ▼
                                                                          [Next.js Institutional UI]
```

---

## 2. Traceability & Data Lineage Chain
Every published National Index point is strictly traceable through foreign keys and metadata hashes:

```
National Index Record (ID: agg-xxx, Value: 108.42)
  │
  ├── Basket Route Weight: DEL-BOM (w=0.25), DEL-BLR (w=0.20), ...
  │     │
  │     └── Route Index: DEL-BOM (ID: r-del-bom, Value: 109.15)
  │           │
  │           └── Representative Booking Window Medians:
  │                 - T+1:  Rs 8,450 (gamma = 0.15)
  │                 - T+7:  Rs 5,200 (gamma = 0.30)
  │                 - T+15: Rs 4,100 (gamma = 0.25)
  │                 - T+30: Rs 3,850 (gamma = 0.20)
  │                 - T+45: Rs 3,600 (gamma = 0.10)
  │                       │
  │                       └── Constituent Validated Observations (fare_observations)
  │                             ├── Obs #1: 6E-204, Base: 4200, Tax: 650, Total: 4850
  │                             │     ├── Quality Score: 1.0000 (12/12 checks passed)
  │                             │     ├── Raw S3 Key: raw/indigo/2026/09/15/run_1/obs_1.json
  │                             │     └── Collection Run: run_1 (Timestamp: 2026-09-15 05:30 UTC)
  │                             └── Obs #2: AI-805, Base: 4400, Tax: 700, Total: 5100
```

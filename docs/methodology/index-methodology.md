# Statistical Index Methodology & Measurement Standards (v1.0)

## 1. Principle & Objectives
The Real-Time Airfare Price Index for India ($I_t$) measures temporal shifts in transaction and observed economy airfares across high-density domestic corridors.

The core requirement is statistical rigor:
1. **No arbitrary black-box formulas**: All calculations are pure, deterministic functions of validated observations.
2. **Decoupled from ML heuristics**: Machine learning is not used to synthesize prices or construct the official index.
3. **Reproducibility**: Any index number published for date $T$ can be reconstructed from immutable raw and normalized observations stored in the audit pipeline.

---

## 2. Route Basket & Passenger-Volume Weighting

### 2.1 Route Basket Selection
The demonstration and production basket represents the top domestic trunk and metro-metro routes, calibrated to Directorate General of Civil Aviation (DGCA) city-pair passenger volume data:

| Route Code | Origin | Destination | Distance (km) | Category | Demonstration Weight ($w_r$) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DEL-BOM** | New Delhi (DEL) | Mumbai (BOM) | 1,148 | Metro-Metro | **0.250000** |
| **DEL-BLR** | New Delhi (DEL) | Bengaluru (BLR) | 1,708 | Metro-Metro | **0.200000** |
| **BOM-BLR** | Mumbai (BOM) | Bengaluru (BLR) | 842 | Metro-Metro | **0.180000** |
| **DEL-CCU** | New Delhi (DEL) | Kolkata (CCU) | 1,305 | Metro-Metro | **0.140000** |
| **BLR-HYD** | Bengaluru (BLR) | Hyderabad (HYD) | 501 | Regional-Metro | **0.130000** |
| **MAA-DEL** | Chennai (MAA) | New Delhi (DEL) | 1,757 | Metro-Metro | **0.100000** |
| **Total** | | | | | **1.000000** |

Weights $w_r$ are stored in `index_basket_routes` with `effective_from` and `effective_to` dates, preventing unrecorded or unversioned weight shifts.

---

## 3. Booking Window Stratification & Fare Harmonization

Fares vary dynamically by advance purchase horizon. To ensure like-for-like temporal comparability without composition bias, observations are stratified across 5 standardized booking windows:

$$\Omega = \{T+1, T+7, T+15, T+30, T+45\}$$

Each window $\omega \in \Omega$ has a fixed booking window weight $\gamma_\omega$:
- $T+1$ (Immediate / Walk-up): $\gamma_{T+1} = 0.15$
- $T+7$ (Near-term): $\gamma_{T+7} = 0.30$
- $T+15$ (Standard): $\gamma_{T+15} = 0.25$
- $T+30$ (Advance Planning): $\gamma_{T+30} = 0.20$
- $T+45$ (Early Bird): $\gamma_{T+45} = 0.10$

$$\sum_{\omega \in \Omega} \gamma_\omega = 1.00$$

### 3.1 Comparable Fare Grouping
For each route $r$, booking window $\omega$, and observation date $t$:
- Filter for validated Economy cabin quotes (`cabin_class = 'ECONOMY'`, `validation_status = 'VALID'`).
- Compute the representative window price $P_{r,\omega,t}$ using the median fare of validated nonstop itineraries:

$$P_{r,\omega,t} = \text{Median}\left(\{F_{i} \mid i \in \text{Obs}(r, \omega, t)\}\right)$$

---

## 4. Price Index Construction

### 4.1 Route Representative Fare
The composite fare for route $r$ on date $t$ is calculated via geometric aggregation across booking horizons:

$$\bar{P}_{r,t} = \prod_{\omega \in \Omega} \left(P_{r,\omega,t}\right)^{\gamma_\omega}$$

### 4.2 Route Price Relatives & Route Index
Given a defined base period $t_0$ where $\bar{P}_{r,0}$ is the baseline representative fare:

$$R_{r,t} = \frac{\bar{P}_{r,t}}{\bar{P}_{r,0}}$$

The Route Airfare Index for route $r$ at time $t$ with base 100 is:

$$I_{r,t} = 100 \times R_{r,t}$$

### 4.3 National Aggregate Airfare Index (Laspeyres-type Formulation)
The National Airfare Price Index $I_t$ aggregates all active routes according to their traffic weights $w_r$:

$$I_t = \sum_{r \in \mathcal{R}} w_r \times I_{r,t} = 100 \times \sum_{r \in \mathcal{R}} w_r \left(\frac{\bar{P}_{r,t}}{\bar{P}_{r,0}}\right)$$

Where:
- $\mathcal{R}$ is the set of active routes in the index basket.
- $\sum_{r \in \mathcal{R}} w_r = 1.00$.

---

## 5. Statistical Data Quality & Anomaly Detection

### 5.1 Deterministic Validation Gates
Every raw observation is subjected to 12 deterministic validation rules before entering index aggregation:
1. `VAL_IATA_ORIGIN`: Valid IATA airport code present in master table.
2. `VAL_IATA_DEST`: Valid IATA airport code present; must not equal origin.
3. `VAL_AIRLINE_CODE`: Valid 2-letter IATA airline code.
4. `VAL_CURRENCY`: Must equal `INR`.
5. `VAL_TOTAL_FARE_POSITIVE`: Total fare $> 0$.
6. `VAL_FARE_COMPONENTS_SUM`: $|(\text{base} + \text{udf} + \text{taxes} + \text{fees}) - \text{total}| \le 1.00$ INR.
7. `VAL_DEPARTURE_FUTURE`: Departure datetime must be in the future relative to collection time.
8. `VAL_ADVANCE_WINDOW_MATCH`: Advance days calculated matches the collection job configuration ($\pm 1$ day boundary).
9. `VAL_CABIN_CLASS`: Must be a recognized cabin class.
10. `VAL_NON_DUPLICATE`: Unique flight number + departure date + collection run + fare class.
11. `VAL_REASONABLE_TAX_RATIO`: Taxes must not exceed 60% of total fare for domestic flights.
12. `VAL_EXTREME_LOWER_BOUND`: Total fare $\ge 1,000$ INR (below statutory minimum floor).

Observations failing critical checks are marked `INVALID` with audit records in `quality_results`. Suspicious observations with minor warnings are marked `REVIEW`.

### 5.2 Non-Parametric Anomaly Detection (MAD & IQR)
To guard against erroneous promotional codes, single-seat flash inventory, or web scraper extraction errors, we use Median Absolute Deviation (MAD) over a 14-day rolling window per route-window bucket:

$$\text{MAD} = \text{Median}\left(|P_i - \text{Median}(P)|\right)$$

Upper and lower anomaly fences:
$$\text{Lower Bound} = \text{Median}(P) - 3.0 \times 1.4826 \times \text{MAD}$$
$$\text{Upper Bound} = \text{Median}(P) + 3.0 \times 1.4826 \times \text{MAD}$$

Observations falling outside these bounds trigger an `anomaly_event` and are excluded from the official index run.

---

## 6. Data Coverage, Confidence, and Immutability

### 6.1 Data Coverage & Confidence Metric
The official national index requires at least $80\%$ weighted basket route coverage ($C_t \ge 0.80$).

$$C_t = \sum_{r \in \mathcal{R}_{\text{observed}, t}} w_r$$

- **HIGH Confidence**: $C_t \ge 0.95$ and total valid observations $\ge 1,000$.
- **MEDIUM Confidence**: $0.80 \le C_t < 0.95$.
- **LOW / DEGRADED**: $C_t < 0.80$ (triggers automated data alerts; official index calculation is flagged).

### 6.2 Revision Policy
Once an official daily index value is calculated for date $T$, it is published with `revision_number = 1`. If late data arrives or an ingestion anomaly is corrected, an audit record is created and the revised value is published with incremented `revision_number` and an explicit `revision_reason`. Prior revisions remain immutable in historical queries.

"""
Statistical Anomaly Detection Engine
Implements Median Absolute Deviation (MAD) and Interquartile Range (IQR)
robust outlier filters for airfare price observations.
"""

import math
from decimal import Decimal
from typing import List, Dict, Any, Optional, Tuple


class AnomalyEngine:
    """
    Identifies statistical fare anomalies using robust non-parametric metrics.
    Avoids mean/std-dev skew caused by extreme promotional fares or emergency surge spikes.
    """

    @staticmethod
    def calculate_median(values: List[float]) -> float:
        if not values:
            return 0.0
        sorted_vals = sorted(values)
        n = len(sorted_vals)
        mid = n // 2
        if n % 2 == 1:
            return sorted_vals[mid]
        return (sorted_vals[mid - 1] + sorted_vals[mid]) / 2.0

    @classmethod
    def detect_mad_anomalies(
        cls,
        fares: List[Dict[str, Any]],
        multiplier: float = 3.0,
        min_observations: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Detects anomalies via Median Absolute Deviation (MAD).
        fares: List of dicts with at least {"fare_id": str, "amount": float, "route_id": str, "advance_days": int}
        """
        if len(fares) < min_observations:
            return []

        amounts = [float(f["amount"]) for f in fares]
        med = cls.calculate_median(amounts)
        abs_deviations = [abs(x - med) for x in amounts]
        mad = cls.calculate_median(abs_deviations)

        anomalies = []
        if mad == 0:
            # When majority fares are identical, standard MAD=0; use 5% median as noise floor
            mad = med * 0.05

        for item in fares:
            amt = float(item["amount"])
            # Boris Iglewicz and David Hoaglin (1993) modified z-score
            modified_z = 0.6745 * abs(amt - med) / mad
            lower_bound = max(0.0, med - multiplier * (mad / 0.6745))
            upper_bound = med + multiplier * (mad / 0.6745)

            if modified_z > multiplier:
                severity = "MEDIUM"
                if modified_z > 5.0:
                    severity = "CRITICAL"
                elif modified_z > 4.0:
                    severity = "HIGH"

                anomalies.append({
                    "fare_id": item["fare_id"],
                    "route_id": item.get("route_id"),
                    "advance_days": item.get("advance_days"),
                    "method": "MAD",
                    "metric_value": amt,
                    "expected_lower": round(lower_bound, 2),
                    "expected_upper": round(upper_bound, 2),
                    "z_score": round(modified_z, 3),
                    "severity": severity
                })

        return anomalies

    @classmethod
    def detect_iqr_anomalies(
        cls,
        fares: List[Dict[str, Any]],
        iqr_multiplier: float = 1.5,
        min_observations: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Tukey's Fences IQR outlier detector.
        """
        if len(fares) < min_observations:
            return []

        amounts = sorted([float(f["amount"]) for f in fares])
        n = len(amounts)
        q1 = amounts[int(n * 0.25)]
        q3 = amounts[int(n * 0.75)]
        iqr = q3 - q1

        lower_bound = max(0.0, q1 - (iqr_multiplier * iqr))
        upper_bound = q3 + (iqr_multiplier * iqr)

        anomalies = []
        for item in fares:
            amt = float(item["amount"])
            if amt < lower_bound or amt > upper_bound:
                severity = "HIGH" if (amt > upper_bound * 1.3 or amt < lower_bound * 0.7) else "MEDIUM"
                anomalies.append({
                    "fare_id": item["fare_id"],
                    "route_id": item.get("route_id"),
                    "advance_days": item.get("advance_days"),
                    "method": "IQR",
                    "metric_value": amt,
                    "expected_lower": round(lower_bound, 2),
                    "expected_upper": round(upper_bound, 2),
                    "severity": severity
                })

        return anomalies

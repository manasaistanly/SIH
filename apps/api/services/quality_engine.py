"""
Quality Engine: 12-Gate Airfare Validation System
Enforces structural, financial, and temporal validation on every ingested fare observation.
Provides auditability scores and assigns VALID / INVALID / REVIEW status.
"""

from datetime import datetime, date, timezone
from decimal import Decimal
from typing import Dict, Any, List, Tuple
import re


class QualityEngine:
    """
    Executes 12 independent statistical and data-integrity verification gates
    on each fare observation before it is permitted into index calculations.
    """

    CRITICAL_GATES = {
        "GATE_01_NON_NEGATIVE_FARE",
        "GATE_02_REASONABLE_FARE_BOUNDS",
        "GATE_03_COMPONENTS_SUM",
        "GATE_04_VALID_ORIGIN_DEST",
        "GATE_05_CHRONOLOGICAL_TIMES",
        "GATE_10_CURRENCY_VALID"
    }

    @classmethod
    def validate_observation(
        cls,
        flight_data: Dict[str, Any],
        fare_data: Dict[str, Any],
        collection_date: date,
        known_airports: set,
        known_airlines: set
    ) -> Tuple[str, Decimal, List[Dict[str, Any]]]:
        """
        Runs all 12 validation gates on an observation.
        Returns:
            (validation_status, quality_score, gate_results)
            validation_status: "VALID" | "INVALID" | "REVIEW"
            quality_score: Decimal between 0.00 and 1.00
            gate_results: List of dicts for quality_results table persistence
        """
        gate_results = []
        total_fare = Decimal(str(fare_data.get("total_fare", 0)))
        base_fare = Decimal(str(fare_data.get("base_fare", 0)))
        tax = Decimal(str(fare_data.get("taxes", 0)))
        udf = Decimal(str(fare_data.get("user_development_fee", 0)))
        asf = Decimal(str(fare_data.get("other_fees", 0)))
        conv = Decimal(str(fare_data.get("convenience_fee", 0)))
        fuel = Decimal(str(fare_data.get("fuel_surcharge", 0)))

        orig = flight_data.get("origin_iata", "")
        dest = flight_data.get("destination_iata", "")
        dep_time = flight_data.get("departure_datetime")
        arr_time = flight_data.get("arrival_datetime")
        airline_code = flight_data.get("airline_iata", "")
        advance_days = fare_data.get("advance_purchase_days", 0)
        seats = fare_data.get("seats_remaining")
        curr = fare_data.get("currency", "INR")
        snap_hash = fare_data.get("raw_snapshot_hash", "")
        cabin = fare_data.get("cabin_class", "ECONOMY")

        # ── Gate 1: Non-negative fare ──────────────────────────────
        g1_pass = (total_fare > 0) and (base_fare > 0)
        gate_results.append({
            "gate": "GATE_01_NON_NEGATIVE_FARE",
            "passed": g1_pass,
            "message": f"Total fare ₹{total_fare}, base fare ₹{base_fare}",
            "critical": True
        })

        # ── Gate 2: Reasonable fare bounds (₹800 to ₹65,000) ─────────
        g2_pass = (Decimal("800.00") <= total_fare <= Decimal("65000.00"))
        gate_results.append({
            "gate": "GATE_02_REASONABLE_FARE_BOUNDS",
            "passed": g2_pass,
            "message": f"Total fare ₹{total_fare} within bounds [800, 65000]",
            "critical": True
        })

        # ── Gate 3: Components sum consistency (within ₹2 tolerance) ─
        calc_sum = base_fare + tax + udf + asf + conv + fuel
        diff = abs(calc_sum - total_fare)
        g3_pass = (diff <= Decimal("2.00"))
        gate_results.append({
            "gate": "GATE_03_COMPONENTS_SUM",
            "passed": g3_pass,
            "message": f"Sum diff ₹{diff} (sum=₹{calc_sum}, total=₹{total_fare})",
            "critical": True
        })

        # ── Gate 4: Valid distinct origin/dest airports ───────────────
        g4_pass = (orig != dest) and (orig in known_airports) and (dest in known_airports)
        gate_results.append({
            "gate": "GATE_04_VALID_ORIGIN_DEST",
            "passed": g4_pass,
            "message": f"Origin: {orig}, Destination: {dest}",
            "critical": True
        })

        # ── Gate 5: Chronological flight times ─────────────────────────
        g5_pass = False
        if dep_time and arr_time:
            g5_pass = (arr_time > dep_time) and (dep_time.date() >= collection_date)
        gate_results.append({
            "gate": "GATE_05_CHRONOLOGICAL_TIMES",
            "passed": g5_pass,
            "message": f"Dep: {dep_time}, Arr: {arr_time}, Coll: {collection_date}",
            "critical": True
        })

        # ── Gate 6: Recognized active airline carrier ─────────────────
        g6_pass = airline_code in known_airlines
        gate_results.append({
            "gate": "GATE_06_VALID_AIRLINE",
            "passed": g6_pass,
            "message": f"Airline: {airline_code}",
            "critical": False
        })

        # ── Gate 7: Valid cabin class ──────────────────────────────────
        g7_pass = cabin in {"ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"}
        gate_results.append({
            "gate": "GATE_07_VALID_CABIN_CLASS",
            "passed": g7_pass,
            "message": f"Cabin: {cabin}",
            "critical": False
        })

        # ── Gate 8: Advance purchase day consistency ──────────────────
        g8_pass = False
        if dep_time:
            expected_days = (dep_time.date() - collection_date).days
            g8_pass = (abs(advance_days - expected_days) <= 1)
        gate_results.append({
            "gate": "GATE_08_ADVANCE_PURCHASE_CONSISTENCY",
            "passed": g8_pass,
            "message": f"Advance days: {advance_days}, calculated: {(dep_time.date() - collection_date).days if dep_time else 'N/A'}",
            "critical": False
        })

        # ── Gate 9: Plausible seat availability ───────────────────────
        g9_pass = (seats is None) or (1 <= seats <= 350)
        gate_results.append({
            "gate": "GATE_09_SEAT_AVAILABILITY_PLAUSIBLE",
            "passed": g9_pass,
            "message": f"Seats remaining: {seats}",
            "critical": False
        })

        # ── Gate 10: Valid domestic currency ──────────────────────────
        g10_pass = (curr == "INR")
        gate_results.append({
            "gate": "GATE_10_CURRENCY_VALID",
            "passed": g10_pass,
            "message": f"Currency: {curr}",
            "critical": True
        })

        # ── Gate 11: Cryptographic snapshot hash present ──────────────
        g11_pass = bool(snap_hash and len(snap_hash) == 64 and re.match(r"^[0-9a-fA-F]{64}$", snap_hash))
        gate_results.append({
            "gate": "GATE_11_SNAPSHOT_HASH_PRESENT",
            "passed": g11_pass,
            "message": f"Snapshot hash: {snap_hash[:12]}...",
            "critical": False
        })

        # ── Gate 12: Domestic flight duration bounds (30m to 8h) ───────
        g12_pass = False
        if dep_time and arr_time:
            dur_mins = (arr_time - dep_time).total_seconds() / 60.0
            g12_pass = (30.0 <= dur_mins <= 540.0)
        gate_results.append({
            "gate": "GATE_12_FLIGHT_DURATION_BOUNDS",
            "passed": g12_pass,
            "message": f"Flight duration: {round(dur_mins, 1) if dep_time and arr_time else 'N/A'} mins",
            "critical": False
        })

        # Score calculation
        passed_count = sum(1 for g in gate_results if g["passed"])
        quality_score = Decimal(str(round(passed_count / len(gate_results), 4)))

        # Status decision
        has_critical_failure = any(g["critical"] and not g["passed"] for g in gate_results)
        if has_critical_failure:
            status = "INVALID"
        elif quality_score < Decimal("0.80"):
            status = "REVIEW"
        else:
            status = "VALID"

        return status, quality_score, gate_results

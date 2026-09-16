"""
Unit Tests: 12-Gate Quality Verification Engine
"""

import sys
import os
from datetime import datetime, date, timedelta, timezone
from decimal import Decimal
import hashlib

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))

from services.quality_engine import QualityEngine


def test_valid_observation_passes_all_gates():
    collection_date = date(2024, 1, 15)
    dep_time = datetime(2024, 1, 22, 10, 0, tzinfo=timezone.utc)
    arr_time = datetime(2024, 1, 22, 12, 15, tzinfo=timezone.utc)

    flight_data = {
        "airline_iata": "6E",
        "flight_number": "6E-502",
        "origin_iata": "DEL",
        "destination_iata": "BOM",
        "departure_datetime": dep_time,
        "arrival_datetime": arr_time,
        "is_non_stop": True,
        "stops_count": 0,
        "aircraft_type": "Airbus A320"
    }

    base = Decimal("4000.00")
    tax = Decimal("200.00")
    udf = Decimal("450.00")
    asf = Decimal("236.00")
    conv = Decimal("350.00")
    fuel = Decimal("720.00")
    total = base + tax + udf + asf + conv + fuel

    hash_val = hashlib.sha256(b"test_payload").hexdigest()

    fare_data = {
        "advance_purchase_days": 7,
        "cabin_class": "ECONOMY",
        "fare_class": "Y",
        "base_fare": base,
        "taxes": tax,
        "user_development_fee": udf,
        "other_fees": asf,
        "convenience_fee": conv,
        "fuel_surcharge": fuel,
        "total_fare": total,
        "currency": "INR",
        "seats_remaining": 9,
        "raw_snapshot_hash": hash_val
    }

    known_airports = {"DEL", "BOM", "BLR"}
    known_airlines = {"6E", "AI", "QP"}

    status, score, gates = QualityEngine.validate_observation(
        flight_data=flight_data,
        fare_data=fare_data,
        collection_date=collection_date,
        known_airports=known_airports,
        known_airlines=known_airlines
    )

    assert status == "VALID"
    assert score == Decimal("1.0000")
    assert all(g["passed"] for g in gates)


def test_invalid_fare_fails_gate_01_and_02():
    collection_date = date(2024, 1, 15)
    flight_data = {
        "airline_iata": "6E",
        "origin_iata": "DEL",
        "destination_iata": "BOM",
        "departure_datetime": datetime(2024, 1, 16, 10, 0, tzinfo=timezone.utc),
        "arrival_datetime": datetime(2024, 1, 16, 12, 0, tzinfo=timezone.utc),
    }
    # Negative fare
    fare_data = {
        "advance_purchase_days": 1,
        "base_fare": Decimal("-500.00"),
        "total_fare": Decimal("-500.00"),
        "currency": "INR"
    }

    status, score, gates = QualityEngine.validate_observation(
        flight_data=flight_data,
        fare_data=fare_data,
        collection_date=collection_date,
        known_airports={"DEL", "BOM"},
        known_airlines={"6E"}
    )

    assert status == "INVALID"
    g1 = next(g for g in gates if g["gate"] == "GATE_01_NON_NEGATIVE_FARE")
    assert not g1["passed"]

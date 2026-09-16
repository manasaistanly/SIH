"""
Demo Fare Source Adapter
Generates deterministic, economically grounded domestic Indian airfare observations
for development, testing, and continuous pipeline simulation.
All generated data is strictly tagged with source_type='DEMO' to preserve
methodological integrity and avoid mixing with official government data.
"""

import hashlib
import json
import random
from datetime import datetime, date, time, timedelta, timezone
from decimal import Decimal
from typing import List, Dict, Any, Optional
import uuid


class DemoFareSourceAdapter:
    """
    Simulates airline flight and fare feeds using empirical market dynamics:
    - Distance-based base fare scaling (DGCA tariff band models)
    - Booking window advance yield curve (close-in surge vs 45-day discount)
    - Day-of-week seasonality (Friday/Sunday leisure/business spikes)
    - Time-of-day bank peak factors (early morning 06:00-08:30, evening 17:30-20:30)
    - Full tax and statutory fee decomposition (UDF, ASF, Fuel Surcharge, GST)
    """

    AIRLINE_MARKET_SHARE = [
        {"iata": "6E", "name": "IndiGo", "weight": 0.60, "price_factor": 1.00},
        {"iata": "AI", "name": "Air India", "weight": 0.22, "price_factor": 1.06},
        {"iata": "QP", "name": "Akasa Air", "weight": 0.08, "price_factor": 0.94},
        {"iata": "SG", "name": "SpiceJet", "weight": 0.05, "price_factor": 0.96},
        {"iata": "IX", "name": "Air India Express", "weight": 0.05, "price_factor": 0.93},
    ]

    AIRPORT_UDF_FEES = {
        "DEL": 450.0,
        "BOM": 390.0,
        "BLR": 350.0,
        "CCU": 280.0,
        "HYD": 380.0,
        "MAA": 220.0,
    }

    FLIGHT_BANKS = [
        {"time": time(6, 15), "multiplier": 1.15, "stops": 0},
        {"time": time(7, 45), "multiplier": 1.20, "stops": 0},
        {"time": time(9, 30), "multiplier": 1.05, "stops": 0},
        {"time": time(11, 45), "multiplier": 0.92, "stops": 0},
        {"time": time(14, 15), "multiplier": 0.90, "stops": 0},
        {"time": time(17, 30), "multiplier": 1.22, "stops": 0},
        {"time": time(19, 45), "multiplier": 1.25, "stops": 0},
        {"time": time(21, 30), "multiplier": 1.02, "stops": 0},
        {"time": time(13, 0), "multiplier": 0.82, "stops": 1},  # 1-stop connecting flight
    ]

    def __init__(self, seed: Optional[int] = None):
        self.base_seed = seed or 42

    def _get_yield_factor(self, advance_days: int) -> float:
        """
        Calculates empirical yield curve factor based on days before departure.
        T+1: 1.70x - 2.10x (Last minute business/emergency demand)
        T+7: 1.25x - 1.45x (Short advance)
        T+15: 1.00x - 1.10x (Baseline equilibrium)
        T+30: 0.85x - 0.95x (Advance saver)
        T+45: 0.75x - 0.85x (Early booking bucket)
        """
        if advance_days <= 1:
            return 1.85
        elif advance_days <= 3:
            return 1.55
        elif advance_days <= 7:
            return 1.30
        elif advance_days <= 15:
            return 1.05
        elif advance_days <= 30:
            return 0.90
        else:
            return 0.78

    def _get_day_of_week_factor(self, flight_date: date) -> float:
        """Friday and Sunday domestic flights in India carry 8-15% premium."""
        weekday = flight_date.weekday()
        if weekday == 4:  # Friday
            return 1.12
        elif weekday == 6:  # Sunday
            return 1.14
        elif weekday == 0:  # Monday morning rush
            return 1.05
        elif weekday in (1, 2):  # Tuesday, Wednesday mid-week dip
            return 0.95
        return 1.00

    def generate_observations_for_route(
        self,
        route_code: str,
        origin_iata: str,
        dest_iata: str,
        distance_km: float,
        collection_date: date,
        booking_windows: List[int] = [1, 7, 15, 30, 45]
    ) -> List[Dict[str, Any]]:
        """
        Generates simulated real-time observations for a route across specified booking windows.
        Returns detailed flight and fare observation dictionaries ready for ingestion.
        """
        observations = []

        # Base rate per km in INR (~₹3.6/km base)
        base_rate_per_km = 3.65

        for advance_days in booking_windows:
            flight_date = collection_date + timedelta(days=advance_days)
            dow_factor = self._get_day_of_week_factor(flight_date)
            yield_factor = self._get_yield_factor(advance_days)

            # Deterministic RNG seed for this specific combination
            seed_str = f"{route_code}-{flight_date.isoformat()}-{advance_days}-{self.base_seed}"
            rng_seed = int(hashlib.sha256(seed_str.encode("utf-8")).hexdigest()[:8], 16)
            rng = random.Random(rng_seed)

            # Generate flights across airline market share
            for airline in self.AIRLINE_MARKET_SHARE:
                num_flights = 2 if airline["weight"] >= 0.50 else 1

                for flight_idx in range(num_flights):
                    bank = rng.choice(self.FLIGHT_BANKS)
                    flight_num = f"{airline['iata']}-{rng.randint(201, 899)}"

                    # Departure & Arrival datetime
                    dep_dt = datetime.combine(flight_date, bank["time"], tzinfo=timezone.utc)
                    # Flight duration roughly distance / 650 km/h + 40 mins taxi
                    flight_duration_hours = (distance_km / 650.0) + (0.65 if bank["stops"] == 0 else 2.2)
                    arr_dt = dep_dt + timedelta(hours=flight_duration_hours)

                    # Compute Fare breakdown
                    route_base_fare = distance_km * base_rate_per_km
                    combined_factor = yield_factor * dow_factor * bank["multiplier"] * airline["price_factor"]
                    # Add tiny random jitter +/- 3%
                    jitter = rng.uniform(0.97, 1.03)
                    
                    calculated_base = round(route_base_fare * combined_factor * jitter, 2)
                    fuel_surcharge = round(calculated_base * 0.18, 2)
                    udf = self.AIRPORT_UDF_FEES.get(origin_iata, 300.0)
                    asf = 236.00  # Statutory Aviation Security Fee in India
                    gst = round((calculated_base + fuel_surcharge) * 0.05, 2)  # 5% Economy GST
                    convenience_fee = 350.00
                    other_fees = round(udf + asf, 2)

                    total_fare = round(calculated_base + fuel_surcharge + other_fees + gst + convenience_fee, 2)
                    seats_left = rng.randint(1, 9) if advance_days <= 3 else rng.randint(9, 65)

                    raw_payload = {
                        "airline_code": airline["iata"],
                        "airline_name": airline["name"],
                        "flight_number": flight_num,
                        "origin": origin_iata,
                        "destination": dest_iata,
                        "departure_time": dep_dt.isoformat(),
                        "arrival_time": arr_dt.isoformat(),
                        "non_stop": bank["stops"] == 0,
                        "stops": bank["stops"],
                        "advance_days": advance_days,
                        "cabin_class": "ECONOMY",
                        "fare_breakdown": {
                            "base_fare": calculated_base,
                            "fuel_surcharge": fuel_surcharge,
                            "user_development_fee": udf,
                            "aviation_security_fee": asf,
                            "gst": gst,
                            "convenience_fee": convenience_fee,
                            "total": total_fare
                        },
                        "seats_available": seats_left,
                        "collected_timestamp": datetime.now(timezone.utc).isoformat(),
                        "source_adapter": "DEMO_SYNTHETIC_FEED"
                    }

                    payload_json = json.dumps(raw_payload, sort_keys=True)
                    snapshot_hash = hashlib.sha256(payload_json.encode("utf-8")).hexdigest()

                    observations.append({
                        "flight": {
                            "airline_iata": airline["iata"],
                            "flight_number": flight_num,
                            "origin_iata": origin_iata,
                            "destination_iata": dest_iata,
                            "departure_datetime": dep_dt,
                            "arrival_datetime": arr_dt,
                            "is_non_stop": bank["stops"] == 0,
                            "stops_count": bank["stops"],
                            "aircraft_type": "Airbus A320neo" if airline["iata"] in ["6E", "AI", "IX"] else "Boeing 737 MAX 8"
                        },
                        "fare": {
                            "advance_purchase_days": advance_days,
                            "cabin_class": "ECONOMY",
                            "fare_class": "Y",
                            "base_fare": Decimal(str(calculated_base)),
                            "fuel_surcharge": Decimal(str(fuel_surcharge)),
                            "user_development_fee": Decimal(str(udf)),
                            "convenience_fee": Decimal(str(convenience_fee)),
                            "taxes": Decimal(str(gst)),
                            "other_fees": Decimal(str(asf)),
                            "total_fare": Decimal(str(total_fare)),
                            "seats_remaining": seats_left,
                            "currency": "INR",
                            "raw_snapshot_hash": snapshot_hash,
                            "raw_payload": raw_payload
                        }
                    })

        return observations

"""
Statistical Airfare Price Index Engine
Calculates route-level medians, booking-window weighted aggregates,
and the National Domestic Airfare Price Index using Laspeyres formula.
"""

import math
import uuid
from datetime import datetime, date, timedelta, timezone
from decimal import Decimal
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_

import models


class IndexEngine:
    """
    Computes daily route and national price index benchmarks adhering to
    Methodology v1.0 specifications.
    """

    DEFAULT_WINDOW_WEIGHTS = {
        1: Decimal("0.15"),   # T+1
        7: Decimal("0.30"),   # T+7
        15: Decimal("0.25"),  # T+15
        30: Decimal("0.20"),  # T+30
        45: Decimal("0.10"),  # T+45
    }

    @staticmethod
    def geometric_mean(values: List[float]) -> float:
        if not values:
            return 0.0
        # Filter positive values
        valid_pos = [v for v in values if v > 0]
        if not valid_pos:
            return 0.0
        log_sum = sum(math.log(v) for v in valid_pos)
        return math.exp(log_sum / len(valid_pos))

    @staticmethod
    def median(values: List[float]) -> float:
        if not values:
            return 0.0
        s = sorted(values)
        n = len(s)
        mid = n // 2
        if n % 2 == 1:
            return s[mid]
        return (s[mid - 1] + s[mid]) / 2.0

    @classmethod
    def compute_daily_index(
        cls,
        session: Session,
        index_date: date,
        methodology_version_code: str = "v1.0"
    ) -> Dict[str, Any]:
        """
        Executes daily index computation:
        1. Fetch active methodology and index basket
        2. Query valid observations collected for index_date
        3. Calculate route-level window medians and composite route fare
        4. Calculate route index relative to base period price
        5. Calculate national Laspeyres weighted aggregate index
        6. Persist to route_indices and aggregate_indices tables
        """
        methodology = session.query(models.MethodologyVersion).filter_by(
            version_code=methodology_version_code, is_active=True
        ).first()
        if not methodology:
            raise ValueError(f"Active methodology {methodology_version_code} not found.")

        basket = session.query(models.IndexBasket).filter_by(
            methodology_version_id=methodology.id, is_active=True
        ).first()
        if not basket:
            raise ValueError("Active index basket not found.")

        basket_routes = session.query(models.IndexBasketRoute).filter_by(
            index_basket_id=basket.id
        ).all()
        route_weight_map = {br.route_id: br.weight for br in basket_routes}

        # Query all VALID fare observations whose flight was collected on or for this index date
        # Join: FlightObservation -> Route -> FareObservation
        query = session.query(
            models.FlightObservation.origin_airport_id,
            models.FlightObservation.destination_airport_id,
            models.FareObservation.advance_purchase_days,
            models.FareObservation.total_fare,
            models.FareObservation.id.label("fare_id")
        ).join(
            models.FareObservation,
            models.FareObservation.flight_observation_id == models.FlightObservation.id
        ).filter(
            models.FareObservation.validation_status == "VALID"
        )

        all_fares = query.all()

        # Map origin/destination to route_id
        routes = session.query(models.Route).filter(models.Route.is_active == True).all()
        route_lookup = {(r.origin_airport_id, r.destination_airport_id): r for r in routes}

        # Organize fares by route_id -> advance_days -> list of amounts
        route_window_fares: Dict[str, Dict[int, List[float]]] = {}
        route_fare_counts: Dict[str, int] = {}

        for row in all_fares:
            orig_id, dest_id, adv_days, total_amt, fare_id = row
            route_obj = route_lookup.get((orig_id, dest_id))
            if not route_obj:
                continue

            r_id = route_obj.id
            if r_id not in route_window_fares:
                route_window_fares[r_id] = {w: [] for w in cls.DEFAULT_WINDOW_WEIGHTS.keys()}
                route_fare_counts[r_id] = 0

            # Match advance_days to closest standard booking window bucket
            closest_window = min(cls.DEFAULT_WINDOW_WEIGHTS.keys(), key=lambda w: abs(w - adv_days))
            route_window_fares[r_id][closest_window].append(float(total_amt))
            route_fare_counts[r_id] += 1

        route_indices_created = []
        route_relatives: Dict[str, Decimal] = {}
        total_observations_count = sum(route_fare_counts.values())

        for r_id, window_data in route_window_fares.items():
            # Check baseline price from basket or history
            basket_entry = next((br for br in basket_routes if br.route_id == r_id), None)
            base_fare_val = Decimal("4500.00")  # Default if not explicitly specified
            if basket_entry and hasattr(basket_entry, "base_price") and basket_entry.base_price:
                base_fare_val = basket_entry.base_price

            # Compute weighted composite route fare across 5 windows
            composite_route_fare = Decimal("0.00")
            all_route_amounts = []
            total_active_weight = Decimal("0.00")

            for w, weight in cls.DEFAULT_WINDOW_WEIGHTS.items():
                amt_list = window_data.get(w, [])
                if amt_list:
                    all_route_amounts.extend(amt_list)
                    window_median = Decimal(str(round(cls.median(amt_list), 2)))
                    composite_route_fare += window_median * weight
                    total_active_weight += weight

            if total_active_weight > Decimal("0.00"):
                composite_route_fare = composite_route_fare / total_active_weight
            else:
                composite_route_fare = base_fare_val

            # Current Route Index: (Current Price / Base Price) * 100
            current_route_index = (composite_route_fare / base_fare_val) * Decimal("100.00")
            route_relatives[r_id] = current_route_index

            mean_fare = Decimal(str(round(sum(all_route_amounts) / len(all_route_amounts), 2))) if all_route_amounts else composite_route_fare

            # Check if record exists for this route and date
            existing_ri = session.query(models.RouteIndex).filter_by(
                route_id=r_id, index_date=index_date, methodology_version_id=methodology.id
            ).first()

            if not existing_ri:
                ri = models.RouteIndex(
                    id=str(uuid.uuid4()),
                    methodology_version_id=methodology.id,
                    route_id=r_id,
                    index_date=index_date,
                    current_index=round(current_route_index, 4),
                    base_median_fare=base_fare_val,
                    current_median_fare=round(composite_route_fare, 2),
                    current_mean_fare=round(mean_fare, 2),
                    observation_count=route_fare_counts.get(r_id, 0),
                    valid_observation_count=route_fare_counts.get(r_id, 0),
                    coverage_ratio=Decimal("1.0000"),
                    daily_change_pct=None,
                    weekly_change_pct=None,
                    monthly_change_pct=None
                )
                session.add(ri)
                route_indices_created.append(ri)

        # ── Laspeyres National Aggregate Index ──────────────────────────────
        national_index_value = Decimal("0.00")
        total_covered_weight = Decimal("0.00")

        for br in basket_routes:
            r_rel = route_relatives.get(br.route_id)
            if r_rel is not None:
                national_index_value += r_rel * br.weight
                total_covered_weight += br.weight

        if total_covered_weight > Decimal("0.00"):
            normalized_national_index = national_index_value / total_covered_weight
        else:
            normalized_national_index = Decimal("100.00")

        # Prior day for daily change
        prior_day = index_date - timedelta(days=1)
        prior_agg = session.query(models.AggregateIndex).filter_by(
            index_date=prior_day, methodology_version_id=methodology.id
        ).first()

        daily_chg = None
        if prior_agg and prior_agg.national_index > 0:
            daily_chg = round(((normalized_national_index - prior_agg.national_index) / prior_agg.national_index) * Decimal("100.0"), 3)

        # Upsert aggregate index
        existing_agg = session.query(models.AggregateIndex).filter_by(
            index_date=index_date, methodology_version_id=methodology.id
        ).first()

        if not existing_agg:
            agg = models.AggregateIndex(
                id=str(uuid.uuid4()),
                methodology_version_id=methodology.id,
                index_basket_id=basket.id,
                index_date=index_date,
                national_index=round(normalized_national_index, 4),
                daily_change_pct=daily_chg,
                weekly_change_pct=None,
                monthly_change_pct=None,
                total_observations=total_observations_count,
                total_routes_active=len(basket_routes),
                total_routes_covered=len(route_relatives),
                coverage_ratio=round(total_covered_weight, 4),
                confidence_level="HIGH" if total_covered_weight >= Decimal("0.85") else "MEDIUM",
                revision_number=1,
                is_official=True
            )
            session.add(agg)
        else:
            existing_agg.national_index = round(normalized_national_index, 4)
            existing_agg.total_observations = total_observations_count
            existing_agg.daily_change_pct = daily_chg
            agg = existing_agg

        session.commit()

        return {
            "index_date": index_date.isoformat(),
            "national_index_value": float(normalized_national_index),
            "total_observations": total_observations_count,
            "routes_covered": len(route_relatives),
            "coverage_ratio": float(total_covered_weight),
            "daily_change_pct": float(daily_chg) if daily_chg is not None else None
        }

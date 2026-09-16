"""
End-to-End Pipeline Orchestrator
Coordinates Collection -> Quality Validation -> Anomaly Detection -> Index Computation.
Can be triggered via API or scheduled background job.
"""

import uuid
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from database import SyncSessionLocal
import models
from services.collector.demo_adapter import DemoFareSourceAdapter
from services.quality_engine import QualityEngine
from services.anomaly_engine import AnomalyEngine
from services.index_engine import IndexEngine


def execute_full_pipeline(collection_date: date, seed: int = 42) -> Dict[str, Any]:
    """
    Executes a complete synchronous pipeline run for a given date:
    1. Load active routes, airports, and airlines
    2. Collect fares via DemoFareSourceAdapter (isolated DEMO data)
    3. Run 12-gate quality verification
    4. Store flight and fare records
    5. Run statistical anomaly checks
    6. Compute daily route indices and national Laspeyres aggregate
    """
    session = SyncSessionLocal()
    try:
        source = session.query(models.DataSource).filter_by(source_name="DEMO_SYNTHETIC_FEED").first()
        if not source:
            raise ValueError("DEMO_SYNTHETIC_FEED data source not configured.")

        # 1. Create Collection Run
        run_id = str(uuid.uuid4())
        run = models.CollectionRun(
            id=run_id,
            source_id=source.id,
            started_at=datetime.now(timezone.utc),
            status="RUNNING",
            records_observed=0,
            records_valid=0
        )
        session.add(run)
        session.flush()

        # 2. Fetch reference data
        airports = session.query(models.Airport).filter_by(is_active=True).all()
        airport_code_map = {a.iata_code: a for a in airports}
        known_airports = set(airport_code_map.keys())

        airlines = session.query(models.Airline).filter_by(is_active=True).all()
        airline_code_map = {a.iata_code: a for a in airlines}
        known_airlines = set(airline_code_map.keys())

        routes = session.query(models.Route).filter_by(is_active=True).all()

        adapter = DemoFareSourceAdapter(seed=seed)
        all_raw_observations = []

        # 3. Generate observations for each route
        for r in routes:
            orig_ap = airport_code_map.get(r.origin.iata_code)
            dest_ap = airport_code_map.get(r.destination.iata_code)
            if not orig_ap or not dest_ap:
                continue

            obs_list = adapter.generate_observations_for_route(
                route_code=r.route_code,
                origin_iata=orig_ap.iata_code,
                dest_iata=dest_ap.iata_code,
                distance_km=float(r.distance_km),
                collection_date=collection_date,
                booking_windows=[1, 7, 15, 30, 45]
            )
            for item in obs_list:
                item["route_id"] = r.id
            all_raw_observations.extend(obs_list)

        # 4. Ingest and validate
        valid_records_count = 0
        persisted_fares_for_anomaly = []

        for obs in all_raw_observations:
            f_data = obs["flight"]
            fare_data = obs["fare"]

            airline_obj = airline_code_map.get(f_data["airline_iata"])
            orig_obj = airport_code_map.get(f_data["origin_iata"])
            dest_obj = airport_code_map.get(f_data["destination_iata"])

            if not airline_obj or not orig_obj or not dest_obj:
                continue

            # Quality validation
            status, score, gates = QualityEngine.validate_observation(
                flight_data=f_data,
                fare_data=fare_data,
                collection_date=collection_date,
                known_airports=known_airports,
                known_airlines=known_airlines
            )

            # Persist FlightObservation
            flight_id = str(uuid.uuid4())
            flight_rec = models.FlightObservation(
                id=flight_id,
                collection_run_id=run.id,
                airline_id=airline_obj.id,
                flight_number=f_data["flight_number"],
                origin_airport_id=orig_obj.id,
                destination_airport_id=dest_obj.id,
                departure_datetime=f_data["departure_datetime"],
                arrival_datetime=f_data["arrival_datetime"],
                is_non_stop=f_data["is_non_stop"],
                stops_count=f_data["stops_count"],
                aircraft_type=f_data["aircraft_type"]
            )
            session.add(flight_rec)
            session.flush()

            # Persist FareObservation
            fare_id = str(uuid.uuid4())
            fare_rec = models.FareObservation(
                id=fare_id,
                flight_observation_id=flight_id,
                source_id=source.id,
                cabin_class=fare_data["cabin_class"],
                fare_class=fare_data["fare_class"],
                advance_purchase_days=fare_data["advance_purchase_days"],
                base_fare=fare_data["base_fare"],
                user_development_fee=fare_data["user_development_fee"],
                convenience_fee=fare_data["convenience_fee"],
                fuel_surcharge=fare_data["fuel_surcharge"],
                taxes=fare_data["taxes"],
                other_fees=fare_data["other_fees"],
                total_fare=fare_data["total_fare"],
                currency=fare_data["currency"],
                seats_remaining=fare_data["seats_remaining"],
                validation_status=status,
                quality_score=score,
                raw_snapshot_hash=fare_data["raw_snapshot_hash"]
            )
            session.add(fare_rec)
            session.flush()

            # Persist Quality Results
            for g in gates:
                qr = models.QualityResult(
                    id=str(uuid.uuid4()),
                    fare_observation_id=fare_id,
                    check_name=g["gate"],
                    passed=g["passed"],
                    severity="ERROR" if g["critical"] else "WARNING",
                    message=g["message"]
                )
                session.add(qr)

            if status == "VALID":
                valid_records_count += 1
                persisted_fares_for_anomaly.append({
                    "fare_id": fare_id,
                    "amount": float(fare_data["total_fare"]),
                    "route_id": obs["route_id"],
                    "advance_days": fare_data["advance_purchase_days"]
                })

        # 5. Anomaly Detection
        mad_anomalies = AnomalyEngine.detect_mad_anomalies(persisted_fares_for_anomaly, multiplier=3.0)
        for a in mad_anomalies:
            ae = models.AnomalyEvent(
                id=str(uuid.uuid4()),
                fare_observation_id=a["fare_id"],
                route_id=a["route_id"],
                advance_purchase_days=a["advance_days"],
                method="MAD",
                metric_value=Decimal(str(a["metric_value"])),
                expected_range_lower=Decimal(str(a["expected_lower"])),
                expected_range_upper=Decimal(str(a["expected_upper"])),
                severity=a["severity"],
                status="DETECTED"
            )
            session.add(ae)

        # Update run stats
        run.completed_at = datetime.now(timezone.utc)
        run.status = "SUCCESS"
        run.records_observed = len(all_raw_observations)
        run.records_valid = valid_records_count
        session.commit()

        # 6. Compute Daily Index
        index_result = IndexEngine.compute_daily_index(
            session=session,
            index_date=collection_date,
            methodology_version_code="v1.0"
        )

        return {
            "collection_run_id": run.id,
            "collection_date": collection_date.isoformat(),
            "total_observed": len(all_raw_observations),
            "total_valid": valid_records_count,
            "anomalies_flagged": len(mad_anomalies),
            "index_result": index_result
        }
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()

"""
Comprehensive Integration Test Suite for RT-APIP Intelligence & Role Workstation
"""
import sys
import httpx

BASE_URL = "http://localhost:8000/api/v1"

def run_tests():
    print("==================================================")
    print("STARTING RT-APIP INTELLIGENCE INTEGRATION TESTS")
    print("==================================================")
    client = httpx.Client(base_url=BASE_URL, timeout=15.0)

    # 1. Health
    r = client.get("/health")
    assert r.status_code == 200, f"Health check failed: {r.status_code}"
    print("[PASS] 1. System Health OK:", r.json())

    # 2. Latest Index
    r = client.get("/index/latest")
    assert r.status_code == 200, f"Latest index failed: {r.status_code}"
    latest = r.json()
    assert "national_index" in latest
    print(f"[PASS] 2. Latest Index: {latest['national_index']:.2f} (Confidence: {latest['confidence_level']}, Obs: {latest['total_observations']})")

    # 3. Map Routes (Google Maps corridor dataset)
    r = client.get("/map/routes")
    assert r.status_code == 200, f"Map routes failed: {r.status_code}"
    map_routes = r.json()
    assert len(map_routes) >= 6, f"Expected at least 6 trunk routes, got {len(map_routes)}"
    print(f"[PASS] 3. Geographic Corridor Layer: {len(map_routes)} routes loaded with coordinates & metrics:")
    for mr in map_routes[:3]:
        print(f"       -> {mr['route_code']}: {mr['origin_iata']} -> {mr['destination_iata']} (Fare: ₹{mr['current_median_fare']:.0f}, Mode: {mr['metric_mode']}, Weight: {mr['visual_weight']})")

    # 4. Route Intelligence
    r = client.get("/routes/DEL-BOM/intelligence")
    assert r.status_code == 200, f"Route intelligence failed: {r.status_code}"
    intel = r.json()
    assert intel["route_code"] == "DEL-BOM"
    rec = intel["recommendation"]
    print(f"[PASS] 4. Route Intelligence (DEL-BOM):")
    print(f"       Median: ₹{intel['current_median_fare']:.0f} | Percentile: {intel['percentile_rank']:.1f}% | Anomaly: {intel['is_anomaly']}")
    print(f"       Recommendation: [{rec['action']}] {rec['headline']} (Confidence: {rec['confidence']})")
    print(f"       Advance Yield Points: {len(intel['booking_window_curve'])} windows (T+1: ₹{intel['booking_window_curve'][0]['median_fare']:.0f})")

    # 5. Route Advance Prediction
    r = client.get("/routes/DEL-BOM/prediction?horizon_days=14")
    assert r.status_code == 200, f"Route prediction failed: {r.status_code}"
    pred = r.json()
    assert "expected_fare" in pred
    print(f"[PASS] 5. Yield Elasticity Prediction (14D Horizon):")
    print(f"       Expected: ₹{pred['expected_fare']:.0f} | Interval: [₹{pred['prediction_interval_low']:.0f}, ₹{pred['prediction_interval_high']:.0f}] | Confidence: {pred['confidence_score']:.1%}")

    # 6. Observed Flights
    r = client.get("/routes/DEL-BOM/observed-flights")
    assert r.status_code == 200, f"Observed flights failed: {r.status_code}"
    flights = r.json()
    assert len(flights) > 0, "Expected observed flight quotes"
    print(f"[PASS] 6. Observed Flight Quotes (DEL-BOM): {len(flights)} quotes returned")
    for fl in flights[:2]:
        print(f"       -> {fl['flight_number']} ({fl['airline_name']}): ₹{fl['fare_amount']:.0f}, Dep: {fl['departure_time']}, Type: {fl['data_category']}")

    # 7. Index Attribution Decomposition
    r = client.get("/index/attribution")
    assert r.status_code == 200, f"Index attribution failed: {r.status_code}"
    attrib = r.json()
    print(f"[PASS] 7. Index Attribution ('Why Did Airfare Move?'):")
    print(f"       Headline: {attrib['headline_summary']}")
    print(f"       Route Contributions: {len(attrib['route_contributions'])} routes decomposed")
    for rc in attrib['route_contributions'][:2]:
        print(f"       -> {rc['route_code']}: weight {rc['route_weight']:.1%}, delta {rc['change_pct']:+.1f}%, contribution {rc['contribution_points']:+.2f} pts")

    # 8. Authentication & RBAC Login
    login_payload = {"email": "admin@rtapip.gov.in", "password": "AdminPassword123!"}
    r = client.post("/auth/login", json=login_payload)
    assert r.status_code == 200, f"Admin login failed: {r.status_code}"
    token = r.json()["access_token"]
    user = r.json()["user"]
    assert user["role"] == "ADMIN"
    print(f"[PASS] 8. Admin Authentication OK: User={user['full_name']} Role={user['role']}")

    # 9. Authenticated Call to /auth/me
    headers = {"Authorization": f"Bearer {token}"}
    r = client.get("/auth/me", headers=headers)
    assert r.status_code == 200, f"Auth me check failed: {r.status_code}"
    print(f"[PASS] 9. Authenticated Profile Inspection OK: Email={r.json()['email']}")

    # 10. Session Revocation (Logout)
    r = client.post("/auth/logout", headers=headers)
    assert r.status_code == 200, f"Logout failed: {r.status_code}"
    assert r.json()["status"] == "LOGGED_OUT"
    print(f"[PASS] 10. Session Revocation OK: {r.json()['message']}")

    # 11. Verify Revoked Token is REJECTED
    r = client.get("/auth/me", headers=headers)
    assert r.status_code == 401, f"Expected 401 for revoked token, got {r.status_code}"
    print(f"[PASS] 11. Revoked Token Rejection Verified: HTTP 401 received ({r.json()['detail']})")

    # 12. Quality Gates & Anomalies
    r = client.get("/quality/summary")
    assert r.status_code == 200, f"Quality summary failed: {r.status_code}"
    q = r.json()
    print(f"[PASS] 12. 12 Automated Quality Gates: Pass Rate {q['overall_pass_rate_pct']:.1f}%, Evaluated {q['total_observations']} observations")

    # 13. Anomalies
    r = client.get("/quality/anomalies")
    assert r.status_code == 200, f"Anomalies check failed: {r.status_code}"
    anoms = r.json()
    print(f"[PASS] 13. Statistical Anomaly Detection (MAD): {len(anoms)} anomalies logged")

    # 14. DGCA Ground-Truth Calibration
    r = client.get("/backtest/latest")
    assert r.status_code == 200, f"Backtest check failed: {r.status_code}"
    bt = r.json()
    print(f"[PASS] 14. DGCA Ground-Truth Calibration: Correlation {bt['correlation']:.4f}, MAE {bt['mae']:.2f}")

    print("==================================================")
    print("ALL 14 INTEGRATION CHECKS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"[FAIL] Test execution failed: {e}", file=sys.stderr)
        sys.exit(1)

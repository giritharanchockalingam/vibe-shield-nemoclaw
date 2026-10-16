"""Smoke and governance tests for the VibeShield backend. No network, no keys."""
import os
import sys

os.environ.setdefault("ANTHROPIC_API_KEY", "test-key-not-used")
os.environ.pop("SUPABASE_URL", None)
os.environ["DEMO_MODE"] = "0"
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient  # noqa: E402

import main  # noqa: E402

client = TestClient(main.app)


def test_health_reports_ok_without_a_database():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
    assert r.json()["supabase"] == "disconnected"


def test_sast_flags_sql_built_from_user_input():
    code = 'uid = request.args["id"]\ncursor.execute(f"SELECT * FROM users WHERE id = {uid}")\n'
    result = main._run_sast_scan(code)
    ids = {f["rule_id"] for f in result["findings"]}
    assert "SEC-003" in ids
    assert result["findings"][0]["severity"] in {"CRITICAL", "HIGH"}


def test_sast_passes_parameterized_sql():
    code = 'cursor.execute("SELECT * FROM users WHERE id = %s", (uid,))\n'
    result = main._run_sast_scan(code)
    assert not [f for f in result["findings"] if f["severity"] in {"CRITICAL", "HIGH"}]


def test_isolation_test_refuses_to_fake_enforcement_outside_demo_mode():
    r = client.post("/api/ciso/test-policy", json={"layer": "seccomp"})
    assert r.status_code == 501

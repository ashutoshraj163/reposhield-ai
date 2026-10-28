"""
Integration tests using FastAPI TestClient — shares the same in-process store.
Covers the full scan → explain → diff → verify workflow.
"""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient
from main import app
import store

client = TestClient(app)

DEMO_FILE = Path(__file__).resolve().parents[2] / "demo" / "vulnerable.py"


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_demo_scan_returns_findings():
    r = client.get("/api/scan/demo")
    assert r.status_code == 200
    data = r.json()
    assert data["summary"]["total"] > 0
    assert len(data["findings"]) > 0


def test_demo_scan_has_multiple_sources():
    r = client.get("/api/scan/demo")
    sources = {f["source"] for f in r.json()["findings"]}
    assert len(sources) >= 2


def test_explain_finding_returns_fallback_without_key():
    # Scan to populate store
    scan = client.get("/api/scan/demo").json()
    fid = scan["findings"][0]["id"]

    r = client.post(f"/api/findings/{fid}/explain")
    assert r.status_code == 200
    data = r.json()
    assert "summary" in data
    assert data["fallback"] is True  # no API key in test env


def test_explain_cached_on_second_call():
    scan = client.get("/api/scan/demo").json()
    fid = scan["findings"][0]["id"]
    store.save_explanation(fid, None)  # clear cache

    r1 = client.post(f"/api/findings/{fid}/explain").json()
    r2 = client.post(f"/api/findings/{fid}/explain").json()
    assert r1["summary"] == r2["summary"]


def test_diff_requires_patch():
    scan = client.get("/api/scan/demo").json()
    semgrep_f = next(f for f in scan["findings"] if f["source"] == "semgrep")
    fid = semgrep_f["id"]
    store.save_explanation(fid, None)  # no patch

    r = client.get(f"/api/findings/{fid}/diff")
    assert r.status_code == 400


def test_diff_and_verify_full_loop():
    """Scan → inject patch → diff → verify resolved."""
    scan = client.get("/api/scan/demo").json()
    semgrep_f = next(f for f in scan["findings"] if f["source"] == "semgrep")
    fid = semgrep_f["id"]

    # Inject a patch as if the AI returned it
    store.save_explanation(fid, {
        "summary": "subprocess shell=True is dangerous",
        "impact": "OS command injection",
        "confidence": "high",
        "remediation": "Use shell=False",
        "patch": "shell=False,",
        "verification_steps": ["Re-run semgrep"],
        "beginner_tip": "tip",
        "hinglish_summary": None,
        "ai_model": "test",
        "fallback": False,
    })

    # Get diff
    diff_r = client.get(f"/api/findings/{fid}/diff")
    assert diff_r.status_code == 200
    diff_data = diff_r.json()
    assert "shell=False" in diff_data["diff"]
    assert "shell=True" in diff_data["diff"]

    # Verify
    ver_r = client.post(f"/api/findings/{fid}/verify")
    assert ver_r.status_code == 200
    ver = ver_r.json()
    assert ver["status"] == "resolved"
    assert "no longer detected" in ver["message"]


def test_verify_still_detected_when_patch_is_noop():
    scan = client.get("/api/scan/demo").json()
    semgrep_f = next(f for f in scan["findings"] if f["source"] == "semgrep")
    fid = semgrep_f["id"]

    # Inject a patch that doesn't actually fix anything
    store.save_explanation(fid, {
        "summary": "test",
        "impact": "test",
        "confidence": "medium",
        "remediation": "test",
        "patch": "shell=True,",   # unchanged — still vulnerable
        "verification_steps": [],
        "beginner_tip": None,
        "hinglish_summary": None,
        "ai_model": "test",
        "fallback": False,
    })

    ver_r = client.post(f"/api/findings/{fid}/verify")
    assert ver_r.status_code == 200
    ver = ver_r.json()
    assert ver["status"] == "still_detected"


def test_report_json():
    scan = client.get("/api/scan/demo").json()
    scan_id = scan["scan_id"]
    r = client.get(f"/api/scan/{scan_id}/report/json")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("application/json")


def test_report_markdown():
    scan = client.get("/api/scan/demo").json()
    scan_id = scan["scan_id"]
    r = client.get(f"/api/scan/{scan_id}/report/markdown")
    assert r.status_code == 200
    assert "RepoShield AI" in r.text
    assert "Critical" in r.text or "High" in r.text

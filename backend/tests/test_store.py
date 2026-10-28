import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from schemas import Finding, ScanResult
import store


def _make_finding(id: str = "finding-abc") -> Finding:
    return Finding(
        id=id,
        rule_id="test.rule",
        category="injection",
        severity="high",
        file="app.py",
        line=1,
        message="test",
        code_excerpt="bad_code()",
        source="semgrep",
    )


def test_save_and_retrieve_scan():
    f = _make_finding("finding-store001")
    result = ScanResult(
        scan_id="scan-store001",
        target="test.py",
        scanner="semgrep",
        findings=[f],
    )
    store.save_scan(result)
    retrieved = store.get_scan("scan-store001")
    assert retrieved is not None
    assert retrieved.scan_id == "scan-store001"


def test_finding_retrievable_by_id():
    f = _make_finding("finding-store002")
    result = ScanResult(
        scan_id="scan-store002",
        target="test.py",
        scanner="semgrep",
        findings=[f],
    )
    store.save_scan(result)
    retrieved = store.get_finding("finding-store002")
    assert retrieved is not None
    assert retrieved.rule_id == "test.rule"


def test_missing_scan_returns_none():
    assert store.get_scan("nonexistent-scan") is None


def test_missing_finding_returns_none():
    assert store.get_finding("nonexistent-finding") is None


def test_save_and_get_explanation():
    store.save_explanation("finding-exp001", {"summary": "test"})
    cached = store.get_explanation("finding-exp001")
    assert cached == {"summary": "test"}

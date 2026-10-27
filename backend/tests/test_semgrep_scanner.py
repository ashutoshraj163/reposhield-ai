import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scanners.semgrep_scanner import scan_path, _infer_category

DEMO_FILE = Path(__file__).resolve().parents[2] / "demo" / "vulnerable.py"


def test_scan_vulnerable_fixture_returns_findings():
    findings = scan_path(DEMO_FILE)
    assert len(findings) >= 1, "Expected at least one finding in vulnerable.py"


def test_finding_fields_are_populated():
    findings = scan_path(DEMO_FILE)
    f = findings[0]
    assert f.rule_id
    assert f.file.endswith("vulnerable.py")
    assert f.line > 0
    assert f.severity in ("critical", "high", "medium", "low", "info")
    assert f.source == "semgrep"
    assert f.status == "open"


def test_category_injection():
    assert _infer_category("python.lang.security.audit.subprocess-shell-true") == "injection"


def test_category_secrets():
    assert _infer_category("generic.secrets.hardcoded-password") == "secrets"


def test_category_fallback():
    assert _infer_category("some.unknown.rule") == "security"

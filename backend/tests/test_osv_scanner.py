import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scanners.osv_scanner import scan_requirements, _parse_requirements

DEMO_REQ = Path(__file__).resolve().parents[2] / "demo" / "requirements.txt"


def test_parse_requirements():
    packages = _parse_requirements(DEMO_REQ)
    names = [p[0].lower() for p in packages]
    assert "django" in names
    assert "requests" in names


def test_osv_returns_findings_for_old_deps():
    findings = scan_requirements(DEMO_REQ)
    # Old django==2.2.0 and requests==2.20.0 definitely have known CVEs
    assert len(findings) >= 1, "Expected at least one CVE for ancient dependencies"


def test_findings_have_correct_fields():
    findings = scan_requirements(DEMO_REQ)
    for f in findings:
        assert f.category == "dependency"
        assert f.source == "osv"
        assert f.severity in ("critical", "high", "medium", "low", "info")
        assert "==" in f.code_excerpt

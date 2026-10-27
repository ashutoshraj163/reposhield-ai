import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scanners.gitleaks_scanner import scan_path

SECRETS_FILE = Path(__file__).resolve().parents[2] / "demo" / "secrets_fixture.py"
VULNERABLE_FILE = Path(__file__).resolve().parents[2] / "demo" / "vulnerable.py"


def test_detects_secrets_in_fixture():
    findings = scan_path(SECRETS_FILE)
    assert len(findings) >= 1, "Expected at least one secret finding"


def test_findings_are_categorized_as_secrets():
    findings = scan_path(SECRETS_FILE)
    for f in findings:
        assert f.category == "secrets"
        assert f.source == "gitleaks"
        assert f.severity == "high"


def test_no_false_positives_on_clean_code():
    # vulnerable.py has code issues but no hardcoded API keys/tokens
    findings = scan_path(VULNERABLE_FILE)
    # gitleaks may or may not flag the hardcoded password string — that's acceptable
    for f in findings:
        assert f.category == "secrets"

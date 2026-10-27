import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scanners.runner import run_all, _find_requirements, _semgrep_config

DEMO_DIR = Path(__file__).resolve().parents[2] / "demo"
SECRETS_FILE = DEMO_DIR / "secrets_fixture.py"


def test_run_all_returns_findings_from_multiple_scanners():
    findings, errors = run_all(DEMO_DIR)
    sources = {f.source for f in findings}
    # Should get findings from at least two scanners
    assert len(sources) >= 2, f"Expected multiple scanner sources, got: {sources}"


def test_run_all_no_fatal_errors():
    _, errors = run_all(DEMO_DIR)
    # Non-fatal errors are acceptable (e.g. network timeout for OSV)
    # but we shouldn't have all three scanners fail
    assert len(errors) < 3


def test_all_findings_have_required_fields():
    findings, _ = run_all(DEMO_DIR)
    for f in findings:
        assert f.id.startswith("finding-")
        assert f.rule_id
        assert f.severity in ("critical", "high", "medium", "low", "info")
        assert f.source in ("semgrep", "gitleaks", "osv")


def test_find_requirements_locates_file():
    req = _find_requirements(DEMO_DIR)
    assert req is not None
    assert req.name == "requirements.txt"


def test_semgrep_config_python():
    assert _semgrep_config(DEMO_DIR / "vulnerable.py") == "p/python"

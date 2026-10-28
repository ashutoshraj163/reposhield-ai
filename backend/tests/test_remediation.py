import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from schemas import Finding
from services.remediation import apply_patch, diff_patch, verify_patch

DEMO_FILE = Path(__file__).resolve().parents[2] / "demo" / "vulnerable.py"

SHELL_FINDING = Finding(
    id="finding-remed001",
    rule_id="python.lang.security.audit.subprocess-shell-true.subprocess-shell-true",
    category="injection",
    severity="high",
    file=str(DEMO_FILE),
    line=14,
    message="subprocess with shell=True",
    code_excerpt="shell=True,",
    source="semgrep",
)


def test_diff_patch_produces_unified_diff():
    original = "x = 1\ny = bad_call()\nz = 3\n"
    patched = "x = 1\ny = safe_call()\nz = 3\n"
    diff = diff_patch(original, patched, "test.py")
    assert "---" in diff
    assert "+++" in diff
    assert "-y = bad_call()" in diff
    assert "+y = safe_call()" in diff


def test_diff_patch_empty_when_identical():
    code = "x = 1\n"
    diff = diff_patch(code, code, "test.py")
    assert diff == ""


def test_apply_patch_replaces_target_line():
    original = "def foo():\n    result = subprocess.run(cmd, shell=True)\n    return result\n"
    finding = Finding(
        id="f1", rule_id="test", category="injection", severity="high",
        file="test.py", line=2,
        message="msg", code_excerpt="shell=True", source="semgrep",
    )
    patched = apply_patch(original, "result = subprocess.run(cmd, shell=False)", finding)
    assert "shell=False" in patched
    assert "def foo():" in patched


def test_apply_patch_out_of_bounds_appends():
    original = "x = 1\n"
    finding = Finding(
        id="f2", rule_id="test", category="injection", severity="high",
        file="test.py", line=999,
        message="msg", code_excerpt="bad", source="semgrep",
    )
    result = apply_patch(original, "safe_code()", finding)
    assert "x = 1" in result
    assert "safe_code()" in result


def test_diff_reflects_apply_patch():
    original = DEMO_FILE.read_text()
    finding = SHELL_FINDING
    patched = apply_patch(original, "shell=False,", finding)
    diff = diff_patch(original, patched, DEMO_FILE.name)
    assert "-" in diff and "+" in diff


def test_verify_patch_resolved():
    """Patching shell=True → shell=False should resolve the semgrep finding."""
    original = DEMO_FILE.read_text()
    patched = apply_patch(original, "shell=False,", SHELL_FINDING)
    status, remaining = verify_patch(str(DEMO_FILE), patched, SHELL_FINDING)
    # The specific shell=True rule should no longer fire
    assert status == "resolved"
    shell_findings = [f for f in remaining if "subprocess-shell-true" in f.rule_id]
    assert len(shell_findings) == 0


def test_verify_patch_still_detected_when_unfixed():
    """Supplying the original code as the 'patch' should still detect the issue."""
    original = DEMO_FILE.read_text()
    # Pass original line back — nothing changed
    patched = apply_patch(original, "shell=True,", SHELL_FINDING)
    status, _ = verify_patch(str(DEMO_FILE), patched, SHELL_FINDING)
    assert status == "still_detected"


def test_verify_patch_osv_finding_returns_resolved():
    """OSV findings can't be re-scanned from a single file — should return resolved."""
    osv_finding = Finding(
        id="f-osv", rule_id="osv.GHSA-xxx", category="dependency", severity="high",
        file="requirements.txt", line=1,
        message="dep vuln", code_excerpt="django==2.2.0", source="osv",
    )
    status, remaining = verify_patch("requirements.txt", "django==4.2.0\n", osv_finding)
    assert status == "resolved"
    assert remaining == []

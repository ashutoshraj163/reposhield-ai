import json
import subprocess
import uuid
from pathlib import Path

from schemas import Finding

_GITLEAKS_BIN = Path(__file__).resolve().parents[1] / ".tools" / "gitleaks"

SCAN_TIMEOUT_SECS = 60


def _gitleaks_bin() -> str:
    if _GITLEAKS_BIN.exists():
        return str(_GITLEAKS_BIN)
    return "gitleaks"


def scan_path(target: Path) -> list[Finding]:
    """
    Run gitleaks against a directory or file. Never executes scanned code.
    Returns normalized Finding objects for any detected secrets.
    """
    target = Path(target).resolve()
    if not target.exists():
        raise FileNotFoundError(f"Target not found: {target}")

    cmd = [
        _gitleaks_bin(),
        "detect",
        "--source", str(target),
        "--report-format", "json",
        "--report-path", "/dev/stdout",
        "--no-banner",
        "--no-git",
        "--redact",      # replace secret value with REDACTED in output
    ]

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        timeout=SCAN_TIMEOUT_SECS + 10,
    )

    # gitleaks exits 1 when leaks found, 0 when clean, 126/127 on failure
    if result.returncode not in (0, 1):
        raise RuntimeError(
            f"Gitleaks failed (exit {result.returncode}): {result.stderr[:500]}"
        )

    stdout = result.stdout.strip()
    if not stdout or stdout == "null":
        return []

    try:
        data = json.loads(stdout)
    except json.JSONDecodeError:
        return []

    if not isinstance(data, list):
        return []

    return [_normalize(r, target) for r in data]


def _normalize(raw: dict, scan_root: Path) -> Finding:
    file_path = raw.get("File", "unknown")
    line_num = raw.get("StartLine", 0)
    rule_id = raw.get("RuleID", "unknown")
    description = raw.get("Description", "Secret detected")
    match = raw.get("Match", "")

    # Compute path relative to scan root for cleaner display
    try:
        rel = str(Path(file_path).relative_to(scan_root))
    except ValueError:
        rel = file_path

    # Extract code excerpt — match already has the secret REDACTED by --redact flag
    excerpt = match.strip()[:300] if match else _read_line(file_path, line_num)

    return Finding(
        id=f"finding-{uuid.uuid4().hex[:8]}",
        rule_id=f"gitleaks.{rule_id}",
        category="secrets",
        severity="high",
        file=rel,
        abs_path=file_path,
        line=line_num,
        message=f"{description} — rule: {rule_id}",
        code_excerpt=excerpt,
        source="gitleaks",
    )


def _read_line(file_path: str, line_num: int) -> str:
    try:
        lines = Path(file_path).read_text(errors="replace").splitlines()
        if 1 <= line_num <= len(lines):
            return lines[line_num - 1].strip()[:300]
    except OSError:
        pass
    return ""

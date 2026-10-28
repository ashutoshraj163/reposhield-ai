import json
import os
import subprocess
import uuid
from pathlib import Path

from schemas import Finding

# Semgrep lives in its own isolated venv to avoid opentelemetry conflicts
_SEMGREP_BIN = Path(__file__).resolve().parents[1] / ".venv_semgrep" / "bin" / "semgrep"

SEVERITY_MAP = {
    "ERROR": "high",
    "WARNING": "medium",
    "INFO": "info",
    "CRITICAL": "critical",
}

MAX_FILE_SIZE_MB = 5
SCAN_TIMEOUT_SECS = 60


def _semgrep_bin() -> str:
    # Docker sets SEMGREP_BIN to /opt/semgrep-venv/bin/semgrep
    env_bin = os.environ.get("SEMGREP_BIN", "")
    if env_bin and Path(env_bin).exists():
        return env_bin
    if _SEMGREP_BIN.exists():
        return str(_SEMGREP_BIN)
    return "semgrep"


def scan_path(target: Path, config: str = "p/python") -> list[Finding]:
    """
    Run semgrep against a file or directory. Never executes the scanned code.
    Returns a list of normalized Finding objects.
    """
    target = Path(target).resolve()
    if not target.exists():
        raise FileNotFoundError(f"Target not found: {target}")

    cmd = [
        _semgrep_bin(),
        "scan",
        "--config", config,
        "--json",
        "--timeout", str(SCAN_TIMEOUT_SECS),
        "--max-target-bytes", str(MAX_FILE_SIZE_MB * 1024 * 1024),
        "--no-git-ignore",
        str(target),
    ]

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        timeout=SCAN_TIMEOUT_SECS + 10,
    )

    # Semgrep exits 1 when findings are present — that's normal
    if result.returncode not in (0, 1):
        raise RuntimeError(
            f"Semgrep failed (exit {result.returncode}): {result.stderr[:500]}"
        )

    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Semgrep produced invalid JSON: {e}")

    scan_root = target if target.is_dir() else target.parent
    return [_normalize(r, scan_root) for r in data.get("results", [])]


def _normalize(raw: dict, scan_root: Path) -> Finding:
    extra = raw.get("extra", {})
    severity_raw = extra.get("severity", "INFO").upper()
    severity = SEVERITY_MAP.get(severity_raw, "info")

    file_path = raw.get("path", "unknown")
    line_num = raw.get("start", {}).get("line", 0)

    # Make path relative to scan root for cleaner display
    try:
        rel_path = str(Path(file_path).relative_to(scan_root))
    except ValueError:
        rel_path = file_path
    file_path = rel_path

    # semgrep's `lines` field requires a logged-in account; read directly from disk instead
    abs_path = raw.get("path", "unknown")
    semgrep_lines = extra.get("lines", "")
    if semgrep_lines and semgrep_lines != "requires login":
        excerpt = semgrep_lines.splitlines()[0].strip()[:300]
    else:
        excerpt = _read_line(abs_path, line_num)

    rule_id: str = raw.get("check_id", "unknown")
    category = _infer_category(rule_id)

    return Finding(
        id=f"finding-{uuid.uuid4().hex[:8]}",
        rule_id=rule_id,
        category=category,
        severity=severity,
        file=file_path,
        abs_path=abs_path,
        line=line_num,
        message=extra.get("message", "")[:500],
        code_excerpt=excerpt,
        source="semgrep",
    )


def _read_line(file_path: str, line_num: int) -> str:
    """Read a single line from a source file by line number (1-indexed)."""
    try:
        lines = Path(file_path).read_text(errors="replace").splitlines()
        if 1 <= line_num <= len(lines):
            return lines[line_num - 1].strip()[:300]
    except OSError:
        pass
    return ""


def _infer_category(rule_id: str) -> str:
    rule_lower = rule_id.lower()
    if any(k in rule_lower for k in ("inject", "sqli", "xss", "exec", "shell", "command")):
        return "injection"
    if any(k in rule_lower for k in ("secret", "key", "token", "password", "credential")):
        return "secrets"
    if any(k in rule_lower for k in ("deseri", "pickle", "yaml")):
        return "deserialization"
    if any(k in rule_lower for k in ("path", "traversal", "open")):
        return "path-traversal"
    if any(k in rule_lower for k in ("crypto", "cipher", "hash", "tls", "ssl")):
        return "cryptography"
    return "security"

"""
Combined scanner runner — runs all enabled scanners against a target directory
and returns a unified list of normalized findings.
"""
import logging
from pathlib import Path

from schemas import Finding
from scanners import semgrep_scanner, gitleaks_scanner, osv_scanner

logger = logging.getLogger(__name__)

SUPPORTED_CODE_EXTENSIONS = {".py", ".js", ".ts", ".jsx", ".tsx"}


def run_all(target: Path) -> tuple[list[Finding], list[str]]:
    """
    Run semgrep, gitleaks, and OSV against *target* (file or directory).
    Returns (findings, errors) where errors is a list of non-fatal scanner messages.
    """
    target = Path(target).resolve()
    findings: list[Finding] = []
    errors: list[str] = []

    # --- Semgrep ---
    try:
        config = _semgrep_config(target)
        semgrep_findings = semgrep_scanner.scan_path(target, config=config)
        findings.extend(semgrep_findings)
        logger.info("semgrep: %d findings", len(semgrep_findings))
    except Exception as e:
        errors.append(f"semgrep: {e}")
        logger.warning("semgrep failed: %s", e)

    # --- Gitleaks ---
    try:
        gl_findings = gitleaks_scanner.scan_path(target)
        findings.extend(gl_findings)
        logger.info("gitleaks: %d findings", len(gl_findings))
    except Exception as e:
        errors.append(f"gitleaks: {e}")
        logger.warning("gitleaks failed: %s", e)

    # --- OSV (dependency vulnerabilities) ---
    req_file = _find_requirements(target)
    if req_file:
        try:
            osv_findings = osv_scanner.scan_requirements(req_file)
            findings.extend(osv_findings)
            logger.info("osv: %d findings", len(osv_findings))
        except Exception as e:
            errors.append(f"osv: {e}")
            logger.warning("osv failed: %s", e)

    return findings, errors


def _semgrep_config(target: Path) -> str:
    """Pick a semgrep ruleset based on what languages are present."""
    if target.is_file():
        extensions = {target.suffix}
    else:
        extensions = {p.suffix for p in target.rglob("*") if p.is_file()}

    has_py = bool(extensions & {".py"})
    has_js = bool(extensions & {".js", ".ts", ".jsx", ".tsx"})

    if has_py and has_js:
        return "p/default"
    if has_js:
        return "p/javascript"
    return "p/python"


def _find_requirements(target: Path) -> Path | None:
    if target.is_file():
        target = target.parent
    for name in ("requirements.txt", "requirements-dev.txt"):
        candidate = target / name
        if candidate.exists():
            return candidate
    # Also check inside immediate subfolder (typical for GitHub zip downloads)
    for name in ("requirements.txt", "requirements-dev.txt"):
        for sub in target.glob(f"*/{name}"):
            if sub.is_file():
                return sub
    return None

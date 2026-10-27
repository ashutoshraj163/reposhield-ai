import uuid
from pathlib import Path

import httpx
from schemas import Finding

OSV_QUERY_URL = "https://api.osv.dev/v1/query"
REQUEST_TIMEOUT = 20
MAX_FINDINGS_PER_PACKAGE = 5  # cap to avoid flooding the report


def scan_requirements(req_file: Path) -> list[Finding]:
    """
    Parse a requirements.txt and query OSV for known vulnerabilities.
    Returns normalized Finding objects, capped per package to keep reports readable.
    """
    req_file = Path(req_file).resolve()
    if not req_file.exists():
        raise FileNotFoundError(f"Requirements file not found: {req_file}")

    packages = _parse_requirements(req_file)
    if not packages:
        return []

    findings = []
    for pkg_name, pkg_version in packages:
        vulns = _query_osv(pkg_name, pkg_version)
        # Sort by severity descending, take top N
        vulns_sorted = sorted(vulns, key=lambda v: _severity_rank(v), reverse=True)
        for v in vulns_sorted[:MAX_FINDINGS_PER_PACKAGE]:
            findings.append(_normalize(v, pkg_name, pkg_version, req_file))

    return findings


def _parse_requirements(req_file: Path) -> list[tuple[str, str]]:
    packages = []
    for line in req_file.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or line.startswith("-"):
            continue
        for sep in ("==", ">=", "<=", "~=", "!="):
            if sep in line:
                name, version = line.split(sep, 1)
                version = version.split(",")[0].strip()
                packages.append((name.strip(), version.strip()))
                break
    return packages


def _query_osv(pkg_name: str, pkg_version: str) -> list[dict]:
    try:
        resp = httpx.post(
            OSV_QUERY_URL,
            json={"version": pkg_version, "package": {"name": pkg_name, "ecosystem": "PyPI"}},
            timeout=REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        return resp.json().get("vulns", [])
    except Exception:
        return []


def _normalize(vuln: dict, pkg_name: str, pkg_version: str, req_file: Path) -> Finding:
    vuln_id = vuln.get("id", "UNKNOWN")
    summary = vuln.get("summary", "Known vulnerability")
    severity = _map_severity(vuln)

    aliases = vuln.get("aliases", [])
    cve = next((a for a in aliases if a.startswith("CVE-")), None)
    message = f"{pkg_name}=={pkg_version} — {vuln_id}"
    if cve:
        message += f" ({cve})"
    if summary:
        message += f": {summary}"

    return Finding(
        id=f"finding-{uuid.uuid4().hex[:8]}",
        rule_id=f"osv.{vuln_id}",
        category="dependency",
        severity=severity,
        file=str(req_file.name),
        line=_find_package_line(req_file, pkg_name),
        message=message[:500],
        code_excerpt=f"{pkg_name}=={pkg_version}",
        source="osv",
    )


def _severity_rank(vuln: dict) -> int:
    sev = _map_severity(vuln)
    return {"critical": 4, "high": 3, "medium": 2, "low": 1, "info": 0}.get(sev, 0)


def _map_severity(vuln: dict) -> str:
    """
    Parse CVSS v3/v4 vector string to derive severity.
    Falls back to medium when no severity data is available.
    """
    for sev in vuln.get("severity", []):
        score_str = sev.get("score", "")
        # Numeric score (older OSV format)
        try:
            score = float(score_str)
            if score >= 9.0:
                return "critical"
            if score >= 7.0:
                return "high"
            if score >= 4.0:
                return "medium"
            return "low"
        except (ValueError, TypeError):
            pass
        # CVSS vector string — derive from CIA impact components
        if "CVSS" in score_str:
            return _severity_from_vector(score_str)
    return "medium"


def _severity_from_vector(vector: str) -> str:
    """
    Rough severity from CVSS v3 vector without a full calculator.
    Counts high-impact components (C:H, I:H, A:H).
    """
    high_count = vector.count(":H")
    if high_count >= 3:
        return "critical"
    if high_count >= 2:
        return "high"
    if high_count >= 1:
        return "medium"
    return "low"


def _find_package_line(req_file: Path, pkg_name: str) -> int:
    try:
        for i, line in enumerate(req_file.read_text().splitlines(), start=1):
            if line.lower().startswith(pkg_name.lower()):
                return i
    except OSError:
        pass
    return 0

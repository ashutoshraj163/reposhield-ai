"""
In-memory findings store keyed by scan_id and finding_id.
Simple dict for the MVP — survives the process lifetime, not restarts.
"""
from schemas import Finding, ScanResult

_scans: dict[str, ScanResult] = {}
_findings: dict[str, Finding] = {}
_explanations: dict[str, dict] = {}


def save_scan(result: ScanResult) -> None:
    _scans[result.scan_id] = result
    for finding in result.findings:
        _findings[finding.id] = finding


def get_scan(scan_id: str) -> ScanResult | None:
    return _scans.get(scan_id)


def get_finding(finding_id: str) -> Finding | None:
    return _findings.get(finding_id)


def save_explanation(finding_id: str, explanation: dict) -> None:
    _explanations[finding_id] = explanation


def get_explanation(finding_id: str) -> dict | None:
    return _explanations.get(finding_id)

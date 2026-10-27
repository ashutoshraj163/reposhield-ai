from pydantic import BaseModel
from typing import Literal


class Finding(BaseModel):
    id: str
    rule_id: str
    category: str
    severity: Literal["critical", "high", "medium", "low", "info"]
    file: str
    line: int
    message: str
    code_excerpt: str
    source: str
    status: Literal["open", "resolved", "verified"] = "open"


class ScanSummary(BaseModel):
    total: int
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    info: int = 0


class ScanResult(BaseModel):
    scan_id: str
    target: str
    scanner: str
    findings: list[Finding]
    summary: ScanSummary | None = None
    error: str | None = None

    def model_post_init(self, __context) -> None:
        counts: dict[str, int] = {}
        for f in self.findings:
            counts[f.severity] = counts.get(f.severity, 0) + 1
        object.__setattr__(
            self,
            "summary",
            ScanSummary(
                total=len(self.findings),
                critical=counts.get("critical", 0),
                high=counts.get("high", 0),
                medium=counts.get("medium", 0),
                low=counts.get("low", 0),
                info=counts.get("info", 0),
            ),
        )

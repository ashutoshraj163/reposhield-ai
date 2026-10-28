from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

import store
from schemas import AIExplanation
from services import bharatcode
from services.remediation import apply_patch, diff_patch, verify_patch

router = APIRouter(prefix="/api/findings", tags=["findings"])


class DiffResponse(BaseModel):
    diff: str
    patched_content: str
    original_file: str


class VerifyResponse(BaseModel):
    status: str  # "resolved" | "still_detected" | "verification_failed"
    checked_rule: str
    remaining_count: int
    message: str


class ApplyRequest(BaseModel):
    patch: str


# ── Explain ──────────────────────────────────────────────────────────────────


@router.post("/{finding_id}/explain")
async def explain_finding(finding_id: str) -> AIExplanation:
    """Generate an AI explanation. Returns cached result on repeat calls."""
    cached = store.get_explanation(finding_id)
    if cached:
        return AIExplanation(**cached)

    finding = store.get_finding(finding_id)
    if not finding:
        raise HTTPException(404, f"Finding {finding_id!r} not found. Run a scan first.")

    explanation = await bharatcode.explain_finding(finding)
    store.save_explanation(finding_id, explanation.model_dump())
    return explanation


@router.get("/{finding_id}/explain")
async def get_explanation(finding_id: str) -> AIExplanation:
    """Retrieve a cached explanation without calling the AI again."""
    cached = store.get_explanation(finding_id)
    if not cached:
        raise HTTPException(404, "No explanation cached. Call POST /explain first.")
    return AIExplanation(**cached)


# ── Patch ─────────────────────────────────────────────────────────────────────


@router.post("/{finding_id}/patch")
async def generate_patch(finding_id: str) -> AIExplanation:
    """Generate (or regenerate) a patch. Calls explain first if needed."""
    finding = store.get_finding(finding_id)
    if not finding:
        raise HTTPException(404, f"Finding {finding_id!r} not found. Run a scan first.")

    cached = store.get_explanation(finding_id)
    explanation = AIExplanation(**cached) if cached else await bharatcode.explain_finding(finding)

    if not explanation.patch:
        explanation = await bharatcode.generate_patch(finding, explanation)

    store.save_explanation(finding_id, explanation.model_dump())
    return explanation


# ── Diff ──────────────────────────────────────────────────────────────────────


@router.get("/{finding_id}/diff")
def get_diff(finding_id: str) -> DiffResponse:
    """
    Return a unified diff of the proposed patch against the original file.
    Requires a cached explanation with a patch field.
    """
    finding = store.get_finding(finding_id)
    if not finding:
        raise HTTPException(404, f"Finding {finding_id!r} not found.")

    cached = store.get_explanation(finding_id)
    if not cached or not cached.get("patch"):
        raise HTTPException(
            400, "No patch available. Call POST /patch first to generate one."
        )

    patch_snippet = cached["patch"]
    # Use abs_path if available, fall back to file (which may be relative)
    file_path = Path(finding.abs_path or finding.file)

    try:
        original_content = file_path.read_text(errors="replace")
    except OSError:
        raise HTTPException(
            404,
            f"Source file not readable at {finding.file!r}. "
            "Temporary scan workspaces are deleted after scanning. "
            "Use the demo scan or re-upload the file to use diff/verify.",
        )

    patched_content = apply_patch(original_content, patch_snippet, finding)
    diff = diff_patch(original_content, patched_content, Path(finding.file).name)

    return DiffResponse(
        diff=diff,
        patched_content=patched_content,
        original_file=finding.file,
    )


# ── Verify ────────────────────────────────────────────────────────────────────


@router.post("/{finding_id}/verify")
def verify_finding(finding_id: str) -> VerifyResponse:
    """
    Apply the cached patch to a temp copy of the file and re-run the scanner.
    Returns resolved / still_detected / verification_failed.
    """
    finding = store.get_finding(finding_id)
    if not finding:
        raise HTTPException(404, f"Finding {finding_id!r} not found.")

    cached = store.get_explanation(finding_id)
    if not cached or not cached.get("patch"):
        raise HTTPException(
            400, "No patch to verify. Call POST /patch first."
        )

    patch_snippet = cached["patch"]
    file_path = Path(finding.abs_path or finding.file)

    try:
        original_content = file_path.read_text(errors="replace")
    except OSError:
        return VerifyResponse(
            status="verification_failed",
            checked_rule=finding.rule_id,
            remaining_count=0,
            message=f"Source file not readable at {finding.file!r}. "
                    "Temporary scan workspaces are deleted after scanning.",
        )

    patched_content = apply_patch(original_content, patch_snippet, finding)
    status, remaining = verify_patch(finding.file, patched_content, finding)

    messages = {
        "resolved":             f"✓ {finding.rule_id} no longer detected after patch.",
        "still_detected":       f"✗ {finding.rule_id} still detected. Patch may be incomplete.",
        "verification_failed":  "Scanner could not complete verification.",
    }

    return VerifyResponse(
        status=status,
        checked_rule=finding.rule_id,
        remaining_count=len(remaining),
        message=messages[status],
    )

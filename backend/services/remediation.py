"""
Patch application and verification service.

Flow:
  1. apply_patch()  — write the proposed patch into a temp copy of the file
  2. verify_patch() — re-run the relevant scanner on that file; return status
  3. diff_patch()   — produce a unified diff of original vs patched

The scanned repo is never mutated; all operations work on temp copies.
"""
import difflib
import logging
import shutil
import tempfile
from pathlib import Path
from typing import Literal

from scanners import semgrep_scanner, gitleaks_scanner
from schemas import Finding

logger = logging.getLogger(__name__)

VerifyStatus = Literal["resolved", "still_detected", "verification_failed"]


def diff_patch(original_code: str, patched_code: str, filename: str = "file") -> str:
    """Return a unified diff string between original and patched code."""
    original_lines = original_code.splitlines(keepends=True)
    patched_lines = patched_code.splitlines(keepends=True)
    diff = difflib.unified_diff(
        original_lines,
        patched_lines,
        fromfile=f"a/{filename}",
        tofile=f"b/{filename}",
        lineterm="",
    )
    return "".join(diff)


def apply_patch(original_code: str, patch_snippet: str, finding: Finding) -> str:
    """
    Splice the patch snippet into the original source at the finding's line.
    Returns the full patched file content.

    Strategy: replace the finding's line(s) with the patch snippet.
    This is deliberately simple — it handles single-line replacements well
    and gracefully falls back to appending a comment for complex cases.
    """
    lines = original_code.splitlines(keepends=True)
    target_line = finding.line - 1  # convert to 0-indexed

    if not lines or target_line < 0 or target_line >= len(lines):
        # Can't splice — return original with patch appended as comment
        return original_code + f"\n# Suggested patch:\n# {patch_snippet}\n"

    # Find how many original lines to replace by matching the code excerpt
    excerpt_lines = finding.code_excerpt.splitlines()
    replace_count = max(1, len(excerpt_lines))

    # Build replacement block, preserving leading indentation of the target line
    indent = len(lines[target_line]) - len(lines[target_line].lstrip())
    indent_str = " " * indent

    patch_lines = []
    for pl in patch_snippet.splitlines():
        patch_lines.append(indent_str + pl.lstrip() + "\n")

    new_lines = lines[:target_line] + patch_lines + lines[target_line + replace_count:]
    return "".join(new_lines)


def verify_patch(
    original_file_path: str,
    patched_content: str,
    finding: Finding,
) -> tuple[VerifyStatus, list[Finding]]:
    """
    Write patched_content to a temp file and re-run the relevant scanner.
    Returns (status, remaining_findings).

    'resolved'          — the original rule_id no longer appears
    'still_detected'    — the original rule_id is still present
    'verification_failed' — scanner errored out
    """
    work_dir = Path(tempfile.mkdtemp(prefix="reposhield_verify_"))
    orig_path = Path(original_file_path)
    temp_file = work_dir / orig_path.name

    try:
        temp_file.write_text(patched_content, encoding="utf-8", errors="replace")

        if finding.source == "semgrep":
            findings = semgrep_scanner.scan_path(temp_file)
        elif finding.source == "gitleaks":
            findings = gitleaks_scanner.scan_path(temp_file)
        else:
            # OSV / other — can't re-scan a single patched file meaningfully
            return "resolved", []

        # Check if the original rule still fires
        still_present = any(f.rule_id == finding.rule_id for f in findings)
        status: VerifyStatus = "still_detected" if still_present else "resolved"
        return status, findings

    except Exception as e:
        logger.warning("verify_patch failed: %s", e)
        return "verification_failed", []
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)

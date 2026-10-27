import shutil
import tempfile
import uuid
import zipfile
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile

from scanners.runner import run_all
from schemas import ScanResult

router = APIRouter(prefix="/api/scan", tags=["scan"])

MAX_UPLOAD_BYTES = 50 * 1024 * 1024  # 50 MB
DEMO_DIR = Path(__file__).resolve().parents[2] / "demo"


@router.get("/demo")
def scan_demo() -> ScanResult:
    """Scan all built-in vulnerable fixtures (code + secrets + deps)."""
    if not DEMO_DIR.exists():
        raise HTTPException(status_code=500, detail="Demo directory not found")

    findings, errors = run_all(DEMO_DIR)
    return ScanResult(
        scan_id=f"demo-{uuid.uuid4().hex[:8]}",
        target="demo/",
        scanner="semgrep+gitleaks+osv",
        findings=findings,
        error="; ".join(errors) if errors else None,
    )


@router.post("/upload")
async def scan_upload(file: UploadFile) -> ScanResult:
    """
    Accept a ZIP or single source file. Scan with all enabled scanners.
    Uploaded content is written to a temp directory and never executed.
    """
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 50 MB)")

    scan_id = f"scan-{uuid.uuid4().hex[:8]}"
    work_dir = Path(tempfile.mkdtemp(prefix="reposhield_"))

    try:
        filename = file.filename or "upload.py"

        if filename.endswith(".zip"):
            zip_path = work_dir / "upload.zip"
            zip_path.write_bytes(content)
            target = work_dir / "extracted"
            _safe_extract(zip_path, target)
        else:
            safe_name = Path(filename).name
            target = work_dir / safe_name
            target.write_bytes(content)

        findings, errors = run_all(target)
        return ScanResult(
            scan_id=scan_id,
            target=filename,
            scanner="semgrep+gitleaks+osv",
            findings=findings,
            error="; ".join(errors) if errors else None,
        )
    except Exception as e:
        return ScanResult(
            scan_id=scan_id,
            target=file.filename or "upload",
            scanner="semgrep+gitleaks+osv",
            findings=[],
            error=str(e)[:300],
        )
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)


def _safe_extract(zip_path: Path, dest: Path) -> None:
    """Extract ZIP while rejecting path traversal attempts."""
    dest.mkdir(parents=True, exist_ok=True)
    dest_str = str(dest.resolve())
    with zipfile.ZipFile(zip_path) as zf:
        for member in zf.infolist():
            member_path = (dest / member.filename).resolve()
            if not str(member_path).startswith(dest_str):
                raise ValueError(f"Path traversal rejected: {member.filename}")
            zf.extract(member, dest)

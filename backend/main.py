from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.scan import router as scan_router

app = FastAPI(
    title="RepoShield AI",
    description="Evidence-driven AI code security reviewer",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scan_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "RepoShield AI", "version": "0.1.0"}

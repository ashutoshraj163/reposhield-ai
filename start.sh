#!/usr/bin/env bash
# Start RepoShield AI locally for development.
# Usage: ./start.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

# ── Checks ─────────────────────────────────────────────────────────────────

check() {
  command -v "$1" &>/dev/null || { echo "ERROR: $1 not found. Install it first."; exit 1; }
}
check python3
check node
check npm

# ── Backend venv ────────────────────────────────────────────────────────────

if [ ! -d "$BACKEND/.venv" ]; then
  echo "→ Creating backend virtualenv..."
  python3 -m venv "$BACKEND/.venv"
  "$BACKEND/.venv/bin/pip" install -q -r "$BACKEND/requirements.txt"
fi

# Semgrep venv (isolated to avoid opentelemetry conflicts)
if [ ! -d "$BACKEND/.venv_semgrep" ]; then
  echo "→ Creating semgrep virtualenv..."
  python3 -m venv "$BACKEND/.venv_semgrep"
  "$BACKEND/.venv_semgrep/bin/pip" install -q semgrep==1.182.1
fi

# Gitleaks binary
if [ ! -f "$BACKEND/.tools/gitleaks" ]; then
  echo "→ Downloading gitleaks..."
  mkdir -p "$BACKEND/.tools"
  GITLEAKS_VERSION="8.26.0"
  curl -sSL \
    "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz" \
    | tar -xz -C "$BACKEND/.tools" gitleaks
  chmod +x "$BACKEND/.tools/gitleaks"
fi

# ── .env ────────────────────────────────────────────────────────────────────

if [ ! -f "$BACKEND/.env" ]; then
  cp "$BACKEND/../.env.example" "$BACKEND/.env" 2>/dev/null || \
    echo "BHARATCODE_API_KEY=\nBHARATCODE_MODEL=qwen-3.8-27b" > "$BACKEND/.env"
  echo "→ Created backend/.env — add your BHARATCODE_API_KEY for AI explanations."
fi

# ── Frontend deps ────────────────────────────────────────────────────────────

if [ ! -d "$FRONTEND/node_modules" ]; then
  echo "→ Installing frontend dependencies..."
  (cd "$FRONTEND" && npm install -q)
fi

# ── Start services ───────────────────────────────────────────────────────────

echo ""
echo "Starting RepoShield AI..."
echo "  Backend  → http://localhost:8000"
echo "  Frontend → http://localhost:5173"
echo "  API docs → http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both services."
echo ""

# Start backend
PYTHONPATH="$BACKEND" "$BACKEND/.venv/bin/uvicorn" main:app \
  --app-dir "$BACKEND" --host 0.0.0.0 --port 8000 --log-level info &
BACKEND_PID=$!

# Start frontend
(cd "$FRONTEND" && npm run dev -- --port 5173 --host) &
FRONTEND_PID=$!

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" EXIT

wait

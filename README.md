# RepoShield AI

**Find the flaw. Understand the risk. Fix it with evidence.**

An open-source AI-assisted code security reviewer built for the [BharatCode Build League](https://bharatcode.ai/hackathon) hackathon. It combines three real security scanners with BharatCode's Qwen model to produce actionable, beginner-friendly findings — and verifies that your fixes actually work.

---

## What it does

| Step | What happens |
|---|---|
| **Scan** | Run Semgrep, Gitleaks, and OSV against a GitHub repo, ZIP upload, or local demo |
| **Explain** | BharatCode AI explains each finding: impact, confidence, remediation steps, Hinglish summary |
| **Patch** | AI proposes a concrete code fix |
| **Diff** | Preview the before/after unified diff before applying anything |
| **Verify** | Re-run the scanner on a temp copy — confirms the rule no longer fires |
| **Export** | Download a structured Markdown or JSON security report |

---

## Demo

```bash
git clone https://github.com/ashutoshraj163/reposhield-ai.git
cd reposhield-ai
./start.sh          # starts backend :8000 and frontend :5173
```

Open **http://localhost:5173**, click **Run demo scan**, and follow the workflow.

---

## Scanners

| Scanner | What it finds |
|---|---|
| **Semgrep** | Insecure code patterns: command injection, SQL injection, hardcoded credentials, unsafe deserialization |
| **Gitleaks** | Hardcoded secrets in source files (API keys, tokens, passwords) — displayed as `REDACTED` |
| **OSV** | Known CVEs in Python dependencies via the Open Source Vulnerabilities API |

Each scanner failure is non-fatal — the others still run and report.

---

## AI explanations

Powered by BharatCode's `qwen-3.8-27b` model via the OpenAI-compatible API. Each explanation includes:

- Plain-English summary of the vulnerability
- Impact and confidence level
- Step-by-step remediation
- Concrete code patch
- Beginner tip
- Optional Hinglish summary

If the API key is absent or the call fails, a fallback explanation drawn from the scanner's own evidence is shown automatically.

---

## Security design

- Scanned code is **never executed**
- Secrets are **redacted** before being sent to the AI model
- GitHub URLs are validated by regex to prevent SSRF
- ZIP uploads are path-traversal-safe
- The AI model is instructed via system prompt to treat repo content as untrusted data

---

## Architecture

```
reposhield-ai/
├── backend/
│   ├── main.py               # FastAPI app
│   ├── schemas.py            # Pydantic v2 models
│   ├── store.py              # In-memory scan/finding store
│   ├── scanners/
│   │   ├── semgrep_scanner.py
│   │   ├── gitleaks_scanner.py
│   │   ├── osv_scanner.py
│   │   └── runner.py         # Combines all three scanners
│   ├── services/
│   │   ├── bharatcode.py     # AI explanation client
│   │   └── remediation.py    # Diff, patch, verify logic
│   └── routes/
│       ├── scan.py           # /api/scan/demo|upload|github
│       ├── findings.py       # /api/findings/{id}/explain|patch|diff|verify
│       └── reports.py        # /api/scan/{id}/report/json|markdown
└── frontend/
    └── src/
        ├── components/
        │   ├── FindingDrawer.tsx    # Slide-in detail panel
        │   └── PatchWorkflow.tsx   # Diff → verify flow
        └── lib/api.ts              # Typed API client
```

---

## API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/scan/demo` | Scan the bundled vulnerable fixture |
| `POST` | `/api/scan/upload` | Scan a ZIP or single file (max 50 MB) |
| `POST` | `/api/scan/github` | Scan a public GitHub repository |
| `POST` | `/api/findings/{id}/explain` | Generate AI explanation |
| `GET` | `/api/findings/{id}/explain` | Retrieve cached explanation |
| `POST` | `/api/findings/{id}/patch` | Generate code patch |
| `GET` | `/api/findings/{id}/diff` | Preview unified diff |
| `POST` | `/api/findings/{id}/verify` | Apply patch to temp copy and re-scan |
| `GET` | `/api/scan/{id}/report/json` | Download full JSON report |
| `GET` | `/api/scan/{id}/report/markdown` | Download Markdown report |

Interactive docs: **http://localhost:8000/docs**

---

## Setup

### Requirements

- Python 3.11+
- Node 18+
- npm

### One-command start

```bash
./start.sh
```

The script:
1. Creates `backend/.venv` and installs Python dependencies
2. Creates `backend/.venv_semgrep` (isolated to avoid opentelemetry conflicts)
3. Downloads the `gitleaks` binary to `backend/.tools/`
4. Creates `backend/.env` from `.env.example` if missing
5. Installs frontend npm dependencies
6. Starts uvicorn on `:8000` and Vite dev server on `:5173`

### Environment variables

Copy `.env.example` to `backend/.env` and fill in:

```env
BHARATCODE_API_KEY=your_api_key_here
BHARATCODE_MODEL=qwen-3.8-27b
```

Without `BHARATCODE_API_KEY`, scanning still works — AI explanations return a fallback derived from scanner evidence.

### Docker

```bash
cp .env.example backend/.env   # add your API key
docker compose up --build
```

Backend: **http://localhost:8000** — Frontend: **http://localhost:3000**

---

## Tests

```bash
cd backend
.venv/bin/pytest tests/ -v
```

78 tests across unit, integration, and security edge-case suites.

---

## Demo fixture

`demo/` contains three files with intentional vulnerabilities:

| File | Vulnerabilities |
|---|---|
| `vulnerable.py` | Command injection, SQL injection, hardcoded password |
| `secrets_fixture.py` | AWS key placeholder, GitHub token placeholder, database URL |
| `requirements.txt` | Ancient versions of Django, Flask, requests with known CVEs |

All credentials in the demo fixtures are clearly fake placeholders — never real keys.

---

## License

MIT — see [LICENSE](LICENSE).

---

## Built for BharatCode Build League 2026

**Model:** BharatCode `qwen-3.8-27b`
**Repository:** https://github.com/ashutoshraj163/reposhield-ai

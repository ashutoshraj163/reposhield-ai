# RepoShield AI — Demo Script

Use this script for the live demo and as a fallback if the network is unavailable.
Total runtime: ~2 minutes 30 seconds.

---

## Setup (before presenting)

```bash
# 1. Start both services
./start.sh

# 2. Open http://localhost:5173 in the browser
# 3. Open http://localhost:8000/docs in a second tab (backup)
# 4. Have the Markdown report from a previous demo scan ready as a fallback
```

---

## Segment 1 — The problem (0:00–0:20)

**Say:**
> "Developers ship working code that still contains security weaknesses.
> Tools like Semgrep, Gitleaks, and OSV can find them — but reading raw
> scanner output doesn't tell you *why* something is dangerous, *what* to do
> about it, or whether your fix actually worked.
> RepoShield bridges that gap."

---

## Segment 2 — Scan the demo fixture (0:20–0:55)

1. Click **Run demo scan** on the upload screen.
2. Wait ~10 seconds for the scan to complete.
3. Point out the summary bar — Critical / High / Medium counts.
4. **Say:** "Three scanners ran in parallel: Semgrep found insecure code,
   Gitleaks found hardcoded secrets, and OSV found known CVEs in the dependencies.
   Every finding shows a file, line number, and the exact evidence."
5. Use the filter bar to show **Gitleaks** findings only — highlight that
   secrets are redacted (`REDACTED`) in the display.
6. Switch to **Semgrep** — click the `subprocess-shell-true` finding to open the drawer.

---

## Segment 3 — Explain a finding (0:55–1:30)

1. In the drawer, show: severity badge, rule ID, file:line, code excerpt.
2. Click **Explain with AI**.
3. While it loads, **say:**
   > "We send only the scanner metadata and the specific line of code to BharatCode's
   > Qwen model — never the whole repository. The AI is grounded in what the scanner found."
4. Show the explanation: summary, impact, confidence level, remediation steps.
5. Point out the **Beginner tip** and offer to toggle the Hinglish summary.

---

## Segment 4 — Fix and verify (1:30–2:10)

1. Click **Generate patch** (if not already shown).
2. When the patch appears, click **Preview diff**.
3. Show the coloured diff: red `-shell=True,` → green `+shell=False,`.
4. **Say:** "The patch hasn't been applied yet — this is just a preview."
5. Click **Apply patch & verify**.
6. Show the green **✓ Resolved** badge.
7. **Say:** "Semgrep re-ran on a temporary copy of the file. The rule no longer fires.
   The report shows both the original finding and the verification result."

---

## Segment 5 — Export and close (2:10–2:30)

1. Click **Markdown** in the top bar to download the report.
2. Open it briefly in a text editor to show the structured evidence.
3. **Say:** "Everything is reproducible — same fixture, same scanners, same output.
   You can run this locally with one command."
4. Show `./start.sh` in the terminal.

---

## Fallback plan (if network / API unavailable)

| Issue | Fallback |
|---|---|
| BharatCode API down | Fallback explanation still shows scanner evidence; label says `(fallback)` |
| OSV network timeout | Semgrep + Gitleaks still run; error note shown in report |
| GitHub clone fails | Use ZIP upload or demo fixture |
| Frontend won't load | Use `http://localhost:8000/docs` (Swagger) to demo the API directly |
| Everything down | Show pre-recorded screen recording from `docs/demo_recording.mp4` |

---

## Key talking points

- **Evidence-grounded**: every AI explanation links back to a scanner rule and a line of code
- **Verified remediation**: re-scan after patch; show actual scanner result, not just "AI says fixed"
- **Safe by design**: scanned code is never executed; secrets are redacted before reaching the model
- **Reproducible**: one command, open source, works offline except for AI explanations and OSV lookups

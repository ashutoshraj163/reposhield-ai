const BASE = "/api";

export interface Finding {
  id: string;
  rule_id: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  file: string;
  line: number;
  message: string;
  code_excerpt: string;
  source: string;
  status: string;
}

export interface ScanSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

export interface ScanResult {
  scan_id: string;
  target: string;
  scanner: string;
  findings: Finding[];
  summary: ScanSummary;
  error: string | null;
}

export interface AIExplanation {
  summary: string;
  impact: string;
  confidence: "low" | "medium" | "high";
  remediation: string;
  patch: string | null;
  verification_steps: string[];
  beginner_tip: string | null;
  hinglish_summary: string | null;
  ai_model: string;
  fallback: boolean;
}

async function handleResponse<T>(res: Response, fallbackAction: string): Promise<T> {
  if (!res.ok) {
    let errorDetail = res.statusText;
    try {
      const data = await res.json();
      if (data && data.detail) {
        errorDetail = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
      }
    } catch {
      // Keep statusText if not json
    }
    throw new Error(`${fallbackAction}: ${errorDetail}`);
  }
  return res.json();
}

export async function scanDemo(): Promise<ScanResult> {
  const res = await fetch(`${BASE}/scan/demo`);
  return handleResponse<ScanResult>(res, "Scan failed");
}

export async function scanUpload(file: File): Promise<ScanResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/scan/upload`, { method: "POST", body: form });
  return handleResponse<ScanResult>(res, "Upload failed");
}

export async function scanGithub(url: string): Promise<ScanResult> {
  const res = await fetch(`${BASE}/scan/github`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  return handleResponse<ScanResult>(res, "GitHub scan failed");
}

export async function explainFinding(findingId: string): Promise<AIExplanation> {
  const res = await fetch(`${BASE}/findings/${findingId}/explain`, { method: "POST" });
  if (!res.ok) throw new Error(`Explain failed: ${res.statusText}`);
  return res.json();
}

export async function generatePatch(findingId: string): Promise<AIExplanation> {
  const res = await fetch(`${BASE}/findings/${findingId}/patch`, { method: "POST" });
  if (!res.ok) throw new Error(`Patch failed: ${res.statusText}`);
  return res.json();
}

export interface DiffResponse {
  diff: string;
  patched_content: string;
  original_file: string;
}

export interface VerifyResponse {
  status: "resolved" | "still_detected" | "verification_failed";
  checked_rule: string;
  remaining_count: number;
  message: string;
}

export async function getDiff(findingId: string): Promise<DiffResponse> {
  const res = await fetch(`${BASE}/findings/${findingId}/diff`);
  if (!res.ok) throw new Error(`Diff failed: ${res.statusText}`);
  return res.json();
}

export async function verifyPatch(findingId: string): Promise<VerifyResponse> {
  const res = await fetch(`${BASE}/findings/${findingId}/verify`, { method: "POST" });
  if (!res.ok) throw new Error(`Verify failed: ${res.statusText}`);
  return res.json();
}

export function reportUrl(scanId: string, format: "json" | "markdown"): string {
  return `${BASE}/scan/${scanId}/report/${format}`;
}

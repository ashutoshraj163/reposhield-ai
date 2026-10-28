import { useState } from "react";
import {
  Loader2, GitCompare, ShieldCheck,
  AlertTriangle, CheckCircle2, XCircle, RefreshCw,
} from "lucide-react";
import { getDiff, verifyPatch } from "../lib/api";
import type { DiffResponse, VerifyResponse } from "../lib/api";

interface Props {
  findingId: string;
  hasPatch: boolean;
}

type WorkflowStep = "idle" | "loading_diff" | "diff_ready" | "verifying" | "done";

function DiffLine({ line }: { line: string }) {
  if (line.startsWith("+++") || line.startsWith("---")) {
    return <span className="text-slate-500">{line}</span>;
  }
  if (line.startsWith("@@")) {
    return <span className="text-cyan-500">{line}</span>;
  }
  if (line.startsWith("+")) {
    return <span className="text-green-400 bg-green-950/40 block">{line}</span>;
  }
  if (line.startsWith("-")) {
    return <span className="text-red-400 bg-red-950/40 block line-through decoration-red-600/40">{line}</span>;
  }
  return <span className="text-slate-400">{line}</span>;
}

const STATUS_UI = {
  resolved: {
    icon: <CheckCircle2 size={16} className="text-green-400" />,
    color: "border-green-700 bg-green-950/40",
    label: "Resolved",
  },
  still_detected: {
    icon: <XCircle size={16} className="text-red-400" />,
    color: "border-red-700 bg-red-950/40",
    label: "Still detected",
  },
  verification_failed: {
    icon: <AlertTriangle size={16} className="text-yellow-400" />,
    color: "border-yellow-700 bg-yellow-950/40",
    label: "Verification failed",
  },
};

export function PatchWorkflow({ findingId, hasPatch }: Props) {
  const [step, setStep] = useState<WorkflowStep>("idle");
  const [diff, setDiff] = useState<DiffResponse | null>(null);
  const [verify, setVerify] = useState<VerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleLoadDiff() {
    setStep("loading_diff");
    setError(null);
    try {
      const d = await getDiff(findingId);
      setDiff(d);
      setStep("diff_ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Diff failed");
      setStep("idle");
    }
  }

  async function handleVerify() {
    setStep("verifying");
    setError(null);
    try {
      const v = await verifyPatch(findingId);
      setVerify(v);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verify failed");
      setStep("diff_ready");
    }
  }

  function handleReset() {
    setStep("idle");
    setDiff(null);
    setVerify(null);
    setError(null);
  }

  if (!hasPatch) return null;

  return (
    <div className="space-y-3 border-t border-slate-700 pt-4">
      <h3 className="text-slate-300 text-sm font-semibold flex items-center gap-2">
        <GitCompare size={14} className="text-indigo-400" />
        Patch &amp; Verify
      </h3>

      {/* Step 1: idle → show diff */}
      {step === "idle" && (
        <button
          onClick={handleLoadDiff}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <GitCompare size={14} /> Preview diff
        </button>
      )}

      {step === "loading_diff" && (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Loader2 size={14} className="animate-spin" /> Loading diff…
        </div>
      )}

      {/* Step 2: diff ready */}
      {(step === "diff_ready" || step === "verifying" || step === "done") && diff && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-mono">{diff.original_file}</span>
            <button onClick={handleReset} className="text-slate-600 hover:text-slate-400 text-xs flex items-center gap-1">
              <RefreshCw size={11} /> reset
            </button>
          </div>

          {/* Diff viewer */}
          <pre className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto leading-5">
            {diff.diff
              ? diff.diff.split("\n").map((line, i) => (
                  <DiffLine key={i} line={line} />
                ))
              : <span className="text-slate-500">No changes (patch may already be applied)</span>
            }
          </pre>

          {/* Step 3: verify */}
          {step === "diff_ready" && (
            <button
              onClick={handleVerify}
              className="flex items-center gap-2 bg-indigo-700 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <ShieldCheck size={14} /> Apply patch &amp; verify
            </button>
          )}

          {step === "verifying" && (
            <div className="flex items-center gap-2 text-indigo-400 text-sm">
              <Loader2 size={14} className="animate-spin" /> Re-running scanner…
            </div>
          )}
        </div>
      )}

      {/* Step 4: verification result */}
      {step === "done" && verify && (() => {
        const ui = STATUS_UI[verify.status];
        return (
          <div className={`border rounded-lg p-3 space-y-1 ${ui.color}`}>
            <div className="flex items-center gap-2 font-medium text-sm text-slate-200">
              {ui.icon} {ui.label}
            </div>
            <p className="text-slate-300 text-sm">{verify.message}</p>
            <p className="text-slate-500 text-xs font-mono">
              rule: {verify.checked_rule}
              {verify.remaining_count > 0 && ` · ${verify.remaining_count} finding(s) remain`}
            </p>
          </div>
        );
      })()}

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950 border border-red-800 rounded-lg p-3">
          <AlertTriangle size={14} /> {error}
        </div>
      )}
    </div>
  );
}

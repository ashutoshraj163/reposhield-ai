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
    return <div className="text-slate-500 font-mono py-0.5">{line}</div>;
  }
  if (line.startsWith("@@")) {
    return <div className="text-cyan-400 bg-cyan-950/30 font-mono px-2 py-0.5 rounded my-0.5">{line}</div>;
  }
  if (line.startsWith("+")) {
    return (
      <div className="text-emerald-300 bg-emerald-950/50 border-l-2 border-emerald-500 font-mono px-2 py-0.5">
        {line}
      </div>
    );
  }
  if (line.startsWith("-")) {
    return (
      <div className="text-rose-400 bg-rose-950/50 border-l-2 border-rose-500 font-mono px-2 py-0.5 line-through opacity-80">
        {line}
      </div>
    );
  }
  return <div className="text-slate-400 font-mono px-2 py-0.5">{line}</div>;
}

const STATUS_UI = {
  resolved: {
    icon: <CheckCircle2 size={18} className="text-emerald-400" />,
    color: "border-emerald-600/60 bg-emerald-950/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]",
    label: "Finding Verified & Resolved!",
    sub: "Re-scan confirmed that the original scanner rule no longer triggers.",
  },
  still_detected: {
    icon: <XCircle size={18} className="text-rose-400" />,
    color: "border-rose-600/60 bg-rose-950/50 shadow-[0_0_20px_rgba(244,63,94,0.2)]",
    label: "Finding Still Detected",
    sub: "The proposed patch did not fully eliminate the vulnerability.",
  },
  verification_failed: {
    icon: <AlertTriangle size={18} className="text-amber-400" />,
    color: "border-amber-600/60 bg-amber-950/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]",
    label: "Verification Failed",
    sub: "Scanner error or patch application could not be safely verified.",
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
    <div className="space-y-4 rounded-xl bg-slate-900/90 border border-slate-800 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <h4 className="text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2">
          <GitCompare size={15} className="text-cyan-400" />
          <span>Closed-Loop Verification Pipeline</span>
        </h4>
        <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-800/80 px-2 py-0.5 rounded">
          Patch & Verify
        </span>
      </div>

      {/* Step 1: idle → show diff */}
      {step === "idle" && (
        <button
          onClick={handleLoadDiff}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs font-semibold border border-slate-700 hover:border-cyan-500/50 transition-all shadow-md"
        >
          <GitCompare size={14} /> Generate &amp; Preview Git Diff
        </button>
      )}

      {step === "loading_diff" && (
        <div className="flex items-center justify-center gap-2 py-3 text-cyan-400 text-xs font-mono">
          <Loader2 size={16} className="animate-spin" /> Computing normalized diff against workspace clone…
        </div>
      )}

      {/* Step 2: diff ready */}
      {(step === "diff_ready" || step === "verifying" || step === "done") && diff && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 truncate max-w-xs">{diff.original_file}</span>
            <button
              onClick={handleReset}
              className="text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
            >
              <RefreshCw size={11} /> Reset
            </button>
          </div>

          {/* Holographic Diff viewer */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto shadow-inner">
            {diff.diff ? (
              diff.diff.split("\n").map((line, i) => <DiffLine key={i} line={line} />)
            ) : (
              <span className="text-slate-500">No diff generated or patch already applied.</span>
            )}
          </div>

          {/* Step 3: verify */}
          {step === "diff_ready" && (
            <button
              onClick={handleVerify}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              <ShieldCheck size={16} /> Apply Patch to Temporary Copy &amp; Re-run Check
            </button>
          )}

          {step === "verifying" && (
            <div className="flex items-center justify-center gap-2 py-3 text-emerald-400 text-xs font-mono bg-emerald-950/30 border border-emerald-900/50 rounded-xl">
              <Loader2 size={16} className="animate-spin" /> Applying patch &amp; re-executing scanner checks…
            </div>
          )}
        </div>
      )}

      {/* Step 4: verification result */}
      {step === "done" && verify && (() => {
        const ui = STATUS_UI[verify.status] || STATUS_UI.verification_failed;
        return (
          <div className={`border rounded-xl p-4 space-y-2 ${ui.color}`}>
            <div className="flex items-center gap-2 font-mono font-bold text-sm text-white">
              {ui.icon} {ui.label}
            </div>
            <p className="text-slate-200 text-xs sm:text-sm">{verify.message}</p>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
              <span>Verified Rule: {verify.checked_rule}</span>
              {verify.remaining_count > 0 ? (
                <span className="text-amber-400">{verify.remaining_count} other finding(s) remain</span>
              ) : (
                <span className="text-emerald-400">All checks passed</span>
              )}
            </div>
          </div>
        );
      })()}

      {error && (
        <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-950/60 border border-rose-800 rounded-xl p-3">
          <AlertTriangle size={15} /> {error}
        </div>
      )}
    </div>
  );
}

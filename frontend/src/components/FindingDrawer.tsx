import { useState } from "react";
import { X, Zap, Wrench, AlertTriangle, CheckCircle2, Loader2, Sparkles, Languages } from "lucide-react";
import type { Finding, AIExplanation } from "../lib/api";
import { explainFinding, generatePatch } from "../lib/api";
import { SeverityBadge } from "./SeverityBadge";
import { PatchWorkflow } from "./PatchWorkflow";

interface Props {
  finding: Finding;
  onClose: () => void;
}

export function FindingDrawer({ finding, onClose }: Props) {
  const [explanation, setExplanation] = useState<AIExplanation | null>(null);
  const [loading, setLoading] = useState(false);
  const [patchLoading, setPatchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHinglish, setShowHinglish] = useState(false);

  async function handleExplain() {
    setLoading(true);
    setError(null);
    try {
      const exp = await explainFinding(finding.id);
      setExplanation(exp);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Explain failed");
    } finally {
      setLoading(false);
    }
  }

  async function handlePatch() {
    setPatchLoading(true);
    setError(null);
    try {
      const exp = await generatePatch(finding.id);
      setExplanation(exp);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Patch generation failed");
    } finally {
      setPatchLoading(false);
    }
  }

  const confidenceColor = {
    high: "text-emerald-400 bg-emerald-950/60 border-emerald-700/60",
    medium: "text-amber-400 bg-amber-950/60 border-amber-700/60",
    low: "text-rose-400 bg-rose-950/60 border-rose-700/60",
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Blurred Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* 3D Glassmorphic Drawer */}
      <div className="relative w-full max-w-2xl bg-slate-900/95 border-l border-slate-700/80 overflow-y-auto shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col backdrop-blur-xl z-10">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-5 flex items-start justify-between gap-3 z-20">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <SeverityBadge severity={finding.severity} />
              <span className="text-slate-300 text-xs font-mono bg-slate-800/80 border border-slate-700 px-2 py-0.5 rounded-md">
                Scanner: {finding.source}
              </span>
              <span className="text-slate-400 text-xs font-mono bg-slate-800/80 border border-slate-700 px-2 py-0.5 rounded-md">
                Status: {finding.status}
              </span>
            </div>
            <p className="text-white font-mono text-sm sm:text-base font-bold break-all">
              {finding.rule_id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800/80 p-2 rounded-xl border border-transparent hover:border-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 space-y-6">
          {/* File location */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-xs space-y-1">
            <span className="text-slate-500 uppercase tracking-wider text-[10px]">Location</span>
            <div className="text-cyan-300 font-semibold text-sm flex items-center gap-1.5">
              <span>{finding.file}</span>
              {finding.line > 0 && <span className="text-amber-400">:{finding.line}</span>}
            </div>
          </div>

          {/* Code excerpt / Evidence */}
          <div className="space-y-1.5">
            <label className="text-slate-400 text-xs font-mono uppercase tracking-wider flex items-center justify-between">
              <span>Security Evidence Excerpt</span>
              <span className="text-[10px] text-slate-500">Read-only code snippet</span>
            </label>
            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap break-all shadow-inner">
              {finding.code_excerpt || "(no code excerpt provided by scanner)"}
            </pre>
          </div>

          {/* Scanner message */}
          <div className="space-y-1">
            <label className="text-slate-400 text-xs font-mono uppercase tracking-wider">Detection Details</label>
            <p className="text-slate-300 text-sm leading-relaxed bg-slate-850/50 border border-slate-800 p-3.5 rounded-xl">
              {finding.message}
            </p>
          </div>

          {/* AI Trigger Button */}
          {!explanation && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/50 to-purple-950/50 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5 font-mono">
                  <Sparkles size={15} className="text-cyan-400" />
                  BharatCode Qwen 3.8-27B Assistant
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Analyze flaw root cause, generate verified patch & remediation steps.
                </p>
              </div>

              <button
                onClick={handleExplain}
                disabled={loading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-lg disabled:opacity-50 shrink-0"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Analyzing Finding…
                  </>
                ) : (
                  <>
                    <Zap size={14} className="fill-current" />
                    Explain with AI
                  </>
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2.5 text-rose-300 text-sm bg-rose-950/60 border border-rose-800 rounded-xl p-4">
              <AlertTriangle size={18} className="shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* AI Explanation Result Card */}
          {explanation && (
            <div className="space-y-5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 p-5 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-cyan-400 fill-cyan-400" />
                  <h3 className="text-white font-bold text-sm font-mono tracking-wide">
                    BharatCode AI Analysis
                  </h3>
                  {explanation.fallback && (
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded">
                      Fallback Mode
                    </span>
                  )}
                </div>
                <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${confidenceColor[explanation.confidence] || confidenceColor.medium}`}>
                  Confidence: {explanation.confidence}
                </span>
              </div>

              {/* Summary */}
              <div className="space-y-1">
                <label className="text-slate-400 text-xs font-mono uppercase tracking-wider">Root Cause Summary</label>
                <p className="text-slate-200 text-sm leading-relaxed">{explanation.summary}</p>
              </div>

              {/* Impact */}
              <div className="space-y-1">
                <label className="text-slate-400 text-xs font-mono uppercase tracking-wider">Security Impact</label>
                <p className="text-rose-300/90 text-sm leading-relaxed bg-rose-950/20 border border-rose-900/40 p-3 rounded-lg">
                  {explanation.impact}
                </p>
              </div>

              {/* Remediation */}
              <div className="space-y-1">
                <label className="text-slate-400 text-xs font-mono uppercase tracking-wider">Recommended Remediation</label>
                <p className="text-slate-200 text-sm leading-relaxed bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  {explanation.remediation}
                </p>
              </div>

              {/* Beginner Tip */}
              {explanation.beginner_tip && (
                <div className="bg-indigo-950/40 border border-indigo-700/50 rounded-xl p-3.5 space-y-1">
                  <label className="text-indigo-300 text-xs font-mono uppercase tracking-wider font-semibold">
                    💡 Beginner-Friendly Tip
                  </label>
                  <p className="text-indigo-200 text-sm leading-relaxed">{explanation.beginner_tip}</p>
                </div>
              )}

              {/* Hinglish Toggle */}
              {explanation.hinglish_summary && (
                <div className="pt-2">
                  <button
                    onClick={() => setShowHinglish(!showHinglish)}
                    className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 border border-cyan-700/40 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Languages size={14} />
                    <span>{showHinglish ? "Hide" : "Show"} Hinglish Explanation</span>
                  </button>
                  {showHinglish && (
                    <div className="mt-2.5 p-3.5 bg-slate-900/90 border border-cyan-800/50 rounded-xl text-slate-200 text-sm italic font-sans leading-relaxed">
                      "{explanation.hinglish_summary}"
                    </div>
                  )}
                </div>
              )}

              {/* Patch generation section */}
              {explanation.patch ? (
                <div className="space-y-1.5 pt-2">
                  <label className="text-slate-400 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <CheckCircle2 size={14} />
                    <span>Suggested Patch Code</span>
                  </label>
                  <pre className="bg-slate-950 border border-emerald-800/60 rounded-xl p-4 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap break-all shadow-inner">
                    {explanation.patch}
                  </pre>
                </div>
              ) : (
                <div className="pt-2">
                  <button
                    onClick={handlePatch}
                    disabled={patchLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-950 disabled:text-emerald-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-lg"
                  >
                    {patchLoading ? <Loader2 size={14} className="animate-spin" /> : <Wrench size={14} />}
                    {patchLoading ? "Generating Patch…" : "Generate Remediation Patch"}
                  </button>
                </div>
              )}

              {/* Verification Steps list */}
              {explanation.verification_steps.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <label className="text-slate-400 text-xs font-mono uppercase tracking-wider">
                    Scanner Verification Checklist
                  </label>
                  <ol className="space-y-1.5 bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
                    {explanation.verification_steps.map((step, i) => (
                      <li key={i} className="text-slate-300 text-xs sm:text-sm flex items-start gap-2">
                        <span className="text-cyan-400 font-mono font-bold mt-0.5">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-800/80">
                <span>Model: {explanation.ai_model}</span>
                <span>BharatCode Build League 2026</span>
              </div>

              {/* 3D Patch & Re-Scanner Verification Pipeline */}
              <div className="pt-4 border-t border-slate-800">
                <PatchWorkflow
                  findingId={finding.id}
                  hasPatch={!!explanation.patch}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

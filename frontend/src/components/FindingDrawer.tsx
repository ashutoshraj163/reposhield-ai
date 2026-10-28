import { useState } from "react";
import { X, Zap, Wrench, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
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
    high: "text-green-400",
    medium: "text-yellow-400",
    low: "text-red-400",
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-2xl bg-slate-900 border-l border-slate-700 overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-start justify-between gap-3 z-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <SeverityBadge severity={finding.severity} />
              <span className="text-slate-400 text-xs font-mono bg-slate-800 px-2 py-0.5 rounded">
                {finding.source}
              </span>
            </div>
            <p className="text-slate-200 text-sm font-mono break-all">{finding.rule_id}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 p-4 space-y-5">
          {/* Location */}
          <div>
            <label className="text-slate-500 text-xs uppercase tracking-wider">Location</label>
            <p className="text-slate-200 font-mono text-sm mt-1">
              {finding.file}
              <span className="text-slate-500">:</span>
              <span className="text-yellow-400">{finding.line}</span>
            </p>
          </div>

          {/* Code excerpt */}
          <div>
            <label className="text-slate-500 text-xs uppercase tracking-wider">Evidence</label>
            <pre className="mt-1 bg-slate-950 border border-slate-700 rounded p-3 text-sm text-green-300 font-mono overflow-x-auto whitespace-pre-wrap break-all">
              {finding.code_excerpt || "(no excerpt)"}
            </pre>
          </div>

          {/* Scanner message */}
          <div>
            <label className="text-slate-500 text-xs uppercase tracking-wider">Scanner message</label>
            <p className="text-slate-300 text-sm mt-1 leading-relaxed">{finding.message}</p>
          </div>

          {/* Explain button */}
          {!explanation && (
            <button
              onClick={handleExplain}
              disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:text-indigo-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
              {loading ? "Asking BharatCode AI…" : "Explain with AI"}
            </button>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950 border border-red-800 rounded p-3">
              <AlertTriangle size={15} /> {error}
            </div>
          )}

          {/* AI Explanation */}
          {explanation && (
            <div className="space-y-4 border-t border-slate-700 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-slate-200 font-semibold text-sm flex items-center gap-2">
                  <Zap size={14} className="text-indigo-400" />
                  AI Explanation
                  {explanation.fallback && (
                    <span className="text-xs text-yellow-500 font-normal">(fallback — no API key)</span>
                  )}
                </h3>
                <span className={`text-xs font-mono ${confidenceColor[explanation.confidence]}`}>
                  confidence: {explanation.confidence}
                </span>
              </div>

              <div>
                <label className="text-slate-500 text-xs uppercase tracking-wider">Summary</label>
                <p className="text-slate-200 text-sm mt-1 leading-relaxed">{explanation.summary}</p>
              </div>

              <div>
                <label className="text-slate-500 text-xs uppercase tracking-wider">Impact</label>
                <p className="text-slate-300 text-sm mt-1 leading-relaxed">{explanation.impact}</p>
              </div>

              <div>
                <label className="text-slate-500 text-xs uppercase tracking-wider">Remediation</label>
                <p className="text-slate-300 text-sm mt-1 leading-relaxed">{explanation.remediation}</p>
              </div>

              {explanation.beginner_tip && (
                <div className="bg-blue-950 border border-blue-800 rounded p-3">
                  <label className="text-blue-400 text-xs uppercase tracking-wider">Beginner tip</label>
                  <p className="text-blue-200 text-sm mt-1">{explanation.beginner_tip}</p>
                </div>
              )}

              {explanation.hinglish_summary && (
                <div>
                  <button
                    onClick={() => setShowHinglish(!showHinglish)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                  >
                    {showHinglish ? "Hide" : "Show"} Hinglish summary
                  </button>
                  {showHinglish && (
                    <p className="text-slate-300 text-sm mt-2 italic">{explanation.hinglish_summary}</p>
                  )}
                </div>
              )}

              {explanation.patch ? (
                <div>
                  <label className="text-slate-500 text-xs uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-green-400" /> Suggested patch
                  </label>
                  <pre className="mt-1 bg-slate-950 border border-green-800 rounded p-3 text-sm text-green-300 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                    {explanation.patch}
                  </pre>
                </div>
              ) : (
                <button
                  onClick={handlePatch}
                  disabled={patchLoading}
                  className="flex items-center gap-2 bg-green-800 hover:bg-green-700 disabled:bg-green-950 disabled:text-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {patchLoading ? <Loader2 size={15} className="animate-spin" /> : <Wrench size={15} />}
                  {patchLoading ? "Generating patch…" : "Generate patch"}
                </button>
              )}

              {explanation.verification_steps.length > 0 && (
                <div>
                  <label className="text-slate-500 text-xs uppercase tracking-wider">Verification steps</label>
                  <ol className="mt-1 space-y-1">
                    {explanation.verification_steps.map((step, i) => (
                      <li key={i} className="text-slate-300 text-sm flex gap-2">
                        <span className="text-slate-500 font-mono">{i + 1}.</span> {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <p className="text-slate-600 text-xs font-mono">model: {explanation.ai_model}</p>

              {/* Patch workflow — diff preview + scanner verification */}
              <PatchWorkflow
                findingId={finding.id}
                hasPatch={!!explanation.patch}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

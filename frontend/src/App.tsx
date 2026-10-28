import { useState } from "react";
import { Shield, ArrowLeft, FileJson, FileText, Filter, ShieldAlert } from "lucide-react";
import type { ScanResult } from "./lib/api";
import { reportUrl } from "./lib/api";
import { UploadZone } from "./components/UploadZone";
import { SummaryBar } from "./components/SummaryBar";
import { FindingsTable } from "./components/FindingsTable";
import { CyberShield3D } from "./components/CyberShield3D";

const FILTER_OPTIONS = [
  { value: "", label: "All Findings" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "semgrep", label: "Semgrep SAST" },
  { value: "gitleaks", label: "Gitleaks Secrets" },
  { value: "osv", label: "OSV Dependencies" },
];

export default function App() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [filter, setFilter] = useState("");

  function reset() {
    setResult(null);
    setFilter("");
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-[#030712] text-slate-100 selection:bg-cyan-500 selection:text-black">
        <UploadZone onResult={setResult} />
      </div>
    );
  }

  const criticalAndHigh = (result.summary?.critical || 0) + (result.summary?.high || 0);

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 selection:bg-cyan-500 selection:text-black overflow-x-hidden">
      {/* 3D Cyber Perspective Background */}
      <div className="cyber-grid-3d" />

      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Top 3D Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-mono font-medium transition-all shadow-sm"
            >
              <ArrowLeft size={14} className="text-cyan-400" />
              <span>New Scan</span>
            </button>
            <span className="text-slate-700 font-mono">/</span>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                <Shield size={16} />
              </div>
              <span className="text-white font-mono font-bold text-sm tracking-wide">
                RepoShield AI
              </span>
              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                Scan ID: {result.scan_id}
              </span>
            </div>
          </div>

          {/* Export & Action Buttons */}
          <div className="flex items-center gap-2.5">
            <span className="text-slate-500 text-xs font-mono hidden md:inline">Export Audit:</span>
            <a
              href={reportUrl(result.scan_id, "json")}
              download
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-mono transition-all shadow-sm"
            >
              <FileJson size={13} className="text-cyan-400" />
              <span>JSON</span>
            </a>
            <a
              href={reportUrl(result.scan_id, "markdown")}
              download
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/50 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-mono transition-all shadow-sm"
            >
              <FileText size={13} className="text-purple-400" />
              <span>Markdown</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Top Summary Banner with 3D Shield status orb */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-9 glass-panel rounded-3xl p-6 sm:p-7 border border-slate-700/60 shadow-2xl">
            <SummaryBar summary={result.summary} target={result.target} />
          </div>

          <div className="lg:col-span-3 glass-panel rounded-3xl p-4 border border-slate-700/60 shadow-2xl flex flex-col items-center justify-center relative min-h-[160px] h-full overflow-hidden">
            <div className="w-full h-32 relative">
              <CyberShield3D
                state={criticalAndHigh > 0 ? "threat" : "clean"}
                threatCount={criticalAndHigh}
              />
            </div>
            <div className="text-[11px] font-mono text-center mt-1">
              {criticalAndHigh > 0 ? (
                <span className="text-rose-400 font-bold">Threat Matrix Active</span>
              ) : (
                <span className="text-emerald-400 font-bold">All Scans Clean</span>
              )}
            </div>
          </div>
        </div>

        {/* Scanner warning / note */}
        {result.error && (
          <div className="flex items-center gap-2.5 text-amber-300 text-xs sm:text-sm bg-amber-950/40 border border-amber-800/80 rounded-2xl p-4 backdrop-blur-md">
            <ShieldAlert size={18} className="shrink-0 text-amber-400" />
            <span className="font-mono">Scanner Diagnostic: {result.error}</span>
          </div>
        )}

        {/* 3D Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-2">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 mr-1">
            <Filter size={13} className="text-cyan-400" />
            <span>Filter:</span>
          </div>
          {FILTER_OPTIONS.map(({ value, label }) => {
            const isActive = filter === value;
            return (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all duration-200 border ${
                  isActive
                    ? "bg-cyan-500 text-black border-cyan-400 font-bold shadow-[0_0_15px_rgba(6,182,212,0.5)] scale-105"
                    : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Findings Table */}
        <FindingsTable findings={result.findings} filter={filter} />
      </main>
    </div>
  );
}

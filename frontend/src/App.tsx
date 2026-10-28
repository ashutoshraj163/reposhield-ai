import { useState } from "react";
import { Shield, ArrowLeft, Download, FileJson, FileText, Filter } from "lucide-react";
import type { ScanResult } from "./lib/api";
import { reportUrl } from "./lib/api";
import { UploadZone } from "./components/UploadZone";
import { SummaryBar } from "./components/SummaryBar";
import { FindingsTable } from "./components/FindingsTable";

const FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "semgrep", label: "Semgrep" },
  { value: "gitleaks", label: "Gitleaks" },
  { value: "osv", label: "OSV" },
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
      <div className="min-h-screen bg-slate-950 text-white">
        <UploadZone onResult={setResult} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top nav */}
      <header className="border-b border-slate-800 bg-slate-900 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
            >
              <ArrowLeft size={15} /> New scan
            </button>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5">
              <Shield size={16} className="text-indigo-400" />
              <span className="text-white font-semibold text-sm">RepoShield AI</span>
            </div>
          </div>

          {/* Export */}
          <div className="flex items-center gap-2">
            <span className="text-slate-600 text-xs hidden sm:inline">Export:</span>
            <a
              href={reportUrl(result.scan_id, "json")}
              download
              className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded text-xs transition-colors"
            >
              <FileJson size={13} /> JSON
            </a>
            <a
              href={reportUrl(result.scan_id, "markdown")}
              download
              className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded text-xs transition-colors"
            >
              <FileText size={13} /> Markdown
            </a>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Summary */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <SummaryBar summary={result.summary} target={result.target} />
        </div>

        {result.error && (
          <div className="text-yellow-400 text-sm bg-yellow-950 border border-yellow-800 rounded-lg px-4 py-2.5">
            Scanner note: {result.error}
          </div>
        )}

        {/* Filter bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <Filter size={14} className="text-slate-500" />
          {FILTER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === value
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Findings table */}
        <FindingsTable findings={result.findings} filter={filter} />
      </main>
    </div>
  );
}

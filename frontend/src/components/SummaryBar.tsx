import type { ScanSummary } from "../lib/api";

const tiles = [
  { key: "critical", label: "Critical", bg: "bg-red-950",    border: "border-red-700",    text: "text-red-300" },
  { key: "high",     label: "High",     bg: "bg-orange-950", border: "border-orange-700", text: "text-orange-300" },
  { key: "medium",   label: "Medium",   bg: "bg-yellow-950", border: "border-yellow-700", text: "text-yellow-300" },
  { key: "low",      label: "Low",      bg: "bg-blue-950",   border: "border-blue-700",   text: "text-blue-300" },
  { key: "info",     label: "Info",     bg: "bg-slate-800",  border: "border-slate-600",  text: "text-slate-300" },
] as const;

export function SummaryBar({ summary, target }: { summary: ScanSummary; target: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-slate-400 text-sm font-mono truncate">{target}</span>
        <span className="text-slate-500 text-sm">·</span>
        <span className="text-slate-300 text-sm font-semibold">{summary.total} findings</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {tiles.map(({ key, label, bg, border, text }) => (
          <div key={key} className={`${bg} ${border} border rounded-lg p-3 text-center`}>
            <div className={`text-2xl font-bold font-mono ${text}`}>
              {summary[key]}
            </div>
            <div className="text-slate-400 text-xs mt-1">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

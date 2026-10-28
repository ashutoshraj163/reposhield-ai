import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { Finding } from "../lib/api";
import { SeverityBadge } from "./SeverityBadge";
import { FindingDrawer } from "./FindingDrawer";

const SOURCE_COLORS: Record<string, string> = {
  semgrep:  "text-purple-400",
  gitleaks: "text-pink-400",
  osv:      "text-cyan-400",
};

interface Props {
  findings: Finding[];
  filter: string;
}

export function FindingsTable({ findings, filter }: Props) {
  const [selected, setSelected] = useState<Finding | null>(null);

  const filtered = findings.filter((f) => {
    if (!filter) return true;
    if (filter === "critical" || filter === "high" || filter === "medium" || filter === "low" || filter === "info") {
      return f.severity === filter;
    }
    if (filter === "semgrep" || filter === "gitleaks" || filter === "osv") {
      return f.source === filter;
    }
    return true;
  });

  if (filtered.length === 0) {
    return (
      <div className="text-center text-slate-500 py-12 text-sm">
        No findings match the current filter.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-2 w-24">Severity</th>
              <th className="text-left px-4 py-2">Rule</th>
              <th className="text-left px-4 py-2 hidden sm:table-cell">File</th>
              <th className="text-left px-4 py-2 w-20 hidden md:table-cell">Source</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((f, i) => (
              <tr
                key={f.id}
                onClick={() => setSelected(f)}
                className={`cursor-pointer border-t border-slate-800 hover:bg-slate-800/60 transition-colors ${
                  i % 2 === 0 ? "bg-slate-900" : "bg-slate-900/60"
                }`}
              >
                <td className="px-4 py-2.5">
                  <SeverityBadge severity={f.severity} />
                </td>
                <td className="px-4 py-2.5 font-mono text-slate-300 text-xs max-w-xs truncate">
                  {f.rule_id.split(".").pop()}
                </td>
                <td className="px-4 py-2.5 text-slate-400 font-mono text-xs hidden sm:table-cell truncate max-w-xs">
                  {f.file}:{f.line}
                </td>
                <td className={`px-4 py-2.5 font-mono text-xs hidden md:table-cell ${SOURCE_COLORS[f.source] ?? "text-slate-400"}`}>
                  {f.source}
                </td>
                <td className="px-3 py-2.5 text-slate-600">
                  <ChevronRight size={14} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <FindingDrawer finding={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

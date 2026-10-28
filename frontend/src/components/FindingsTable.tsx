import { useState } from "react";
import { ChevronRight, FileCode, ShieldAlert, Cpu, KeyRound, Package } from "lucide-react";
import type { Finding } from "../lib/api";
import { SeverityBadge } from "./SeverityBadge";
import { FindingDrawer } from "./FindingDrawer";

const SOURCE_CONFIG: Record<string, { label: string; color: string; icon: typeof Cpu; border: string }> = {
  semgrep: {
    label: "Semgrep",
    color: "text-purple-300 bg-purple-950/60",
    border: "border-purple-700/50",
    icon: Cpu,
  },
  gitleaks: {
    label: "Gitleaks",
    color: "text-pink-300 bg-pink-950/60",
    border: "border-pink-700/50",
    icon: KeyRound,
  },
  osv: {
    label: "OSV",
    color: "text-cyan-300 bg-cyan-950/60",
    border: "border-cyan-700/50",
    icon: Package,
  },
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
      <div className="glass-panel rounded-2xl border border-slate-800 p-12 text-center text-slate-400 space-y-2">
        <ShieldAlert size={32} className="mx-auto text-slate-600 mb-3" />
        <p className="font-mono text-sm font-medium">No security findings matching current filter.</p>
        <p className="text-xs text-slate-500">Switch filter to view other categories.</p>
      </div>
    );
  }

  return (
    <>
      <div className="glass-panel rounded-2xl border border-slate-700/60 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
                <th className="px-5 py-3 w-28">Severity</th>
                <th className="px-5 py-3">Rule / Finding</th>
                <th className="px-5 py-3 hidden sm:table-cell">Location</th>
                <th className="px-5 py-3 w-32 hidden md:table-cell">Source Scanner</th>
                <th className="px-5 py-3 w-16 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans text-sm">
              {filtered.map((f) => {
                const src = SOURCE_CONFIG[f.source] || {
                  label: f.source,
                  color: "text-slate-300 bg-slate-800",
                  border: "border-slate-700",
                  icon: Cpu,
                };
                const IconComponent = src.icon;

                return (
                  <tr
                    key={f.id}
                    onClick={() => setSelected(f)}
                    className="group cursor-pointer hover:bg-slate-800/50 transition-all duration-200 relative"
                  >
                    {/* Severity */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <SeverityBadge severity={f.severity} />
                    </td>

                    {/* Rule / Finding description */}
                    <td className="px-5 py-3.5">
                      <div className="space-y-1">
                        <div className="font-mono font-semibold text-xs sm:text-sm text-slate-200 group-hover:text-cyan-300 transition-colors">
                          {f.rule_id}
                        </div>
                        <div className="text-xs text-slate-400 line-clamp-1">
                          {f.message}
                        </div>
                      </div>
                    </td>

                    {/* Location: File and line */}
                    <td className="px-5 py-3.5 hidden sm:table-cell whitespace-nowrap font-mono text-xs text-slate-300">
                      <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 px-2 py-1 rounded-md w-fit">
                        <FileCode size={13} className="text-cyan-400" />
                        <span className="truncate max-w-[200px]">{f.file}</span>
                        {f.line > 0 && (
                          <span className="text-slate-500">:{f.line}</span>
                        )}
                      </div>
                    </td>

                    {/* Source Scanner */}
                    <td className="px-5 py-3.5 hidden md:table-cell whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono border ${src.color} ${src.border}`}>
                        <IconComponent size={12} />
                        {src.label}
                      </span>
                    </td>

                    {/* Action Arrow */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="w-8 h-8 rounded-lg bg-slate-800/40 group-hover:bg-cyan-500/20 border border-transparent group-hover:border-cyan-500/40 flex items-center justify-center text-slate-500 group-hover:text-cyan-300 transition-all ml-auto">
                        <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <FindingDrawer
          finding={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

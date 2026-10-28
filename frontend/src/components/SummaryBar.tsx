import type { ScanSummary } from "../lib/api";
import { ShieldAlert, ShieldCheck, Cpu, KeyRound, Package, Terminal } from "lucide-react";
import { TiltCard } from "./TiltCard";

const tiles = [
  { key: "critical", label: "Critical", border: "border-rose-500/30", text: "text-rose-400", glow: "rose" as const, bg: "from-rose-950/40 to-slate-900/60" },
  { key: "high",     label: "High",     border: "border-orange-500/30", text: "text-orange-400", glow: "amber" as const, bg: "from-orange-950/40 to-slate-900/60" },
  { key: "medium",   label: "Medium",   border: "border-amber-500/30",  text: "text-amber-400",  glow: "amber" as const, bg: "from-amber-950/40 to-slate-900/60" },
  { key: "low",      label: "Low",      border: "border-cyan-500/30",   text: "text-cyan-400",   glow: "cyan" as const, bg: "from-cyan-950/40 to-slate-900/60" },
  { key: "info",     label: "Info",     border: "border-slate-500/30",  text: "text-slate-400",  glow: "purple" as const, bg: "from-slate-800/40 to-slate-900/60" },
] as const;

export function SummaryBar({ summary, target }: { summary: ScanSummary; target: string }) {
  // Compute cyber defense health index (0 to 100)
  const penalty = summary.critical * 25 + summary.high * 10 + summary.medium * 4 + summary.low * 1;
  const healthScore = Math.max(0, 100 - penalty);
  const healthColor =
    healthScore > 80 ? "text-emerald-400 border-emerald-500/40" :
    healthScore > 50 ? "text-amber-400 border-amber-500/40" :
    "text-rose-400 border-rose-500/40";

  return (
    <div className="space-y-6">
      {/* Target & Defense Index Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Terminal size={18} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-mono tracking-wider uppercase">Scanned Target Workspace</div>
            <div className="text-slate-200 font-mono text-sm sm:text-base font-semibold truncate max-w-md">
              {target}
            </div>
          </div>
        </div>

        {/* Security Health Score 3D Badge */}
        <div className="flex items-center gap-4 self-start md:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 backdrop-blur-md">
            <div className="flex gap-1.5 items-center text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Pipeline:</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
              <span className="flex items-center gap-1 text-purple-300 bg-purple-950/50 px-2 py-0.5 rounded border border-purple-800/50"><Cpu size={11} /> Semgrep</span>
              <span className="flex items-center gap-1 text-pink-300 bg-pink-950/50 px-2 py-0.5 rounded border border-pink-800/50"><KeyRound size={11} /> Gitleaks</span>
              <span className="flex items-center gap-1 text-cyan-300 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/50"><Package size={11} /> OSV</span>
            </div>
          </div>

          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl bg-slate-900/90 border backdrop-blur-xl ${healthColor}`}>
            {healthScore > 70 ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
            <span className="text-xs font-mono font-medium">Security Score:</span>
            <span className="text-lg font-bold font-mono">{healthScore}%</span>
          </div>
        </div>
      </div>

      {/* 3D Severity Metric Cubes */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {tiles.map(({ key, label, border, text, glow, bg }) => (
          <TiltCard key={key} glowColor={glow} maxTilt={10}>
            <div className={`p-4 rounded-xl border bg-gradient-to-br ${bg} ${border} backdrop-blur-md shadow-lg flex flex-col justify-between h-24`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono tracking-wider uppercase text-slate-400">{label}</span>
                <span className={`w-2 h-2 rounded-full ${text.replace('text-', 'bg-')} opacity-75`} />
              </div>
              <div className={`text-3xl font-extrabold font-mono tracking-tight ${text}`}>
                {summary[key]}
              </div>
            </div>
          </TiltCard>
        ))}
      </div>
    </div>
  );
}

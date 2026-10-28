type Severity = "critical" | "high" | "medium" | "low" | "info";

const styles: Record<Severity, { bg: string; text: string; border: string; glow: string; dot: string }> = {
  critical: {
    bg: "bg-rose-950/60",
    text: "text-rose-200",
    border: "border-rose-500/50",
    glow: "shadow-[0_0_12px_rgba(244,63,94,0.35)]",
    dot: "bg-rose-500 animate-pulse",
  },
  high: {
    bg: "bg-orange-950/60",
    text: "text-orange-200",
    border: "border-orange-500/50",
    glow: "shadow-[0_0_12px_rgba(249,115,22,0.35)]",
    dot: "bg-orange-500",
  },
  medium: {
    bg: "bg-amber-950/60",
    text: "text-amber-200",
    border: "border-amber-500/50",
    glow: "shadow-[0_0_12px_rgba(245,158,11,0.35)]",
    dot: "bg-amber-400",
  },
  low: {
    bg: "bg-cyan-950/60",
    text: "text-cyan-200",
    border: "border-cyan-500/50",
    glow: "shadow-[0_0_12px_rgba(6,182,212,0.35)]",
    dot: "bg-cyan-400",
  },
  info: {
    bg: "bg-slate-800/60",
    text: "text-slate-300",
    border: "border-slate-600/50",
    glow: "shadow-[0_0_12px_rgba(148,163,184,0.2)]",
    dot: "bg-slate-400",
  },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const conf = styles[severity] || styles.info;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase border backdrop-blur-md transition-all duration-300 hover:scale-105 ${conf.bg} ${conf.text} ${conf.border} ${conf.glow}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
      {severity}
    </span>
  );
}

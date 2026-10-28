type Severity = "critical" | "high" | "medium" | "low" | "info";

const styles: Record<Severity, string> = {
  critical: "bg-red-900 text-red-200 border border-red-700",
  high:     "bg-orange-900 text-orange-200 border border-orange-700",
  medium:   "bg-yellow-900 text-yellow-200 border border-yellow-700",
  low:      "bg-blue-900 text-blue-200 border border-blue-700",
  info:     "bg-slate-700 text-slate-300 border border-slate-600",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold uppercase ${styles[severity]}`}>
      {severity}
    </span>
  );
}

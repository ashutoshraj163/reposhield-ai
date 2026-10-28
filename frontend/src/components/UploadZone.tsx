import { useRef, useState, useEffect } from "react";
import { Upload, Shield, Loader2, AlertCircle, Play, Sparkles, Terminal } from "lucide-react";
import { scanDemo, scanUpload, scanGithub } from "../lib/api";
import type { ScanResult } from "../lib/api";
import { CyberShield3D } from "./CyberShield3D";
import { TiltCard } from "./TiltCard";

function GithubIcon({ size = 15, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

const SCAN_STEPS = [
  "Initializing sandboxed workspace…",
  "Running Semgrep AST security rules…",
  "Analyzing entropy with Gitleaks…",
  "Cross-referencing OSV vulnerability database…",
  "Normalizing findings with BharatCode engine…",
];

interface Props {
  onResult: (result: ScanResult) => void;
}

export function UploadZone({ onResult }: Props) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [githubUrl, setGithubUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Cycle through scanning telemetry when loading
  useEffect(() => {
    if (!loading) {
      setCurrentStep(0);
      return;
    }
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % SCAN_STEPS.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [loading]);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    try {
      const result = await scanUpload(file);
      onResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGithub(e: React.FormEvent) {
    e.preventDefault();
    if (!githubUrl.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await scanGithub(githubUrl.trim());
      onResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "GitHub scan failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemo() {
    setLoading(true);
    setError(null);
    try {
      const result = await scanDemo();
      onResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Demo scan failed");
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* 3D Cyber Vanishing Perspective Floor Grid */}
      <div className="cyber-grid-3d" />

      {/* Volumetric ambient background glow orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header bar */}
      <header className="relative z-10 max-w-7xl mx-auto w-full flex items-center justify-between pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 glow-cyan">
            <Shield size={24} className="text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-wider text-white font-mono">RepoShield AI</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                v1.0 MVP
              </span>
            </div>
            <p className="text-xs text-slate-400">Autonomous Code Security Reviewer & Evidence Verifier</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            BharatCode Qwen 3.8-27B
          </div>
          <a
            href="https://github.com/ashutoshraj163/reposhield-ai"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 transition-colors"
          >
            <GithubIcon size={14} /> GitHub
          </a>
        </div>
      </header>

      {/* Main 3D Hero & Scanner Zone */}
      <main className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto">
        {/* Left Column: Interactive 3D Shield Hologram */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center text-center lg:text-left space-y-6">
          <div className="w-full max-w-[380px] h-[360px] sm:h-[400px] relative mx-auto">
            {/* 3D Canvas */}
            <CyberShield3D state={loading ? "scanning" : "idle"} />

            {/* Hologram Floating HUD Badges */}
            <div className="absolute top-4 left-0 px-3 py-1 rounded-lg bg-slate-900/80 border border-cyan-500/30 text-[11px] font-mono text-cyan-300 backdrop-blur-md shadow-lg pointer-events-none">
              SHIELD STATUS: {loading ? "ANALYZING..." : "ONLINE"}
            </div>
            <div className="absolute bottom-4 right-0 px-3 py-1 rounded-lg bg-slate-900/80 border border-purple-500/30 text-[11px] font-mono text-purple-300 backdrop-blur-md shadow-lg pointer-events-none">
              SCAN ENGINES: 3 ACTIVE
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400">
              Find the flaw. Understand the risk. Fix it with evidence.
            </h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto lg:mx-0">
              Multi-engine static security analysis powered by <strong className="text-slate-200">Semgrep</strong>, <strong className="text-slate-200">Gitleaks</strong>, and <strong className="text-slate-200">OSV</strong>, combined with verifiable AI patches.
            </p>
          </div>
        </div>

        {/* Right Column: 3D Control Center & Upload */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <TiltCard glowColor="cyan" maxTilt={5}>
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-700/60 shadow-2xl space-y-6 relative overflow-hidden">
              {/* Scanline pattern */}
              <div className="scanlines absolute inset-0 opacity-20" />

              {/* Instant Demo Scan Primary Action */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-indigo-950/40 to-slate-900/80 border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
                    <Sparkles size={20} className="animate-spin" style={{ animationDuration: "8s" }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-mono">Vulnerable Test Fixture</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60">
                        32 Vulnerabilities
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Test Gitleaks, Semgrep, and OSV scanner outputs instantly.</p>
                  </div>
                </div>

                <button
                  onClick={handleDemo}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 shrink-0 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Scanning…
                    </>
                  ) : (
                    <>
                      <Play size={14} className="fill-current" />
                      Run Demo Scan
                    </>
                  )}
                </button>
              </div>

              {/* Drag & Drop File Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => !loading && inputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 group
                  ${dragging ? "border-cyan-400 bg-cyan-950/40 shadow-[0_0_30px_rgba(6,182,212,0.25)]" : "border-slate-700/80 hover:border-cyan-500/50 bg-slate-900/40 hover:bg-slate-900/80"}
                  ${loading ? "pointer-events-none opacity-60" : ""}
                `}
              >
                {loading ? (
                  <div className="flex flex-col items-center gap-3 py-4 text-cyan-400">
                    <div className="relative">
                      <Loader2 size={44} className="animate-spin" />
                      <Shield size={20} className="absolute inset-0 m-auto text-cyan-200" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-mono text-sm font-semibold tracking-wide text-slate-200">{SCAN_STEPS[currentStep]}</p>
                      <p className="text-xs text-slate-500 font-mono">Running isolated subprocess scanners…</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-2">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/50 group-hover:scale-110 transition-all duration-300 shadow-lg">
                      <Upload size={26} />
                    </div>
                    <div>
                      <p className="text-slate-200 font-semibold text-base group-hover:text-cyan-300 transition-colors">
                        Drop repository ZIP or source file here
                      </p>
                      <p className="text-slate-400 text-xs mt-1">
                        Supports Python (.py), JavaScript (.js), TypeScript (.ts, .tsx), or full .zip archive
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                      <span>Click to browse</span>
                      <span>•</span>
                      <span>Max file size 50MB</span>
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={inputRef}
                type="file"
                accept=".py,.js,.ts,.tsx,.jsx,.zip"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />

              {/* GitHub URL Scan */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <Terminal size={13} className="text-cyan-400" />
                  <span>Or scan a public GitHub repository</span>
                </label>
                <form onSubmit={handleGithub} className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2.5 bg-slate-950/80 border border-slate-700/80 focus-within:border-cyan-500/60 rounded-xl px-3.5 transition-colors">
                    <GithubIcon size={16} className="text-slate-400 shrink-0" />
                    <input
                      type="url"
                      placeholder="https://github.com/owner/repository"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      disabled={loading}
                      className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 text-sm py-2.5 outline-none font-mono text-xs sm:text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !githubUrl.trim()}
                    className="bg-slate-800 hover:bg-cyan-600 disabled:bg-slate-900 disabled:text-slate-600 border border-slate-700 hover:border-cyan-500 text-white px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200"
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : "Clone & Scan"}
                  </button>
                </form>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2.5 text-rose-400 text-xs sm:text-sm bg-rose-950/50 border border-rose-800/80 rounded-xl px-4 py-3">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </TiltCard>
        </div>
      </main>

      {/* Footer telemetry bar */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-mono gap-3 border-t border-slate-800/60">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Engines Active: Semgrep v1.182 · Gitleaks v8.26 · OSV Vulnerability DB</span>
        </div>
        <div>
          BharatCode Build League 2026 Submission
        </div>
      </footer>
    </div>
  );
}

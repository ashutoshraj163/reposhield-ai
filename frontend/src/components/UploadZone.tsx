import { useRef, useState } from "react";
import { Upload, Shield, Loader2, AlertCircle } from "lucide-react";
import { scanDemo, scanUpload, scanGithub } from "../lib/api";
import type { ScanResult } from "../lib/api";

function GithubIcon({ size = 15, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

interface Props {
  onResult: (result: ScanResult) => void;
}

export function UploadZone({ onResult }: Props) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [githubUrl, setGithubUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 px-4">
      {/* Logo */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Shield size={32} className="text-indigo-400" />
          <h1 className="text-3xl font-bold text-white tracking-tight">RepoShield AI</h1>
        </div>
        <p className="text-slate-400 text-sm max-w-sm">
          Find the flaw. Understand the risk. Fix it with evidence.
        </p>
      </div>

      {/* Upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !loading && inputRef.current?.click()}
        className={`
          w-full max-w-lg border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all
          ${dragging ? "border-indigo-400 bg-indigo-950/30" : "border-slate-600 hover:border-slate-400 bg-slate-800/30 hover:bg-slate-800/50"}
          ${loading ? "pointer-events-none opacity-60" : ""}
        `}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-indigo-400">
            <Loader2 size={36} className="animate-spin" />
            <p className="text-sm">Scanning…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload size={36} className="text-slate-500" />
            <div>
              <p className="text-slate-200 font-medium">Drop a file or ZIP here</p>
              <p className="text-slate-500 text-sm mt-1">Python · JavaScript · TypeScript</p>
            </div>
            <p className="text-slate-600 text-xs">or click to browse · max 50 MB</p>
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

      {/* GitHub URL */}
      <form onSubmit={handleGithub} className="w-full max-w-lg flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-slate-800 border border-slate-600 rounded-xl px-3">
          <GithubIcon size={15} className="text-slate-500 shrink-0" />
          <input
            type="url"
            placeholder="https://github.com/owner/repo"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            disabled={loading}
            className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 text-sm py-2.5 outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !githubUrl.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:text-indigo-400 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : "Scan"}
        </button>
      </form>

      <div className="flex items-center gap-4">
        <div className="h-px w-16 bg-slate-700" />
        <span className="text-slate-500 text-sm">or</span>
        <div className="h-px w-16 bg-slate-700" />
      </div>

      {/* Demo button */}
      <button
        onClick={handleDemo}
        disabled={loading}
        className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors border border-slate-600"
      >
        <Shield size={15} className="text-indigo-400" />
        Run demo scan (built-in fixture)
      </button>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950 border border-red-800 rounded-lg px-4 py-2.5 max-w-md">
          <AlertCircle size={15} /> {error}
        </div>
      )}
    </div>
  );
}

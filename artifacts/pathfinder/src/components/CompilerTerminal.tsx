import { useState, useEffect, useRef } from "react";
import { Play, Sparkles, RefreshCw, AlertTriangle, CheckCircle2, Terminal } from "lucide-react";
import { CompilationReport, CompilationState } from "../types";
import { getAbsoluteUrl } from "../utils";

interface CompilerTerminalProps {
  onRecompiled: (report: CompilationReport) => void;
  isCompiling: boolean;
  setIsCompiling: (val: boolean) => void;
  selectedFileName: string;
}

export default function CompilerTerminal({
  onRecompiled,
  isCompiling,
  setIsCompiling,
  selectedFileName,
}: CompilerTerminalProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [compileState, setCompileState] = useState<CompilationState>("idle");
  const [optLevel, setOptLevel] = useState<"0" | "1" | "2" | "3" | "fast">("3");
  const [targetArch, setTargetArch] = useState<"native" | "x86_64" | "generic">("native");
  const [diagnosticsResult, setDiagnosticsResult] = useState<string>("");
  const [loadingDiagnostics, setLoadingDiagnostics] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLogs([
      "RustPlay Architect v0.8.4 initialized.",
      "Workspace target detected: Cargo workspace structure.",
      "Hardware optimization profiles parsed.",
      "Ready to compile selected Rust module.",
    ]);
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const runRecompile = () => {
    setIsCompiling(true);
    setProgress(0);
    setDiagnosticsResult("");
    setCompileState("parsing");
    setLogs(["[CARGO_BUILD] Spawning compiler toolchain...", "Flags set: -C opt-level=" + optLevel + " -C target-cpu=" + targetArch]);

    const steps = [
      { text: "Reading workspace Doctrine invariants from doctrine.rs...", state: "parsing", duration: 400 },
      { text: "Loading component source models...", state: "parsing", duration: 300 },
      { text: "Verifying core_layer contracts and observation schemas...", state: "parsing", duration: 300 },
      { text: "Verifying core_layer checkpoint models and lineage doctrine...", state: "parsing", duration: 300 },
      { text: "Reading agents_layer retrieval witness bounds in hermes.rs...", state: "parsing", duration: 300 },
      { text: "Analyzing agents_layer memory witness checkpointing in astra.rs...", state: "parsing", duration: 300 },
      { text: "Reading orchestration composition design inside orchestrator.rs...", state: "parsing", duration: 300 },
      { text: "Validating rust compiler alignment properties...", state: "codegen", duration: 500 },
      { text: `Compiling systems_layer: ${selectedFileName}...`, state: "codegen", duration: 400 },
      { text: "Scanning alignment requirements for trade signal payloads...", state: "optimizing", duration: 600 },
      { text: "Validating stack vs heap boundary constraints for inline functions...", state: "optimizing", duration: 400 },
      { text: "Evaluating memory safety blocks in runtime_gate.rs...", state: "verification", duration: 500 },
      { text: "Executing alignment asserts: raw struct alignment inside signal.rs...", state: "verification", duration: 400 },
      { text: "Linking libraries: libsystems_layer.rlib -> app.exe...", state: "linking", duration: 500 },
    ];

    let currentStepIndex = 0;
    const executeStep = () => {
      if (currentStepIndex < steps.length) {
        const step = steps[currentStepIndex];
        setCompileState(step.state as CompilationState);
        setLogs((prev) => [...prev, `[COMPILER] ${step.text}`]);
        setProgress((prev) => Math.min(prev + 10, 90));
        currentStepIndex++;
        setTimeout(executeStep, step.duration);
      } else {
        const isSuccess = Math.random() > 0.15;
        if (isSuccess) {
          setCompileState("success");
          setProgress(100);
          const report: CompilationReport = {
            success: true,
            latencyNs: 64 + Math.random() * 10,
            optimizationsApplied: ["cache-line align", "inlined hot paths", "branch hints"],
            warnings: [],
          };
          setLogs((prev) => [
            ...prev,
            `[SUCCESS] Binary compiled: hft_engine_v0.8.4.exe`,
            `[LATENCY] Estimated core execution: ${(report.latencyNs ?? 0).toFixed(2)}ns`,
            `🎉 Checkpoint Doctrine v0.1 sealed - Astra witnesses observations, Checkpoint preserves lineage, Operator decides meaning.`,
            `🎉 app::orchestrator::Orchestrator instantiated - Coordinates flow, avoids decision power.`,
            `🎉 Orchestration Loop v0.1 sealed - The witnesses participate in a complete stateless lifecycle.`
          ]);
          onRecompiled(report);
          setIsCompiling(false);
        } else {
          setCompileState("failed_contract");
          setLogs((prev) => [
            ...prev,
            "❌ [ERROR] Rust compilation aborted inside: runtime_gate.rs.",
            "❌ [CAUGHT_VIOLATION] Memory alignment assertion failed: Struct alignment 'Signal' (aligned to 32 bytes) violates strict cache boundary of 64 bytes inside target 'RuntimeGate'.",
            "❌ [LINKER_ABORT] Process killed with exit code 101."
          ]);
          setIsCompiling(false);
        }
      }
    };

    setTimeout(executeStep, 400);
  };

  const getAIDiagnostics = async () => {
    setLoadingDiagnostics(true);
    try {
      const response = await fetch(getAbsoluteUrl("/api/gemini/analyze-compile-error"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          componentName: selectedFileName,
          errorContext: {
            errorType: compileState === "failed_contract" ? "L1-cache alignment failure" : "Micro-bench performance warning",
            optLevel,
            targetArch,
            logs: logs.slice(-8)
          }
        })
      });
      const data = await response.json();
      setDiagnosticsResult(data.analysis || data.error || "Failed to generate diagnostics.");
    } catch {
      setDiagnosticsResult("An offline rescue diagnostic matching is shown in the fallback terminal above. Configure GEMINI_API_KEY for dynamic AI reasoning.");
    } finally {
      setLoadingDiagnostics(false);
    }
  };

  return (
    <div className="bg-[#0A0B0E] border border-sleek-border rounded-xl overflow-hidden shadow-2xl font-mono text-xs flex flex-col h-full" id="compiler-terminal-interface">
      <div className="bg-[#0F1115] px-4 py-3 border-b border-sleek-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Terminal className="text-sleek-cyan w-4 h-4" />
          <span className="text-sleek-text font-bold">CARGO COMPILER CONSOLE & AI REBUILDER</span>
        </div>
        <div className="flex space-x-2">
          <span className="w-3 h-3 rounded-full bg-sleek-red"></span>
          <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
          <span className="w-3 h-3 rounded-full bg-sleek-green"></span>
        </div>
      </div>

      <div className="bg-[#0F1115]/60 p-3 border-b border-sleek-border grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] text-sleek-muted font-semibold uppercase mb-1">
            Optimization Level
          </label>
          <select
            value={optLevel}
            onChange={(e) => setOptLevel(e.target.value as any)}
            className="w-full bg-[#0D0F13] border border-sleek-border-active text-sleek-text rounded p-1.5 font-mono text-xs focus:ring-1 focus:ring-sleek-cyan focus:outline-none"
            id="select-opt-level"
          >
            <option value="0">-O0 (None - Fast Compile)</option>
            <option value="1">-O1 (Basic - Inline Helper Functions)</option>
            <option value="2">-O2 (Standard - Release Build Optimized)</option>
            <option value="3">-O3 (Max Speed - Cache-Aligned & Core Pinned)</option>
            <option value="fast">-Ofast (Aggressive Loop Unrolling)</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-sleek-muted font-semibold uppercase mb-1">
            Compile Target CPU
          </label>
          <select
            value={targetArch}
            onChange={(e) => setTargetArch(e.target.value as any)}
            className="w-full bg-[#0D0F13] border border-sleek-border-active text-sleek-text rounded p-1.5 font-mono text-xs focus:ring-1 focus:ring-sleek-cyan focus:outline-none"
            id="select-target-arch"
          >
            <option value="native">native (Local Intel Core Desktop)</option>
            <option value="x86_64">x86_64 (Generic Intel/AMD Server CPU)</option>
            <option value="generic">generic (Any Host Arch Portable C)</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={runRecompile}
            disabled={isCompiling}
            className={`w-full py-1.5 px-3 rounded flex items-center justify-center space-x-2 font-bold transition-all cursor-pointer ${
              isCompiling
                ? "bg-[#1E2128] text-sleek-muted border border-sleek-border"
                : "bg-white hover:bg-slate-200 text-black shadow-md border border-slate-200"
            }`}
            id="btn-trigger-recompile"
          >
            {isCompiling ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-sleek-muted" />
                <span>REBUILDING...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-black text-black" />
                <span>COMPILE & HOT-SWAP</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isCompiling && (
        <div className="w-full bg-[#1E2128] h-1">
          <div
            className="bg-sleek-green h-1 transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      <div
        ref={terminalRef}
        className="flex-1 p-4 overflow-y-auto space-y-1 bg-[#0A0B0E] text-sleek-text min-h-[160px] max-h-[250px]"
        id="terminal-output-logs"
      >
        {logs.map((log, index) => {
          let color = "text-sleek-text";
          if (log.startsWith("❌") || log.includes("[ERROR]")) color = "text-sleek-red font-semibold";
          else if (log.startsWith("🎉") || log.includes("[SUCCESS]")) color = "text-sleek-green font-semibold";
          else if (log.includes("[COMPILER]")) color = "text-sleek-muted";
          else if (log.includes("[GATE_VIOLATION]")) color = "text-orange-400";

          return (
            <div key={index} className={`leading-relaxed ${color}`}>
              {log}
            </div>
          );
        })}
      </div>

      <div className="bg-[#0F1115] border-t border-sleek-border p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center space-x-2 text-sleek-muted">
          {compileState === "success" ? (
            <div className="flex items-center space-x-1.5 text-sleek-green text-xs">
              <CheckCircle2 className="w-4 h-4 text-sleek-green" />
              <span>Simulated Latency Model: &lt;85ns target (Simulation Marker)</span>
            </div>
          ) : compileState === "failed_contract" ? (
            <div className="flex items-center space-x-1.5 text-sleek-red text-xs">
              <AlertTriangle className="w-4 h-4 text-sleek-red" />
              <span>Compilation failed. Alignment / safety bounds violation!</span>
            </div>
          ) : (
            <div className="text-[11px]">Enforce hardware pinning or compile code above.</div>
          )}
        </div>

        <button
          onClick={getAIDiagnostics}
          disabled={loadingDiagnostics}
          className="border border-[#2D3139] hover:bg-[#2D3139] bg-[#1E2128] text-[#FFFFFF] px-3 py-1.5 rounded flex items-center justify-center space-x-1.5 cursor-pointer text-xs transition-colors"
          id="btn-ai-diagnostic"
        >
          <Sparkles className="w-3.5 h-3.5 text-sleek-cyan" />
          <span>{loadingDiagnostics ? "AI ANALYZING..." : "AI DIAGNOSTIC REPORT"}</span>
        </button>
      </div>

      {diagnosticsResult && (
        <div className="bg-[#0F1115] border-t border-sleek-border p-4 overflow-y-auto shrink-0 max-h-[180px] text-sleek-text leading-relaxed font-sans" id="diagnostics-view">
          <div className="flex items-center space-x-1.5 text-sleek-cyan font-mono text-xs font-semibold mb-2">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>AI MICRO-ARCHITECTURAL INTERPRETATION</span>
          </div>
          <div className="text-xs whitespace-pre-wrap select-text">{diagnosticsResult}</div>
        </div>
      )}
    </div>
  );
}

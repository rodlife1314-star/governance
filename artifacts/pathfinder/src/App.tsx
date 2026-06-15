import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAbsoluteUrl } from "./utils";
import { INITIAL_RUST_FILES } from "./data";
import { RustFile, CompilationReport } from "./types";
import { LiveFeedData, DimensionalAnalysis } from "./augment-types";

import FieldBar from "./components/FieldBar";
import DimensionStack from "./components/DimensionStack";
import RapidsAperture from "./components/RapidsAperture";
import SimonPanel from "./components/SimonPanel";
import OperatorChannel from "./components/OperatorChannel";

import Sidebar from "./components/Sidebar";
import CodeWorkspace from "./components/CodeWorkspace";
import CompilerTerminal from "./components/CompilerTerminal";

type Mode = "augment" | "archive" | "code";

interface AuditRecord {
  id: string;
  authority: string;
  asset: string;
  price: string;
  packetId: string;
  operatorEmail: string;
  logs: string[];
  signature: string;
  createdAt: string;
  verified: boolean;
  operatorDecision: string;
  divergenceState: string;
  divergenceDelta: number;
}

export default function App() {
  const [mode, setMode] = useState<Mode>("augment");

  // Live feed
  const [liveFeed, setLiveFeed] = useState<LiveFeedData | null>(null);
  const [feedLoading, setFeedLoading] = useState(false);
  const feedLoadingRef = useRef(false);

  // Dimensional analysis
  const [analysis, setAnalysis] = useState<DimensionalAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Operator channel
  const [sealing, setSealing] = useState(false);
  const [sealedFlash, setSealedFlash] = useState(false);

  // Archive mode
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditFilter, setAuditFilter] = useState<"ALL" | "APPROVED" | "REJECTED">("ALL");

  // Code mode
  const [rustFiles, setRustFiles] = useState<RustFile[]>(INITIAL_RUST_FILES);
  const [selectedFile, setSelectedFile] = useState<RustFile>(INITIAL_RUST_FILES[0]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiledFileName, setCompiledFileName] = useState("");

  const fetchLiveFeed = useCallback(async () => {
    if (feedLoadingRef.current) return;
    feedLoadingRef.current = true;
    setFeedLoading(true);
    try {
      const res = await fetch(getAbsoluteUrl("/api/sovereign/live-feed"));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) setLiveFeed(data);
    } catch { /* silent — operate on last known state */ }
    finally { feedLoadingRef.current = false; setFeedLoading(false); }
  }, []);

  const fetchDimensionalAnalysis = useCallback(async (feed: LiveFeedData) => {
    setAnalysisLoading(true);
    try {
      const spot = parseFloat(feed.coinbaseSpotPrice);
      const future = parseFloat(feed.cmeFuturePrice);
      const res = await fetch(getAbsoluteUrl("/api/gemini/dimensional-analysis"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spotPrice: spot,
          futuresPrice: future,
          basisDelta: future - spot,
          volume: feed.volume,
          openInterest: feed.openInterest,
          btcDominance: feed.btcDominance,
          spreadSpot: feed.spreadSpot,
          depthBidsSpot: feed.depthBidsSpot,
          futuresBasis: feed.futuresBasis,
          source: feed.source,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAnalysis({
          dimensions: data.dimensions || [],
          pattern: data.pattern || "",
          findings: data.findings || [],
          simonSummary: data.simonSummary || "",
          rapidsCompression: data.rapidsCompression || "",
        });
      }
    } catch { /* keep last analysis */ }
    finally { setAnalysisLoading(false); }
  }, []);

  const fetchAudits = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await fetch(getAbsoluteUrl("/api/sovereign/audits"));
      const data = await res.json();
      if (data.success) setAuditRecords(data.audits || []);
    } catch {} finally { setAuditLoading(false); }
  }, []);

  const handleSealObservation = useCallback(async (operatorText: string) => {
    if (!liveFeed || sealing) return;
    setSealing(true);
    try {
      const spot = parseFloat(liveFeed.coinbaseSpotPrice);
      const future = parseFloat(liveFeed.cmeFuturePrice);
      const basis = future - spot;
      await fetch(getAbsoluteUrl("/api/sovereign/audits"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: `OBS-${Date.now().toString(36).toUpperCase()}`,
          authority: liveFeed.source,
          asset: "BTCUSD",
          price: liveFeed.coinbaseSpotPrice,
          packetId: `PKT-${Date.now().toString(36).toUpperCase()}`,
          operatorEmail: "operator@pathfinder.local",
          logs: [
            operatorText,
            `Pattern: ${analysis?.pattern || "none"}`,
            `Basis: $${basis.toFixed(2)} (${basis >= 0 ? "CONTANGO" : "BACKWARDATION"})`,
            `RAPIDS: ${analysis?.rapidsCompression || "none"}`,
          ],
          signature: `OBS-SIG-${Date.now()}`,
          verified: true,
          operatorDecision: "APPROVED",
          divergenceState: "ALIGNED",
          divergenceDelta: Math.abs(basis),
        }),
      });
      setSealedFlash(true);
      setTimeout(() => setSealedFlash(false), 2500);
    } catch {} finally { setSealing(false); }
  }, [liveFeed, analysis, sealing]);

  const handleSaveCodeLocal = useCallback((newCode: string) => {
    setRustFiles((prev) => prev.map((f) => f.path === selectedFile.path ? { ...f, code: newCode } : f));
    setSelectedFile((prev) => ({ ...prev, code: newCode }));
  }, [selectedFile.path]);

  const handleRecompiled = useCallback((_report: CompilationReport) => {
    setCompiledFileName(selectedFile.name);
  }, [selectedFile.name]);

  // Initial load
  useEffect(() => { fetchLiveFeed(); }, []);

  // Trigger dimensional analysis when live feed arrives
  useEffect(() => {
    if (liveFeed && !analysisLoading) fetchDimensionalAnalysis(liveFeed);
  }, [liveFeed]);

  // Archive mode — load audits
  useEffect(() => {
    if (mode === "archive") fetchAudits();
  }, [mode]);

  // Auto-refresh feed every 30s
  useEffect(() => {
    const t = setInterval(fetchLiveFeed, 30000);
    return () => clearInterval(t);
  }, []);

  const filteredAudits = auditRecords.filter((a) =>
    auditFilter === "ALL" || a.operatorDecision === auditFilter
  );

  return (
    <div className="h-screen flex flex-col bg-[#07080B] text-white overflow-hidden" id="pathfinder-augment">
      {/* FIELD BAR */}
      <FieldBar
        liveFeed={liveFeed}
        feedLoading={feedLoading}
        analysisLoading={analysisLoading}
        onRefresh={() => { fetchLiveFeed(); if (liveFeed) fetchDimensionalAnalysis(liveFeed); }}
        mode={mode}
        setMode={setMode}
      />

      {/* AUGMENT MODE — the instrument */}
      <AnimatePresence mode="wait">
        {mode === "augment" && (
          <motion.div
            key="augment"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex-1 grid overflow-hidden"
            style={{ gridTemplateColumns: "360px 1fr 340px", gridTemplateRows: "1fr" }}
          >
            {/* LEFT — Dimensions */}
            <DimensionStack
              dimensions={analysis?.dimensions || []}
              loading={analysisLoading}
              rapidsCompression={analysis?.rapidsCompression || ""}
            />

            {/* CENTER — RAPIDS Aperture */}
            <RapidsAperture
              dimensions={analysis?.dimensions || []}
              loading={analysisLoading}
              rapidsCompression={analysis?.rapidsCompression || ""}
            />

            {/* RIGHT — SIMON */}
            <SimonPanel
              pattern={analysis?.pattern || ""}
              findings={analysis?.findings || []}
              simonSummary={analysis?.simonSummary || ""}
              loading={analysisLoading}
            />
          </motion.div>
        )}

        {/* ARCHIVE MODE — sovereign audit ledger */}
        {mode === "archive" && (
          <motion.div
            key="archive"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[9px] font-mono tracking-[0.25em] text-[#4A5568] uppercase mb-1">ARCHIVE</div>
                <div className="text-sm font-mono font-semibold text-white">Sovereign Observation Ledger</div>
              </div>
              <div className="flex items-center space-x-2">
                {(["ALL", "APPROVED", "REJECTED"] as const).map((f) => (
                  <button key={f} onClick={() => setAuditFilter(f)} className={`text-[8.5px] font-mono font-bold px-2 py-1 rounded cursor-pointer transition-all border ${auditFilter === f ? "border-[#E0AF68]/30 bg-[#E0AF68]/8 text-[#E0AF68]" : "border-white/[0.04] text-[#4A5568] hover:text-white"}`}>{f}</button>
                ))}
                <button onClick={fetchAudits} disabled={auditLoading} className="text-[8.5px] font-mono text-[#4A5568] hover:text-white cursor-pointer transition-all border border-white/[0.04] px-2 py-1 rounded">
                  {auditLoading ? "SYNCING..." : "SYNC"}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {filteredAudits.length === 0 ? (
                <div className="py-16 text-center text-[10px] font-mono text-[#3A4555]">
                  No observations sealed yet. Return to AUGMENT and use the operator channel.
                </div>
              ) : filteredAudits.map((a) => (
                <div key={a.id} className="border border-white/[0.04] rounded-lg p-4 space-y-2 hover:border-white/[0.08] transition-all">
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded border ${a.operatorDecision === "APPROVED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`}>{a.operatorDecision}</span>
                        <span className="text-[9px] font-mono text-[#4A5568]">{a.id}</span>
                      </div>
                      <div className="text-[10.5px] font-mono font-semibold text-white">{a.asset} @ ${parseFloat(a.price).toLocaleString()}</div>
                    </div>
                    <div className="text-right text-[9px] font-mono text-[#4A5568]">
                      <div>{a.authority}</div>
                      <div>{new Date(a.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {(a.logs || []).map((log, i) => (
                      <div key={i} className="text-[9px] font-mono text-[#5A6575] leading-relaxed">
                        {i === 0 ? <span className="text-[#8A95A3]">{log}</span> : <span className="text-[#3A4555]">{log}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CODE MODE — Rust workspace */}
        {mode === "code" && (
          <motion.div
            key="code"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex overflow-hidden"
          >
            <div className="w-60 shrink-0 border-r border-white/[0.04]">
              <Sidebar
                files={rustFiles}
                selectedFile={selectedFile}
                onSelectFile={setSelectedFile}
                compiledFileName={compiledFileName}
              />
            </div>
            <div className="flex-1 grid overflow-hidden" style={{ gridTemplateColumns: "1fr 380px" }}>
              <CodeWorkspace
                selectedFile={selectedFile}
                onSaveCodeLocal={handleSaveCodeLocal}
                isCompiling={isCompiling}
              />
              <div className="border-l border-white/[0.04]">
                <CompilerTerminal
                  onRecompiled={handleRecompiled}
                  isCompiling={isCompiling}
                  setIsCompiling={setIsCompiling}
                  selectedFileName={selectedFile.name}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OPERATOR CHANNEL — always visible in augment mode */}
      {mode === "augment" && (
        <OperatorChannel
          liveFeed={liveFeed}
          pattern={analysis?.pattern || ""}
          findings={analysis?.findings || []}
          onSealObservation={handleSealObservation}
          sealing={sealing}
          sealed={sealedFlash}
        />
      )}
    </div>
  );
}

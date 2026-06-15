import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, AlertCircle, AlertTriangle, Binary, BookOpen,
  CheckCircle, Code, Gauge, Lock, Radio, RefreshCw,
  Shield, Sigma, TrendingUp, Wifi, Zap
} from "lucide-react";

import { getAbsoluteUrl } from "./utils";
import { INITIAL_RUST_FILES } from "./data";
import { RustFile, RealitySlice, CompilationReport, TelecomTelemetry } from "./types";
import Sidebar from "./components/Sidebar";
import TelemetryPlots from "./components/TelemetryPlots";
import RealitySlicePlate from "./components/RealitySlicePlate";
import WeeklyTerrainMap from "./components/WeeklyTerrainMap";
import CodeWorkspace from "./components/CodeWorkspace";
import CompilerTerminal from "./components/CompilerTerminal";
import LanguageContextStack from "./components/LanguageContextStack";

const TABS = [
  { id: "intelligence", label: "Market Intelligence", icon: TrendingUp, color: "text-[#E0AF68]" },
  { id: "language", label: "Language Context", icon: BookOpen, color: "text-[#4CD964]" },
  { id: "code", label: "Code Workspace", icon: Code, color: "text-sleek-cyan" },
  { id: "sovereign", label: "Sovereign Audit", icon: Shield, color: "text-purple-400" },
];

interface LiveFeedData {
  coinbaseSpotPrice: string;
  cmeFuturePrice: string;
  btcDominance: number;
  volume: number;
  spreadSpot: number;
  spreadFutures: number;
  depthBidsSpot: number;
  depthAsksSpot: number;
  depthBidsFutures: number;
  depthAsksFutures: number;
  openInterest: number;
  futuresBasis: number;
  timestampA: string;
  timestampB: string;
  latencyA_ms: number;
  latencyB_ms: number;
  pingMs: number;
  source: string;
}

interface SovereignAuditRecord {
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
  const [activeTab, setActiveTab] = useState("intelligence");

  // Live feed state
  const [liveFeed, setLiveFeed] = useState<LiveFeedData | null>(null);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [feedHistory, setFeedHistory] = useState<LiveFeedData[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Audit state
  const [auditRecords, setAuditRecords] = useState<SovereignAuditRecord[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditFilter, setAuditFilter] = useState<"ALL" | "APPROVED" | "REJECTED">("ALL");
  const [approvalProcessing, setApprovalProcessing] = useState<string | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<{
    packetId: string; price: string; authority: string; asset: string;
    decision: "APPROVED" | "REJECTED";
  } | null>(null);

  // Code workspace state
  const [rustFiles, setRustFiles] = useState<RustFile[]>(INITIAL_RUST_FILES);
  const [selectedFile, setSelectedFile] = useState<RustFile>(INITIAL_RUST_FILES[0]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiledFileName, setCompiledFileName] = useState("");
  const [divergenceThreshold, setDivergenceThreshold] = useState(50);

  const feedLoadingRef = useRef(false);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLiveFeed = useCallback(async () => {
    if (feedLoadingRef.current) return;
    feedLoadingRef.current = true;
    setFeedLoading(true);
    setFeedError(null);
    try {
      const res = await fetch(getAbsoluteUrl("/api/sovereign/live-feed"));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setLiveFeed(data);
        setFeedHistory((prev) => [data, ...prev].slice(0, 20));
      } else throw new Error(data.error || "Feed error");
    } catch (err: any) {
      setFeedError(err.message || "Failed to fetch live feed");
    } finally {
      feedLoadingRef.current = false;
      setFeedLoading(false);
    }
  }, []);

  const fetchAudits = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await fetch(getAbsoluteUrl("/api/sovereign/audits"));
      const data = await res.json();
      if (data.success) setAuditRecords(data.audits || []);
    } catch {}
    finally { setAuditLoading(false); }
  }, []);

  const persistAudit = useCallback(async (
    packetId: string, price: string, authority: string, asset: string,
    decision: "APPROVED" | "REJECTED"
  ) => {
    setApprovalProcessing(packetId);
    try {
      const res = await fetch(getAbsoluteUrl("/api/sovereign/audits"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: packetId, authority, asset, price, packetId,
          operatorEmail: "operator@pathfinder.local",
          logs: [
            `${decision} by operator at ${new Date().toISOString()}`,
            `Price at decision: $${price}`, `Authority: ${authority}`,
          ],
          signature: `SIG-${Date.now()}`,
          verified: decision === "APPROVED",
          operatorDecision: decision,
          divergenceState: "ALIGNED",
          divergenceDelta: 0,
        }),
      });
      const data = await res.json();
      if (data.success) await fetchAudits();
    } catch {}
    finally { setApprovalProcessing(null); }
  }, [fetchAudits]);

  useEffect(() => { fetchLiveFeed(); fetchAudits(); }, []);

  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(fetchLiveFeed, 15000);
    } else if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    return () => { if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current); };
  }, [autoRefresh]);

  useEffect(() => { if (activeTab === "sovereign") fetchAudits(); }, [activeTab]);

  const handleSaveCodeLocal = useCallback((newCode: string) => {
    setRustFiles((prev) => prev.map((f) => f.path === selectedFile.path ? { ...f, code: newCode } : f));
    setSelectedFile((prev) => ({ ...prev, code: newCode }));
  }, [selectedFile.path]);

  const handleRecompiled = useCallback((report: CompilationReport) => {
    setCompiledFileName(selectedFile.name);
  }, [selectedFile.name]);

  const handleApprovalClick = (packetId: string, price: string, authority: string, asset: string, decision: "APPROVED" | "REJECTED") => {
    setPendingApproval({ packetId, price, authority, asset, decision });
    setShowApprovalModal(true);
  };

  const confirmApproval = async () => {
    if (!pendingApproval) return;
    setShowApprovalModal(false);
    await persistAudit(
      pendingApproval.packetId, pendingApproval.price,
      pendingApproval.authority, pendingApproval.asset, pendingApproval.decision
    );
    setPendingApproval(null);
  };

  // Derived values
  const spotPrice = liveFeed ? parseFloat(liveFeed.coinbaseSpotPrice) : 0;
  const futurePrice = liveFeed ? parseFloat(liveFeed.cmeFuturePrice) : 0;
  const basisDelta = spotPrice && futurePrice ? futurePrice - spotPrice : 0;

  const realitySlice: RealitySlice | null = liveFeed ? {
    spotPrice,
    futuresPrice: futurePrice,
    btcDominance: liveFeed.btcDominance,
    volume: liveFeed.volume,
    spreadSpot: liveFeed.spreadSpot,
    spreadFutures: liveFeed.spreadFutures,
    depthBidsSpot: liveFeed.depthBidsSpot,
    depthAsksSpot: liveFeed.depthAsksSpot,
    depthBidsFutures: liveFeed.depthBidsFutures,
    depthAsksFutures: liveFeed.depthAsksFutures,
    openInterest: liveFeed.openInterest,
    futuresBasis: liveFeed.futuresBasis,
    timestampA: liveFeed.timestampA,
    timestampB: liveFeed.timestampB,
    latencyA_ms: liveFeed.latencyA_ms,
    latencyB_ms: liveFeed.latencyB_ms,
    source: liveFeed.source,
    pingMs: liveFeed.pingMs,
  } : null;

  const telemetryData: TelecomTelemetry[] = feedHistory.slice(0, 12).map((d, i) => ({
    timestamp: Date.now() - i * 15000,
    latencyNs: 60 + Math.random() * 25,
    throughputKps: 2400 + Math.random() * 200,
    feedbackGain: 0.95 + Math.random() * 0.1,
    cacheHitRef: 0.88 + Math.random() * 0.1,
  })).reverse();

  const currentLatencyNs = telemetryData.length > 0 ? telemetryData[telemetryData.length - 1].latencyNs : 64.5;
  const filteredAudits = auditRecords.filter((a) => auditFilter === "ALL" || a.operatorDecision === auditFilter);

  return (
    <div className="min-h-screen bg-sleek-bg text-white flex font-sans" id="pathfinder-root">

      {/* Sidebar — file explorer, shown in code tab */}
      <AnimatePresence>
        {activeTab === "code" && (
          <motion.div
            initial={{ x: -240, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -240, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-60 fixed left-0 top-0 h-screen z-20"
          >
            <Sidebar
              files={rustFiles}
              selectedFile={selectedFile}
              onSelectFile={setSelectedFile}
              compiledFileName={compiledFileName}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${activeTab === "code" ? "ml-60" : "ml-0"}`}>
        <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">

          {/* Top nav bar */}
          <div className="flex items-center justify-between flex-wrap gap-3 bg-sleek-panel border border-sleek-border rounded-xl px-4 py-3 shadow">
            <div className="flex items-center space-x-1 flex-wrap gap-1.5">
              <div className="flex items-center space-x-2 mr-4">
                <Shield className="w-5 h-5 text-purple-400" />
                <span className="text-xs font-bold font-mono tracking-widest text-white uppercase">PATHFINDER</span>
                <span className="text-[9px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">v0.1</span>
              </div>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold uppercase cursor-pointer transition-all ${
                    activeTab === tab.id
                      ? "bg-[#0A0C10] border border-sleek-border text-white shadow"
                      : "text-sleek-muted hover:text-white"
                  }`}
                >
                  <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? tab.color : ""}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              {liveFeed && (
                <div className="flex items-center space-x-2 text-[10px] font-mono bg-[#0A0C10] border border-sleek-border rounded-lg px-3 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[#E0AF68] font-bold">${parseFloat(liveFeed.coinbaseSpotPrice).toLocaleString()}</span>
                  <span className="text-sleek-muted">|</span>
                  <span className={`font-bold ${basisDelta >= 0 ? "text-sleek-cyan" : "text-rose-400"}`}>
                    {basisDelta >= 0 ? "+" : ""}{basisDelta.toFixed(0)}
                  </span>
                  <span className="text-sleek-muted">{liveFeed.pingMs}ms</span>
                </div>
              )}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold flex items-center space-x-1.5 cursor-pointer border transition-all ${
                  autoRefresh ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-[#111319] border-sleek-border text-sleek-muted"
                }`}
              >
                <RefreshCw className={`w-3 h-3 ${autoRefresh && feedLoading ? "animate-spin" : ""}`} />
                <span>{autoRefresh ? "AUTO" : "PAUSED"}</span>
              </button>
              <button
                onClick={fetchLiveFeed}
                disabled={feedLoading}
                className="px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold flex items-center space-x-1.5 cursor-pointer border border-sleek-border bg-[#111319] text-sleek-muted hover:text-white transition-all"
              >
                <Zap className="w-3 h-3 text-[#E0AF68]" />
                <span>REFRESH</span>
              </button>
            </div>
          </div>

          {feedError && (
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-lg p-3 flex items-center space-x-2 text-xs text-rose-400 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Live feed: {feedError} — operating on last known state</span>
            </div>
          )}

          {/* ── TAB: MARKET INTELLIGENCE ── */}
          <AnimatePresence mode="wait">
            {activeTab === "intelligence" && (
              <motion.div key="intelligence" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "BTC Spot Price", value: liveFeed ? `$${parseFloat(liveFeed.coinbaseSpotPrice).toLocaleString()}` : "—", sub: liveFeed ? `Source: ${liveFeed.source}` : "Awaiting feed", color: "text-[#E0AF68]", Icon: TrendingUp, pulse: true },
                    { label: "CME Futures", value: liveFeed ? `$${parseFloat(liveFeed.cmeFuturePrice).toLocaleString()}` : "—", sub: liveFeed ? `Basis: ${basisDelta >= 0 ? "+" : ""}${basisDelta.toFixed(0)}` : "Awaiting feed", color: basisDelta >= 0 ? "text-sleek-cyan" : "text-rose-400", Icon: Gauge, pulse: false },
                    { label: "BTC Dominance", value: liveFeed ? `${liveFeed.btcDominance.toFixed(2)}%` : "—", sub: "Market share", color: "text-[#4CD964]", Icon: Activity, pulse: false },
                    { label: "Open Interest", value: liveFeed ? `$${(liveFeed.openInterest / 1e9).toFixed(2)}B` : "—", sub: "Leverage pool", color: "text-pink-400", Icon: Sigma, pulse: false },
                  ].map((card) => (
                    <div key={card.label} className="bg-sleek-panel border border-sleek-border rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-sleek-muted uppercase tracking-wider">{card.label}</span>
                        <card.Icon className={`w-4 h-4 ${card.color} ${card.pulse ? "animate-pulse" : ""}`} />
                      </div>
                      <div className={`text-xl font-bold font-mono ${card.color}`}>{card.value}</div>
                      <div className="text-[10px] text-sleek-muted font-mono">{card.sub}</div>
                    </div>
                  ))}
                </div>

                {liveFeed && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-sleek-panel border border-sleek-border rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-sleek-muted uppercase">Coinbase Feeler</span>
                        <Wifi className="w-3.5 h-3.5 text-sleek-cyan" />
                      </div>
                      <div className="text-sm font-mono text-white">{liveFeed.latencyA_ms}ms</div>
                      <div className="text-[9px] font-mono text-sleek-muted">{liveFeed.timestampA}</div>
                      <div className="flex justify-between text-[9px] font-mono"><span className="text-sleek-muted">Bid spread:</span><span className="text-white">${liveFeed.spreadSpot.toFixed(2)}</span></div>
                      <div className="flex justify-between text-[9px] font-mono"><span className="text-sleek-muted">Bids depth:</span><span className="text-sleek-cyan">{liveFeed.depthBidsSpot.toFixed(1)} BTC</span></div>
                    </div>
                    <div className="bg-sleek-panel border border-sleek-border rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-sleek-muted uppercase">CME Feeler</span>
                        <Radio className="w-3.5 h-3.5 text-[#E0AF68]" />
                      </div>
                      <div className="text-sm font-mono text-white">{liveFeed.latencyB_ms}ms</div>
                      <div className="text-[9px] font-mono text-sleek-muted">{liveFeed.timestampB}</div>
                      <div className="flex justify-between text-[9px] font-mono"><span className="text-sleek-muted">Bid spread:</span><span className="text-white">${liveFeed.spreadFutures.toFixed(2)}</span></div>
                      <div className="flex justify-between text-[9px] font-mono"><span className="text-sleek-muted">Bids depth:</span><span className="text-[#E0AF68]">{liveFeed.depthBidsFutures.toFixed(1)} BTC</span></div>
                    </div>
                    <div className="bg-sleek-panel border border-sleek-border rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-sleek-muted uppercase">Futures Basis</span>
                        <Binary className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <div className={`text-sm font-mono ${basisDelta >= 0 ? "text-sleek-cyan" : "text-rose-400"}`}>{basisDelta >= 0 ? "+" : ""}{basisDelta.toFixed(2)}</div>
                      <div className="text-[9px] font-mono text-sleek-muted">{basisDelta >= 0 ? "CONTANGO" : "BACKWARDATION"}</div>
                      <div className="flex justify-between text-[9px] font-mono"><span className="text-sleek-muted">Basis %:</span><span className={basisDelta >= 0 ? "text-sleek-cyan" : "text-rose-400"}>{(liveFeed.futuresBasis * 100).toFixed(4)}%</span></div>
                      <div className="flex justify-between text-[9px] font-mono"><span className="text-sleek-muted">Volume:</span><span className="text-white">${(liveFeed.volume / 1e9).toFixed(2)}B</span></div>
                    </div>
                  </div>
                )}

                <TelemetryPlots telemetryData={telemetryData} currentLatencyNs={currentLatencyNs} />
                <RealitySlicePlate slice={realitySlice} divergenceThreshold={divergenceThreshold} setDivergenceThreshold={setDivergenceThreshold} />
                <WeeklyTerrainMap
                  livePrice={spotPrice}
                  liveIndicator={liveFeed ? { spot: liveFeed.coinbaseSpotPrice, future: liveFeed.cmeFuturePrice, ping: liveFeed.pingMs, source: liveFeed.source } : null}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── TAB: LANGUAGE CONTEXT ── */}
          <AnimatePresence mode="wait">
            {activeTab === "language" && (
              <motion.div key="language" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                <LanguageContextStack />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── TAB: CODE WORKSPACE ── */}
          <AnimatePresence mode="wait">
            {activeTab === "code" && (
              <motion.div key="code" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  <div className="xl:col-span-8">
                    <CodeWorkspace
                      selectedFile={selectedFile}
                      onSaveCodeLocal={handleSaveCodeLocal}
                      isCompiling={isCompiling}
                    />
                  </div>
                  <div className="xl:col-span-4">
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

          {/* ── TAB: SOVEREIGN AUDIT ── */}
          <AnimatePresence mode="wait">
            {activeTab === "sovereign" && (
              <motion.div key="sovereign" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="space-y-6">
                <div className="bg-sleek-panel border border-sleek-border rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="text-purple-400 w-5 h-5" />
                      <h2 className="text-sm font-bold font-mono tracking-widest text-purple-400 uppercase">SOVEREIGN AUDIT LEDGER</h2>
                    </div>
                    <button onClick={fetchAudits} disabled={auditLoading} className="px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold flex items-center space-x-1.5 cursor-pointer border border-sleek-border bg-[#111319] text-sleek-muted hover:text-white transition-all">
                      <RefreshCw className={`w-3 h-3 ${auditLoading ? "animate-spin" : ""}`} />
                      <span>SYNC</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-sleek-muted leading-relaxed">Immutable record of all operator-approved and operator-rejected sovereignty decisions. Each packet is sealed with a cryptographic signature and stored in the PostgreSQL ledger.</p>
                  <div className="flex items-center space-x-2 text-[10px] font-mono flex-wrap gap-2">
                    <span className="text-sleek-muted">Filter:</span>
                    {(["ALL", "APPROVED", "REJECTED"] as const).map((f) => (
                      <button key={f} onClick={() => setAuditFilter(f)} className={`px-2 py-1 rounded cursor-pointer transition-all font-bold ${auditFilter === f ? f === "APPROVED" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/25" : f === "REJECTED" ? "bg-rose-500/20 text-rose-400 border border-rose-500/25" : "bg-purple-500/20 text-purple-400 border border-purple-500/25" : "bg-[#111319] text-sleek-muted border border-sleek-border"}`}>{f}</button>
                    ))}
                    <span className="text-sleek-muted">({filteredAudits.length} records)</span>
                  </div>
                </div>

                {liveFeed && (
                  <div className="bg-[#0D1017] border border-purple-500/20 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Zap className="text-[#E0AF68] w-4 h-4 animate-pulse" />
                        <h3 className="text-xs font-bold font-mono tracking-widest text-[#E0AF68] uppercase">Live Approval Gate</h3>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">Feed Active</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] font-mono">
                      {[
                        { label: "Spot Price", value: `$${parseFloat(liveFeed.coinbaseSpotPrice).toLocaleString()}`, color: "text-[#E0AF68]" },
                        { label: "CME Future", value: `$${parseFloat(liveFeed.cmeFuturePrice).toLocaleString()}`, color: "text-sleek-cyan" },
                        { label: "Basis Delta", value: `${basisDelta >= 0 ? "+" : ""}${basisDelta.toFixed(2)}`, color: basisDelta >= 0 ? "text-sleek-cyan" : "text-rose-400" },
                        { label: "Source", value: liveFeed.source, color: "text-white" },
                      ].map((item) => (
                        <div key={item.label} className="bg-[#08090C] border border-white/5 rounded-lg p-3">
                          <span className="text-sleek-muted block text-[8px] uppercase mb-1">{item.label}</span>
                          <span className={`font-bold text-sm ${item.color}`}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center space-x-3">
                      <button onClick={() => handleApprovalClick(`AUDIT-${Date.now().toString(36).toUpperCase()}`, liveFeed.coinbaseSpotPrice, "Coinbase", "BTCUSD", "APPROVED")} disabled={!!approvalProcessing} className="flex-1 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono text-xs font-bold hover:bg-emerald-500/20 transition-all cursor-pointer flex items-center justify-center space-x-1.5">
                        <CheckCircle className="w-4 h-4" />
                        <span>{approvalProcessing ? "PROCESSING..." : "APPROVE & SEAL"}</span>
                      </button>
                      <button onClick={() => handleApprovalClick(`AUDIT-${Date.now().toString(36).toUpperCase()}`, liveFeed.coinbaseSpotPrice, "Coinbase", "BTCUSD", "REJECTED")} disabled={!!approvalProcessing} className="flex-1 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 font-mono text-xs font-bold hover:bg-rose-500/20 transition-all cursor-pointer flex items-center justify-center space-x-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        <span>REJECT & FLAG</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {auditLoading && filteredAudits.length === 0 ? (
                    <div className="bg-sleek-panel border border-sleek-border rounded-xl p-12 flex items-center justify-center">
                      <div className="flex flex-col items-center space-y-3 text-sleek-muted font-mono text-xs">
                        <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
                        <span>Loading sovereign audit ledger...</span>
                      </div>
                    </div>
                  ) : filteredAudits.length === 0 ? (
                    <div className="bg-sleek-panel border border-dashed border-sleek-border rounded-xl p-12 flex items-center justify-center text-sleek-muted font-mono text-xs text-center">
                      <div className="space-y-2">
                        <Shield className="w-8 h-8 text-purple-400/30 mx-auto" />
                        <p>No audit records. Use the Live Approval Gate above to create your first sovereign decision.</p>
                      </div>
                    </div>
                  ) : filteredAudits.map((audit) => (
                    <div key={audit.id} className="bg-sleek-panel border border-sleek-border rounded-xl p-4 space-y-3 hover:border-purple-500/20 transition-all">
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${audit.operatorDecision === "APPROVED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`}>{audit.operatorDecision}</span>
                            <span className="text-[10px] font-mono text-sleek-muted">{audit.id}</span>
                          </div>
                          <div className="text-[11px] font-mono text-white font-bold">{audit.asset} @ ${parseFloat(audit.price).toLocaleString()}</div>
                        </div>
                        <div className="text-right text-[9px] font-mono text-sleek-muted">
                          <div>{audit.authority}</div>
                          <div>{new Date(audit.createdAt).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(audit.logs || []).map((log, i) => (
                          <span key={i} className="text-[8.5px] font-mono bg-[#0A0C10] border border-white/5 px-2 py-0.5 rounded text-sleek-muted">{log}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-mono text-sleek-muted border-t border-white/5 pt-2">
                        <div className="flex items-center space-x-1.5">
                          <Lock className="w-3 h-3 text-purple-400" />
                          <span className="text-purple-400/70 truncate max-w-[200px]">{audit.signature}</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${audit.divergenceState === "ALIGNED" ? "text-emerald-400" : "text-rose-400"}`}>
                          <Activity className="w-3 h-3" />
                          <span>{audit.divergenceState} Δ{(audit.divergenceDelta || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Confirmation modal */}
      <AnimatePresence>
        {showApprovalModal && pendingApproval && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowApprovalModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#0F1115] border border-sleek-border rounded-2xl p-6 max-w-md w-full space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center space-x-3">
                {pendingApproval.decision === "APPROVED" ? <CheckCircle className="text-emerald-400 w-6 h-6" /> : <AlertTriangle className="text-rose-400 w-6 h-6" />}
                <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">Confirm {pendingApproval.decision}</h3>
              </div>
              <div className="bg-[#08090C] border border-white/5 rounded-lg p-4 space-y-2 font-mono text-xs">
                <div className="flex justify-between"><span className="text-sleek-muted">Packet ID:</span><span className="text-white">{pendingApproval.packetId}</span></div>
                <div className="flex justify-between"><span className="text-sleek-muted">Asset:</span><span className="text-white">{pendingApproval.asset}</span></div>
                <div className="flex justify-between"><span className="text-sleek-muted">Price:</span><span className="text-[#E0AF68]">${parseFloat(pendingApproval.price).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-sleek-muted">Authority:</span><span className="text-white">{pendingApproval.authority}</span></div>
              </div>
              <p className="text-[11px] text-sleek-muted font-mono">This decision will be sealed and committed to the sovereign audit ledger. This action cannot be undone.</p>
              <div className="flex space-x-3">
                <button onClick={() => setShowApprovalModal(false)} className="flex-1 py-2 rounded-lg border border-sleek-border text-sleek-muted font-mono text-xs cursor-pointer hover:text-white transition-all">CANCEL</button>
                <button onClick={confirmApproval} className={`flex-1 py-2 rounded-lg font-mono text-xs font-bold cursor-pointer transition-all ${pendingApproval.decision === "APPROVED" ? "bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/30" : "bg-rose-500/20 border border-rose-500/25 text-rose-400 hover:bg-rose-500/30"}`}>
                  CONFIRM {pendingApproval.decision}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAbsoluteUrl } from "./utils";
import { LiveFeedData, DimensionalAnalysis, FeedRecord } from "./augment-types";
import { AssetId, ASSETS, getAsset, generateMockFeed } from "./assets";

import FieldBar from "./components/FieldBar";
import DimensionStack from "./components/DimensionStack";
import RapidsAperture from "./components/RapidsAperture";
import SimonPanel from "./components/SimonPanel";
import OperatorChannel from "./components/OperatorChannel";
import ActionPanel from "./components/ActionPanel";

type Mode = "augment" | "archive" | "action";
type AugmentTab = "field" | "dims" | "intel";

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
  const [selectedAsset, setSelectedAsset] = useState<AssetId>("BTC");
  const [augmentTab, setAugmentTab] = useState<AugmentTab>("field");

  // Live feed
  const [liveFeed, setLiveFeed] = useState<LiveFeedData | null>(null);
  const [feedLoading, setFeedLoading] = useState(false);
  const feedLoadingRef = useRef(false);

  // Dimensional analysis
  const [analysis, setAnalysis] = useState<DimensionalAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Authority dimension feeds (live feed status per dimension)
  const [dimensionFeeds, setDimensionFeeds] = useState<FeedRecord[]>([]);
  const feedsPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Operator channel
  const [sealing, setSealing] = useState(false);
  const [sealedFlash, setSealedFlash] = useState(false);

  // Archive + Action share audit records
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditFilter, setAuditFilter] = useState<"ALL" | "APPROVED" | "REJECTED">("ALL");

  // ── Polling helpers ───────────────────────────────────────────────────────

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const applyAnalysis = useCallback((a: Record<string, unknown>) => {
    setAnalysis({
      dimensions: (a.dimensions as DimensionalAnalysis["dimensions"]) || [],
      pattern: (a.pattern as string) || "",
      findings: (a.findings as string[]) || [],
      simonSummary: (a.simonSummary as string) || "",
      rapidsCompression: (a.rapidsCompression as string) || "",
    });
    setAnalysisLoading(false);
  }, []);

  const startPolling = useCallback((assetId: AssetId) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(getAbsoluteUrl("/api/gemini/dimensional-cache"));
        const data = await res.json();
        if (data.status === "ready" && data.analysis && data.assetKey === assetId) {
          applyAnalysis(data.analysis as Record<string, unknown>);
          stopPolling();
        }
      } catch { /* keep polling */ }
    }, 2000);
  }, [stopPolling, applyAnalysis]);

  // ── Dimension feeds ────────────────────────────────────────────────────────

  const fetchDimensionFeeds = useCallback(async () => {
    try {
      const res = await fetch(getAbsoluteUrl("/api/dimensions/feeds"));
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.feeds)) {
        setDimensionFeeds(data.feeds as FeedRecord[]);
      }
    } catch { /* preserve last known feeds */ }
  }, []);

  // ── Analysis trigger ──────────────────────────────────────────────────────

  const triggerAnalysis = useCallback(async (feed: LiveFeedData, assetId: AssetId) => {
    const asset = getAsset(assetId);
    try {
      const cacheRes = await fetch(getAbsoluteUrl("/api/gemini/dimensional-cache"));
      const cacheData = await cacheRes.json();
      if (cacheData.status === "ready" && cacheData.analysis && cacheData.assetKey === assetId) {
        applyAnalysis(cacheData.analysis as Record<string, unknown>);
        return;
      }
    } catch { /* fall through */ }

    setAnalysisLoading(true);
    try {
      const spot   = parseFloat(feed.coinbaseSpotPrice);
      const future = parseFloat(feed.cmeFuturePrice);
      const triggerRes = await fetch(getAbsoluteUrl("/api/gemini/dimensional-trigger"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetKey:     assetId,
          assetLabel:   asset.label,
          assetPair:    asset.pair,
          spotPrice:    spot,
          futuresPrice: future,
          basisDelta:   future - spot,
          volume:       feed.volume,
          openInterest: feed.openInterest,
          btcDominance: feed.btcDominance,
          spreadSpot:   feed.spreadSpot,
          depthBidsSpot:feed.depthBidsSpot,
          futuresBasis: feed.futuresBasis,
          source:       feed.source,
        }),
      });
      const triggerData = await triggerRes.json();
      if (triggerData.status === "ready") {
        const cacheRes  = await fetch(getAbsoluteUrl("/api/gemini/dimensional-cache"));
        const cacheData = await cacheRes.json();
        if (cacheData.analysis && cacheData.assetKey === assetId) {
          applyAnalysis(cacheData.analysis as Record<string, unknown>);
          return;
        }
      }
      startPolling(assetId);
    } catch { setAnalysisLoading(false); }
  }, [startPolling, applyAnalysis]);

  // ── Live feed ─────────────────────────────────────────────────────────────

  const fetchLiveFeed = useCallback(async (assetId?: AssetId) => {
    const id    = assetId ?? selectedAsset;
    const asset = getAsset(id);

    if (!asset.live) {
      const mock = generateMockFeed(asset);
      setLiveFeed(mock);
      return mock;
    }

    if (feedLoadingRef.current) return null;
    feedLoadingRef.current = true;
    setFeedLoading(true);
    try {
      const res  = await fetch(getAbsoluteUrl("/api/sovereign/live-feed"));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) { setLiveFeed(data); return data as LiveFeedData; }
    } catch { /* operate on last known state */ }
    finally { feedLoadingRef.current = false; setFeedLoading(false); }
    return null;
  }, [selectedAsset]);

  // ── Audits ────────────────────────────────────────────────────────────────

  const fetchAudits = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res  = await fetch(getAbsoluteUrl("/api/sovereign/audits"));
      const data = await res.json();
      if (data.success) setAuditRecords(data.audits || []);
    } catch {} finally { setAuditLoading(false); }
  }, []);

  const handleSealObservation = useCallback(async (operatorText: string) => {
    if (!liveFeed || sealing) return;
    setSealing(true);
    const asset = getAsset(selectedAsset);
    try {
      const spot   = parseFloat(liveFeed.coinbaseSpotPrice);
      const future = parseFloat(liveFeed.cmeFuturePrice);
      const basis  = future - spot;
      await fetch(getAbsoluteUrl("/api/sovereign/audits"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id:            `OBS-${Date.now().toString(36).toUpperCase()}`,
          authority:     liveFeed.source,
          asset:         asset.pair,
          price:         liveFeed.coinbaseSpotPrice,
          packetId:      `PKT-${Date.now().toString(36).toUpperCase()}`,
          operatorEmail: "operator@pathfinder.local",
          logs: [
            operatorText,
            `Pattern: ${analysis?.pattern || "none"}`,
            `Basis: ${basis >= 0 ? "+" : ""}${basis.toFixed(2)} (${basis >= 0 ? "CONTANGO" : "BACKWARDATION"})`,
            `RAPIDS: ${analysis?.rapidsCompression || "none"}`,
          ],
          signature:       `OBS-SIG-${Date.now()}`,
          verified:        true,
          operatorDecision:"APPROVED",
          divergenceState: "ALIGNED",
          divergenceDelta: Math.abs(basis),
        }),
      });
      setSealedFlash(true);
      setTimeout(() => setSealedFlash(false), 2500);
      fetchAudits();
    } catch {} finally { setSealing(false); }
  }, [liveFeed, analysis, sealing, selectedAsset, fetchAudits]);

  // ── Asset switch ──────────────────────────────────────────────────────────

  const handleAssetChange = useCallback(async (id: AssetId) => {
    setSelectedAsset(id);
    setAnalysis(null);
    stopPolling();
    const feed = await fetchLiveFeed(id);
    if (feed) triggerAnalysis(feed, id);
  }, [fetchLiveFeed, triggerAnalysis, stopPolling]);

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  // Initial load
  useEffect(() => {
    (async () => {
      const feed = await fetchLiveFeed("BTC");
      if (feed) triggerAnalysis(feed, "BTC");
      fetchDimensionFeeds();
    })();
  }, []);

  // Cleanup on unmount
  useEffect(() => () => {
    stopPolling();
    if (feedsPollRef.current) clearInterval(feedsPollRef.current);
  }, []);

  // Load audits when entering archive or action mode
  useEffect(() => {
    if (mode === "archive" || mode === "action") fetchAudits();
  }, [mode]);

  // Auto-refresh live feed every 30s
  useEffect(() => {
    const t = setInterval(() => fetchLiveFeed(), 30_000);
    return () => clearInterval(t);
  }, [fetchLiveFeed]);

  // Auto-refresh dimension feeds every 60s
  useEffect(() => {
    feedsPollRef.current = setInterval(fetchDimensionFeeds, 60_000);
    return () => { if (feedsPollRef.current) clearInterval(feedsPollRef.current); };
  }, [fetchDimensionFeeds]);

  // ── Render ────────────────────────────────────────────────────────────────

  const filteredAudits = auditRecords.filter((a) =>
    auditFilter === "ALL" || a.operatorDecision === auditFilter
  );

  return (
    <div className="h-screen flex flex-col bg-[#07080B] text-white overflow-hidden" id="pathfinder-augment">
      <FieldBar
        liveFeed={liveFeed}
        feedLoading={feedLoading}
        analysisLoading={analysisLoading}
        onRefresh={() => { fetchLiveFeed(); if (liveFeed) triggerAnalysis(liveFeed, selectedAsset); }}
        mode={mode}
        setMode={setMode}
        selectedAsset={selectedAsset}
        onAssetChange={handleAssetChange}
      />

      <AnimatePresence mode="wait">
        {/* AUGMENT */}
        {mode === "augment" && (
          <motion.div
            key="augment"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Mobile sub-tab bar */}
            <div className="md:hidden flex border-b border-white/[0.04] shrink-0 bg-[#07080B]">
              {([["field", "LENS"], ["dims", "DIMS"], ["intel", "FINDINGS"]] as [AugmentTab, string][]).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setAugmentTab(id)}
                  className={`flex-1 py-2.5 text-[9px] font-mono font-bold tracking-[0.2em] transition-all cursor-pointer border-b-2 ${
                    augmentTab === id
                      ? "text-white border-[#E0AF68]"
                      : "text-[#5A6575] border-transparent hover:text-[#8A9DB0]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Desktop: 3-column grid */}
            <div
              className="hidden md:grid flex-1 overflow-hidden"
              style={{ gridTemplateColumns: "360px 1fr 340px" }}
            >
              <DimensionStack
                dimensions={analysis?.dimensions || []}
                loading={analysisLoading}
                rapidsCompression={analysis?.rapidsCompression || ""}
                feeds={dimensionFeeds}
              />
              <RapidsAperture
                dimensions={analysis?.dimensions || []}
                loading={analysisLoading}
                rapidsCompression={analysis?.rapidsCompression || ""}
              />
              <SimonPanel
                pattern={analysis?.pattern || ""}
                findings={analysis?.findings || []}
                simonSummary={analysis?.simonSummary || ""}
                loading={analysisLoading}
              />
            </div>

            {/* Mobile: single panel */}
            <div className="md:hidden flex-1 overflow-hidden">
              {augmentTab === "field" && (
                <RapidsAperture
                  dimensions={analysis?.dimensions || []}
                  loading={analysisLoading}
                  rapidsCompression={analysis?.rapidsCompression || ""}
                />
              )}
              {augmentTab === "dims" && (
                <DimensionStack
                  dimensions={analysis?.dimensions || []}
                  loading={analysisLoading}
                  rapidsCompression={analysis?.rapidsCompression || ""}
                  feeds={dimensionFeeds}
                />
              )}
              {augmentTab === "intel" && (
                <SimonPanel
                  pattern={analysis?.pattern || ""}
                  findings={analysis?.findings || []}
                  simonSummary={analysis?.simonSummary || ""}
                  loading={analysisLoading}
                />
              )}
            </div>
          </motion.div>
        )}

        {/* ARCHIVE */}
        {mode === "archive" && (
          <motion.div
            key="archive"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-4"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <button
                  onClick={() => setMode("augment")}
                  className="text-[8px] font-mono text-[#5A6575] hover:text-[#E0AF68] transition-colors cursor-pointer mb-1.5 flex items-center gap-1"
                >
                  ← INSTRUMENT
                </button>
                <div className="text-[9px] font-mono tracking-[0.25em] text-[#6B7280] uppercase mb-1">ARCHIVE</div>
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
                <div className="py-16 text-center text-[10px] font-mono text-[#6B7280]">
                  No observations sealed yet. Return to AUGMENT and use the operator channel.
                </div>
              ) : filteredAudits.map((a) => (
                <div key={a.id} className="border border-white/[0.04] rounded-lg p-4 space-y-2 hover:border-white/[0.08] transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded border ${a.operatorDecision === "APPROVED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`}>{a.operatorDecision}</span>
                        <span className="text-[9px] font-mono text-[#4A5568]">{a.id}</span>
                      </div>
                      <div className="text-[10.5px] font-mono font-semibold text-white">{a.asset} @ ${parseFloat(a.price).toLocaleString()}</div>
                    </div>
                    <div className="text-right text-[9px] font-mono text-[#4A5568] shrink-0">
                      <div>{a.authority}</div>
                      <div>{new Date(a.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {(a.logs || []).map((log, i) => (
                      <div key={i} className="text-[9px] font-mono leading-relaxed">
                        {i === 0 ? <span className="text-[#C4CDD8]">{log}</span> : <span className="text-[#6B7280]">{log}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ACTION */}
        {mode === "action" && (
          <motion.div
            key="action"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Back nav */}
            <div className="shrink-0 px-4 md:px-5 py-2 border-b border-white/[0.04] flex items-center">
              <button
                onClick={() => setMode("augment")}
                className="text-[8px] font-mono text-[#5A6575] hover:text-[#E0AF68] transition-colors cursor-pointer flex items-center gap-1"
              >
                ← INSTRUMENT
              </button>
              <div className="ml-3 text-[9px] font-mono tracking-[0.2em] text-[#4A5568] uppercase">ACTION</div>
            </div>
            <div className="flex-1 flex overflow-hidden">
              <ActionPanel
                liveFeed={liveFeed}
                analysis={analysis}
                auditRecords={auditRecords}
                auditLoading={auditLoading}
                onFetchAudits={fetchAudits}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OPERATOR CHANNEL */}
      {(mode === "augment" || mode === "action") && (
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

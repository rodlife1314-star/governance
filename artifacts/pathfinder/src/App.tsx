import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAbsoluteUrl } from "./utils";
import { LiveFeedData, DimensionalAnalysis, FeedRecord, Finding, ObservationAnalysis, CoverageReport, AetherRequirementPacket } from "./augment-types";
import { AssetId, ASSETS, getAsset } from "./assets";
import { DomainId, getDomain } from "./domains";

import FieldBar from "./components/FieldBar";
import DimensionStack from "./components/DimensionStack";
import RapidsAperture from "./components/RapidsAperture";
import SimonPanel from "./components/SimonPanel";
import OperatorChannel from "./components/OperatorChannel";
import ActionPanel from "./components/ActionPanel";
import DomainStandby from "./components/DomainStandby";
import ObservationAperture from "./components/ObservationAperture";
import CoverageGate from "./components/CoverageGate";
import ObservationResult from "./components/ObservationResult";
import AetherGate from "./components/AetherGate";
import SpectraView from "./components/SpectraView";

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

const DOMAIN_API_MAP: Record<DomainId, string> = {
  FINANCE: "Finance",
  MEDICINE: "Medicine",
  LAW: "Law",
  IT: "Technology",
  ASTROPHYSICS: "Astrophysics",
};

type AppState = "aperture" | "aether" | "coverage" | "result" | "field" | "spectra";

export default function App() {
  // ── Top-level app state ────────────────────────────────────────────────────
  const [appState, setAppState] = useState<AppState>("aperture");
  const [rawObservation, setRawObservation] = useState("");
  const [observationAnalysis, setObservationAnalysis] = useState<ObservationAnalysis | null>(null);
  const [coverageReport, setCoverageReport] = useState<CoverageReport | null>(null);
  const [analysisReady, setAnalysisReady] = useState(false);
  const fieldEnteredRef = useRef(false);
  const [aetherPacket, setAetherPacket] = useState<AetherRequirementPacket | null>(null);
  const [hintedDomainId, setHintedDomainId] = useState<DomainId | null>(null);
  const hintedDomainApiRef = useRef<string | null>(null);

  // ── Field mode state ───────────────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>("augment");
  const [selectedAsset, setSelectedAsset] = useState<AssetId>("BTC");
  const [selectedDomain, setSelectedDomain] = useState<DomainId>("FINANCE");
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
      findings: (a.findings as Finding[]) || [],
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

  const fetchDimensionFeeds = useCallback(async (assetId?: AssetId) => {
    const id = assetId ?? selectedAsset;
    try {
      const res = await fetch(getAbsoluteUrl(`/api/dimensions/feeds?asset=${id}`));
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.feeds)) {
        setDimensionFeeds(data.feeds as FeedRecord[]);
      }
    } catch { /* preserve last known feeds */ }
  }, [selectedAsset]);

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

    if (feedLoadingRef.current) return null;
    feedLoadingRef.current = true;
    setFeedLoading(true);
    try {
      const res  = await fetch(getAbsoluteUrl(`/api/sovereign/live-feed?asset=${id}`));
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
    setDimensionFeeds([]);
    stopPolling();
    fetchDimensionFeeds(id);
    const feed = await fetchLiveFeed(id);
    if (feed) triggerAnalysis(feed, id);
  }, [fetchLiveFeed, triggerAnalysis, stopPolling, fetchDimensionFeeds]);

  // ── Observation submit (Level 0 → analysis) ───────────────────────────────

  const handleObservationSubmit = useCallback(async (text: string) => {
    setRawObservation(text);
    setCoverageReport(null);
    setObservationAnalysis(null);
    setAetherPacket(null);
    setAnalysisReady(false);
    setAppState("aether");

    const hintDomain = hintedDomainApiRef.current;
    const baseBody = { observation: text, ...(hintDomain ? { domain: hintDomain } : {}) };

    // Capture packet locally so RAPIDS receives it the moment AETHER resolves.
    // Cannot read from React state synchronously — use closure variable.
    let capturedPacket: AetherRequirementPacket | null = null;

    // AETHER and SIMON fire immediately in parallel.
    const aetherPromise = fetch(getAbsoluteUrl("/api/observe/aether"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(baseBody),
    }).then(r => r.json()).then(d => {
      if (d?.success) {
        capturedPacket = d as AetherRequirementPacket;
        setAetherPacket(d as AetherRequirementPacket);
      }
    }).catch(() => {});

    const analysisPromise = fetch(getAbsoluteUrl("/api/observe"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(baseBody),
    }).then(r => r.json()).then(d => {
      if (d?.success) { setObservationAnalysis(d as ObservationAnalysis); setAnalysisReady(true); }
    }).catch(() => {});

    // Wait for AETHER — then hand its requirement packet directly to RAPIDS.
    await aetherPromise;

    // TS cannot track that capturedPacket was assigned inside the async .then() callback,
    // so it keeps the init type (null). Double-assert to access the runtime-assigned value.
    const pkt = capturedPacket as unknown as AetherRequirementPacket | null;

    // Context Custody Law: after AETHER resolves, its packet owns the domain.
    // Never substitute UI session context (hintedDomainApiRef) for packet context.
    // If no packet (AETHER degraded), fall back to the UI hint.
    const rapidsBody: Record<string, unknown> = { observation: text };
    if (pkt !== null) {
      rapidsBody["domain"]                   = pkt.domain;
      rapidsBody["subDomain"]                = pkt.subDomain;
      rapidsBody["aetherAuthorityChain"]     = pkt.authorityChain;
      rapidsBody["aetherBlockedAuthorities"] = pkt.blockedAuthorities;
    } else if (hintDomain) {
      rapidsBody["domain"] = hintDomain;
    }

    // RAPIDS fires after AETHER, receiving the full authority chain + blocked list.
    // This is the data-handoff: AETHER requirement → RAPIDS search filter.
    void fetch(getAbsoluteUrl("/api/observe/coverage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rapidsBody),
    }).then(r => r.json()).then(d => {
      if (d?.success) setCoverageReport(d as CoverageReport);
    }).catch(() => {});

    void analysisPromise;
  }, []);

  // ── Observation seal (from result view) ───────────────────────────────────

  const handleObservationSeal = useCallback(async (observationText: string) => {
    if (sealing) return;
    setSealing(true);
    try {
      await fetch(getAbsoluteUrl("/api/sovereign/audits"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id:              `OBS-${Date.now().toString(36).toUpperCase()}`,
          authority:       observationAnalysis?.inferredDomainFull ?? "Pathfinder Observation",
          asset:           observationAnalysis?.inferredDomain ?? "OBSERVATION",
          price:           "0",
          packetId:        `PKT-${Date.now().toString(36).toUpperCase()}`,
          operatorEmail:   "operator@pathfinder.local",
          logs: [
            observationText,
            `Pattern: ${observationAnalysis?.pattern || "none"}`,
            `Domain: ${observationAnalysis?.inferredDomainFull || "none"}`,
            `Confidence: ${observationAnalysis?.confidence ?? 0}%`,
            `RAPIDS: ${observationAnalysis?.rapidsCompression || "none"}`,
          ],
          signature:        `OBS-SIG-${Date.now()}`,
          verified:         true,
          operatorDecision: "APPROVED",
          divergenceState:  "ALIGNED",
          divergenceDelta:  0,
        }),
      });
      setSealedFlash(true);
      setTimeout(() => setSealedFlash(false), 2500);
    } catch { /* preserve flash state */ } finally { setSealing(false); }
  }, [sealing, observationAnalysis]);

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  // Lazy-load field data the first time the operator enters direct field mode
  useEffect(() => {
    if (appState !== "field") return;
    if (fieldEnteredRef.current) return;
    fieldEnteredRef.current = true;
    (async () => {
      const feed = await fetchLiveFeed("BTC");
      if (feed && selectedDomain === "FINANCE") triggerAnalysis(feed, "BTC");
      fetchDimensionFeeds("BTC");
    })();
  }, [appState]);

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

      {/* ── SPECTRA-7: Routed specialty — same Doctrine, same Ledger ────────── */}
      {appState === "spectra" && (
        <div className="flex-1 overflow-y-auto">
          <SpectraView onBack={() => setAppState("aperture")} />
        </div>
      )}

      {/* ── SPECTRA-7 entry point — visible on aperture screen ───────────────── */}
      {appState === "aperture" && (
        <button
          onClick={() => setAppState("spectra")}
          style={{
            position: "fixed",
            top: "16px",
            right: "16px",
            zIndex: 50,
            background: "rgba(232, 64, 90, 0.06)",
            border: "1px solid rgba(232, 64, 90, 0.25)",
            borderRadius: "4px",
            color: "rgba(232, 64, 90, 0.7)",
            fontFamily: "'Space Mono', monospace",
            fontSize: "9px",
            letterSpacing: "0.18em",
            padding: "7px 12px",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(232, 64, 90, 0.12)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(232, 64, 90, 0.5)";
            (e.currentTarget as HTMLButtonElement).style.color = "#e8405a";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(232, 64, 90, 0.06)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(232, 64, 90, 0.25)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(232, 64, 90, 0.7)";
          }}
        >
          SPECTRA-7 ↗
        </button>
      )}

      {appState !== "spectra" && <AnimatePresence mode="wait">

        {/* ── LEVEL 0: Observation aperture ─────────────────────────────────── */}
        {appState === "aperture" && (
          <ObservationAperture
            key="aperture"
            onSubmit={handleObservationSubmit}
            domain={hintedDomainId ? getDomain(hintedDomainId) : undefined}
            onFieldMode={() => {
              hintedDomainApiRef.current = null;
              setHintedDomainId(null);
              setAppState("field");
            }}
          />
        )}

        {/* ── AETHER GATE: uncertainty map → retrieval requirement packet ─────── */}
        {appState === "aether" && (
          <AetherGate
            key="aether"
            observation={rawObservation}
            packet={aetherPacket}
            onProceed={() => setAppState("coverage")}
            onNewObservation={() => {
              setAetherPacket(null);
              setCoverageReport(null);
              setObservationAnalysis(null);
              setAnalysisReady(false);
              hintedDomainApiRef.current = null;
              setHintedDomainId(null);
              setAppState("aperture");
            }}
          />
        )}

        {/* ── COVERAGE GATE: domain / authorities / sources / coverage % ──────── */}
        {appState === "coverage" && (
          <CoverageGate
            key="coverage"
            observation={rawObservation}
            report={coverageReport}
            aetherPacket={aetherPacket}
            analysisReady={analysisReady}
            onViewAnalysis={() => setAppState("result")}
            onNewObservation={() => {
              setCoverageReport(null);
              setObservationAnalysis(null);
              setAetherPacket(null);
              setAnalysisReady(false);
              hintedDomainApiRef.current = null;
              setHintedDomainId(null);
              setAppState("aperture");
            }}
          />
        )}

        {/* ── LEVELS 1–4: Observation result ────────────────────────────────── */}
        {appState === "result" && observationAnalysis && (
          <ObservationResult
            key="result"
            analysis={observationAnalysis}
            onNewObservation={() => {
              setObservationAnalysis(null);
              setAetherPacket(null);
              hintedDomainApiRef.current = null;
              setHintedDomainId(null);
              setAppState("aperture");
            }}
            onSeal={handleObservationSeal}
            sealing={sealing}
            sealedFlash={sealedFlash}
          />
        )}

        {/* ── FIELD: Direct market analysis (legacy path) ───────────────────── */}
        {appState === "field" && (
          <motion.div
            key="field"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <FieldBar
              liveFeed={liveFeed}
              feedLoading={feedLoading}
              analysisLoading={analysisLoading}
              onRefresh={() => { fetchLiveFeed(); if (liveFeed) triggerAnalysis(liveFeed, selectedAsset); }}
              mode={mode}
              setMode={setMode}
              selectedAsset={selectedAsset}
              onAssetChange={handleAssetChange}
              selectedDomain={selectedDomain}
              onDomainChange={setSelectedDomain}
              onObserve={() => setAppState("aperture")}
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
                  <AnimatePresence mode="wait">
                    {selectedDomain !== "FINANCE" ? (
                      <DomainStandby
                        key={selectedDomain}
                        domain={getDomain(selectedDomain)}
                        observeLabel={selectedDomain === "ASTROPHYSICS" ? "ENTER SPECTRA-7 →" : undefined}
                        onObserve={() => {
                          if (selectedDomain === "ASTROPHYSICS") {
                            setAppState("spectra");
                          } else {
                            hintedDomainApiRef.current = DOMAIN_API_MAP[selectedDomain];
                            setHintedDomainId(selectedDomain);
                            setAppState("aperture");
                          }
                        }}
                      />
                    ) : (
                      <motion.div
                        key="finance"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
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
                          style={{ gridTemplateColumns: "1fr 360px 340px" }}
                        >
                          <RapidsAperture
                            dimensions={analysis?.dimensions || []}
                            loading={analysisLoading}
                            rapidsCompression={analysis?.rapidsCompression || ""}
                          />
                          <DimensionStack
                            dimensions={analysis?.dimensions || []}
                            loading={analysisLoading}
                            rapidsCompression={analysis?.rapidsCompression || ""}
                            feeds={dimensionFeeds}
                            assetKey={selectedAsset}
                            assetLabel={getAsset(selectedAsset).label}
                          />
                          <SimonPanel
                            pattern={analysis?.pattern || ""}
                            findings={analysis?.findings || []}
                            simonSummary={analysis?.simonSummary || ""}
                            loading={analysisLoading}
                            dimensions={analysis?.dimensions || []}
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
                              assetKey={selectedAsset}
                              assetLabel={getAsset(selectedAsset).label}
                            />
                          )}
                          {augmentTab === "intel" && (
                            <SimonPanel
                              pattern={analysis?.pattern || ""}
                              findings={analysis?.findings || []}
                              simonSummary={analysis?.simonSummary || ""}
                              loading={analysisLoading}
                              dimensions={analysis?.dimensions || []}
                            />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                        No observations sealed yet.
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
          </motion.div>
        )}

      </AnimatePresence>}

    </div>
  );
}

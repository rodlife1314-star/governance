import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Shield, Database, AlertTriangle, CheckCircle2, Lock, XCircle, AlertCircle, Link2 } from "lucide-react";
import { CoverageReport, AuthorityRecord, DataSourceRecord, AetherRequirementPacket, PacketDrivenAuthority } from "../augment-types";

interface CoverageGateProps {
  observation: string;
  report: CoverageReport | null;
  aetherPacket: AetherRequirementPacket | null;
  analysisReady: boolean;
  onViewAnalysis: () => void;
  onNewObservation: () => void;
}

const TIER_DOT: Record<string, string> = {
  primary:    "#E0AF68",
  regulatory: "#64D2FF",
  reference:  "#8A9DB0",
  standard:   "#7B8CDE",
  glossary:   "#9B8CDE",
};

function coverageColor(pct: number): string {
  if (pct >= 70) return "#4CD964";
  if (pct >= 40) return "#E0AF68";
  return "#FF6B6B";
}

// ── Packet-driven authority row (RAPIDS consumed AETHER's chain) ───────────

interface PacketAuthorityRowProps {
  auth: PacketDrivenAuthority;
  index: number;
  isAdded: boolean;
  isAdding: boolean;
  onAdd: () => void;
}

function PacketAuthorityRow({ auth, index, isAdded, isAdding, onAdd }: PacketAuthorityRowProps) {
  const dot = TIER_DOT[auth.tier] ?? "#8A9DB0";
  const registered = auth.inRegistry || isAdded;

  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="flex items-start gap-2.5 py-2 border-b border-white/[0.03] last:border-0"
    >
      <div className="shrink-0 mt-0.5">
        {registered
          ? <CheckCircle2 className="w-3 h-3 text-[#4CD964]" />
          : <AlertCircle   className="w-3 h-3 text-[#E0AF68]/50" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <span className="text-[10px] font-mono font-bold text-white/85">{auth.shortName}</span>
          <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: dot }} />
          <span className="text-[7px] font-mono uppercase tracking-wider" style={{ color: dot, opacity: 0.7 }}>
            {auth.tier}
          </span>
          {auth.url && (
            <a href={auth.url} target="_blank" rel="noopener noreferrer"
               className="text-[#3A4555] hover:text-[#5A6575] transition-colors">
              <Link2 className="w-2.5 h-2.5" />
            </a>
          )}
          {registered ? (
            <span className={`text-[7px] font-mono ml-auto shrink-0 ${isAdded && !auth.inRegistry ? "text-[#4CD964]" : "text-[#4CD964]/60"}`}>
              {isAdded && !auth.inRegistry ? "ADDED TO REGISTRY" : "IN REGISTRY"}
            </span>
          ) : isAdding ? (
            <motion.span
              className="text-[7px] font-mono text-[#5E8FFF]/60 ml-auto shrink-0"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              ADDING…
            </motion.span>
          ) : (
            <div className="flex items-center gap-1.5 ml-auto shrink-0">
              <span className="text-[7px] font-mono text-[#E0AF68]/50">NOT REGISTERED</span>
              <button
                onClick={onAdd}
                className="text-[7px] font-mono text-[#5E8FFF]/60 hover:text-[#5E8FFF] border border-[#5E8FFF]/20 hover:border-[#5E8FFF]/40 px-1.5 py-0.5 rounded transition-all cursor-pointer"
              >
                + ADD
              </button>
            </div>
          )}
        </div>
        <div className="text-[8px] font-mono text-[#4A5568] leading-relaxed">{auth.aetherReason}</div>
      </div>
    </motion.div>
  );
}

// ── Legacy DB-registry row ─────────────────────────────────────────────────

function AuthorityRow({ a }: { a: AuthorityRecord }) {
  const dot = TIER_DOT[a.tier] ?? "#8A9DB0";
  const label = (a.tier ?? "").toUpperCase();
  return (
    <div className="flex items-center gap-2 py-1 border-b border-white/[0.03] last:border-0">
      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dot }} />
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-mono text-white/80 font-bold">{a.shortName}</span>
        <span className="text-[9px] font-mono text-[#4A5568] ml-1.5 hidden sm:inline">{a.jurisdiction}</span>
      </div>
      <div className="text-[7px] font-mono tracking-wider shrink-0" style={{ color: dot, opacity: 0.7 }}>
        {label}
      </div>
    </div>
  );
}

function SourceRow({ s }: { s: DataSourceRecord }) {
  const live = !s.authRequired;
  return (
    <div className="flex items-center gap-2 py-1 border-b border-white/[0.03] last:border-0">
      <div className="shrink-0">
        {live
          ? <CheckCircle2 className="w-3 h-3 text-[#4CD964]" />
          : <Lock          className="w-3 h-3 text-[#E0AF68]/60" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-mono font-bold" style={{ color: live ? "#FFFFFF" : "#6B7B8E" }}>
          {s.shortName}
        </span>
        <span className="text-[8px] font-mono text-[#3A4555] ml-1.5">{s.updateFrequency}</span>
      </div>
      <div className={`text-[7px] font-mono tracking-wider shrink-0 ${live ? "text-[#4CD964]/60" : "text-[#E0AF68]/50"}`}>
        {live ? "LIVE" : "AUTH REQ"}
      </div>
    </div>
  );
}

function CoverageBar({ pct }: { pct: number }) {
  const color = coverageColor(pct);
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[8px] font-mono text-[#4A5568] uppercase tracking-wider">Source Coverage</span>
        <span className="text-[11px] font-mono font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
        />
      </div>
    </div>
  );
}

function SkeletonBlock({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className="h-5 bg-white/[0.04] rounded"
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
          style={{ width: `${70 + (i % 3) * 10}%` }}
        />
      ))}
    </div>
  );
}

export default function CoverageGate({
  observation,
  report,
  aetherPacket,
  analysisReady,
  onViewAnalysis,
  onNewObservation,
}: CoverageGateProps) {
  const packetAuthorities = report?.packetDrivenAuthorities;
  const isPacketDriven    = !!packetAuthorities;

  // ── Registry growth state: tracks operator-approved RAPIDS discoveries ──
  const [addedToRegistry, setAddedToRegistry] = useState<Set<string>>(new Set());
  const [addingToRegistry, setAddingToRegistry] = useState<Set<string>>(new Set());

  const handleAddToRegistry = useCallback(async (auth: PacketDrivenAuthority) => {
    if (!report) return;
    const key = auth.shortName.toLowerCase();
    setAddingToRegistry(prev => new Set([...prev, key]));
    try {
      const r = await fetch("/api/authorities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain:      report.domain,
          name:        auth.name,
          shortName:   auth.shortName,
          url:         auth.url,
          tier:        auth.tier,
          sourceType:  auth.tier,
          description: auth.aetherReason,
          jurisdiction: "International",
          sortOrder:   99,
        }),
      });
      if (r.ok) setAddedToRegistry(prev => new Set([...prev, key]));
    } finally {
      setAddingToRegistry(prev => { const s = new Set(prev); s.delete(key); return s; });
    }
  }, [report]);

  const allLegacyAuthorities: AuthorityRecord[] = report && !isPacketDriven
    ? [
        ...report.authorities.primary,
        ...report.authorities.regulatory,
        ...report.authorities.reference,
        ...report.authorities.standard,
        ...report.authorities.glossary,
      ]
    : [];

  const totalAuthorities = isPacketDriven ? (packetAuthorities?.length ?? 0) : allLegacyAuthorities.length;
  const registeredCount  = isPacketDriven ? (packetAuthorities?.filter(a => a.inRegistry).length ?? 0) : totalAuthorities;
  const newCount         = isPacketDriven ? (packetAuthorities?.filter(a => !a.inRegistry).length ?? 0) : 0;
  const totalSources     = report?.coverage.totalSources ?? 0;
  const coveragePct      = report?.coverage.coveragePct  ?? 0;
  const covColor         = coverageColor(coveragePct);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="flex-1 flex flex-col bg-[#07080B] overflow-hidden"
    >
      {/* ── Header ── */}
      <div className="shrink-0 border-b border-white/[0.05]">
        <div className="flex items-start justify-between px-4 md:px-6 py-3 gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <button
              onClick={onNewObservation}
              className="flex items-center gap-1 text-[8px] font-mono text-[#4A5568] hover:text-[#8A9DB0] transition-colors cursor-pointer mt-0.5 shrink-0"
            >
              <ArrowLeft className="w-2.5 h-2.5" />
              <span>OBSERVE</span>
            </button>
            <div className="min-w-0">
              <div className="text-[8px] font-mono text-[#4A5568] uppercase tracking-wider mb-0.5">
                OBSERVATION
              </div>
              <div className="text-[11px] font-mono text-white/70 leading-snug">
                "{observation.length > 80 ? observation.slice(0, 80) + "…" : observation}"
              </div>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[7px] font-mono text-[#4A5568] uppercase tracking-wider mb-0.5">PHASE</div>
            <div className="text-[9px] font-mono font-bold text-[#64D2FF]">RAPIDS · COVERAGE</div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-5">

          {/* AETHER context banner (if packet present) */}
          {aetherPacket && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="border border-[#5E8FFF]/15 rounded-lg p-4 bg-[#5E8FFF]/[0.02]"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <div className="text-[7px] font-mono text-[#5E8FFF]/60 uppercase tracking-[0.2em] mb-1">
                    AETHER → RAPIDS HANDOFF · {aetherPacket.domain}
                  </div>
                  <div className="text-[10px] font-mono font-bold text-white/70">
                    {aetherPacket.uncertaintyClass}
                  </div>
                </div>
                <div className="text-[7px] font-mono font-bold px-2 py-0.5 rounded shrink-0 bg-[#4CD96412] border border-[#4CD96425] text-[#4CD964]">
                  {isPacketDriven ? "PACKET CONSUMED" : "PACKET RECEIVED"}
                </div>
              </div>
              <div className="text-[9px] font-mono text-[#5A6575] leading-relaxed mb-3">
                {aetherPacket.uncertaintyStatement}
              </div>

              {/* Blocked authorities */}
              {aetherPacket.blockedAuthorities.length > 0 && (
                <div className="pt-2 border-t border-white/[0.04]">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <XCircle className="w-2.5 h-2.5 text-[#FF6B6B]/50" />
                    <span className="text-[7px] font-mono text-[#4A5568] uppercase tracking-[0.2em]">
                      BLOCKED · HERMES WILL NOT INGEST FROM THESE
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {aetherPacket.blockedAuthorities.map((b) => (
                      <div key={b.shortName} className="flex items-center gap-1">
                        <span className="text-[9px] font-mono font-bold text-[#FF6B6B]/50">{b.shortName}</span>
                        <span className="text-[8px] font-mono text-[#3A4455]">— {b.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Domain confirmed */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="border border-white/[0.07] rounded-lg p-4 bg-white/[0.015]"
          >
            <div className="text-[7px] font-mono text-[#4A5568] uppercase tracking-[0.2em] mb-2">
              Domain Routed
            </div>
            {report ? (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[18px] md:text-[22px] font-mono font-bold text-[#E0AF68] leading-tight">
                    {report.domain}
                  </div>
                  <div className="text-[9px] font-mono text-[#6B7B8E] mt-0.5">{report.domainFull}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[9px] font-mono text-[#4A5568] mb-0.5">Signal confidence</div>
                  <div
                    className="text-[20px] font-mono font-bold"
                    style={{ color: report.confidence >= 70 ? "#4CD964" : report.confidence >= 45 ? "#E0AF68" : "#FF6B6B" }}
                  >
                    {report.confidence}%
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <motion.div className="w-1.5 h-1.5 rounded-full bg-[#5E8FFF]"
                  animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity }} />
                <span className="text-[10px] font-mono text-[#4A5568]">
                  RAPIDS consuming AETHER packet — routing to domain registry…
                </span>
              </div>
            )}
          </motion.div>

          {/* ── Authority section ── */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.08 }}
          >
            {isPacketDriven && packetAuthorities ? (
              /* ── PACKET-DRIVEN: RAPIDS used AETHER's authority chain as search criteria ── */
              <div className="border border-[#5E8FFF]/15 rounded-lg p-4 bg-[#5E8FFF]/[0.01]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-[#5E8FFF]/50" />
                    <span className="text-[7px] font-mono text-[#4A5568] uppercase tracking-[0.2em]">
                      RAPIDS · Candidate Authorities
                    </span>
                    <span className="text-[7px] font-mono text-[#4A5568]">— filtered by AETHER requirement</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {registeredCount > 0 && (
                      <span className="text-[7px] font-mono text-[#4CD964]/70">
                        {registeredCount} registered
                      </span>
                    )}
                    {newCount > 0 && (
                      <span className="text-[7px] font-mono text-[#E0AF68]/60">
                        {newCount} new
                      </span>
                    )}
                  </div>
                </div>
                {packetAuthorities.length === 0 ? (
                  <div className="text-[9px] font-mono text-[#3A4555] italic">
                    All AETHER-identified authorities were blocked
                  </div>
                ) : (
                  <div>
                    {packetAuthorities.map((a, i) => (
                      <PacketAuthorityRow
                        key={a.shortName}
                        auth={a}
                        index={i}
                        isAdded={addedToRegistry.has(a.shortName.toLowerCase())}
                        isAdding={addingToRegistry.has(a.shortName.toLowerCase())}
                        onAdd={() => handleAddToRegistry(a)}
                      />
                    ))}
                  </div>
                )}
                <div className="mt-3 pt-2 border-t border-white/[0.04] text-[8px] font-mono text-[#3A4555] leading-relaxed">
                  RAPIDS searched against AETHER's authority chain.
                  Registered entries are in the domain registry.
                  New entries are AETHER-identified but not yet registered.
                </div>
              </div>
            ) : report ? (
              /* ── LEGACY: no packet, show DB registry ── */
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border border-white/[0.07] rounded-lg p-4 bg-white/[0.01]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3 h-3 text-[#E0AF68]/50" />
                      <span className="text-[7px] font-mono text-[#4A5568] uppercase tracking-[0.2em]">
                        Registered Authorities
                      </span>
                    </div>
                    <span className="text-[8px] font-mono text-[#3A4555]">{totalAuthorities} in registry</span>
                  </div>
                  {allLegacyAuthorities.length === 0 ? (
                    <div className="text-[9px] font-mono text-[#3A4555] italic">
                      No authorities registered for this domain yet
                    </div>
                  ) : (
                    <div>{allLegacyAuthorities.map(a => <AuthorityRow key={a.id} a={a} />)}</div>
                  )}
                </div>

                <div className="border border-white/[0.07] rounded-lg p-4 bg-white/[0.01]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <Database className="w-3 h-3 text-[#64D2FF]/50" />
                      <span className="text-[7px] font-mono text-[#4A5568] uppercase tracking-[0.2em]">
                        Data Sources
                      </span>
                    </div>
                    <span className="text-[8px] font-mono text-[#3A4555]">{totalSources} registered</span>
                  </div>
                  {totalSources === 0 ? (
                    <div className="text-[9px] font-mono text-[#3A4555] italic">
                      No data sources registered for this domain yet
                    </div>
                  ) : (
                    <div>{report.dataSources.map(s => <SourceRow key={s.id} s={s} />)}</div>
                  )}
                </div>
              </div>
            ) : (
              /* ── Loading skeleton ── */
              <div className="border border-white/[0.07] rounded-lg p-4 bg-white/[0.01]">
                <div className="flex items-center gap-1.5 mb-3">
                  <Shield className="w-3 h-3 text-[#5E8FFF]/30" />
                  <span className="text-[7px] font-mono text-[#4A5568] uppercase tracking-[0.2em]">
                    RAPIDS · Searching…
                  </span>
                </div>
                <SkeletonBlock lines={4} />
              </div>
            )}
          </motion.div>

          {/* Data sources (packet-driven mode: below authority list) */}
          {isPacketDriven && report && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="border border-white/[0.07] rounded-lg p-4 bg-white/[0.01]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-[#64D2FF]/50" />
                  <span className="text-[7px] font-mono text-[#4A5568] uppercase tracking-[0.2em]">Data Sources</span>
                </div>
                <span className="text-[8px] font-mono text-[#3A4555]">{totalSources} registered</span>
              </div>
              {totalSources === 0 ? (
                <div className="text-[9px] font-mono text-[#3A4555] italic">
                  No data sources registered for this domain yet
                </div>
              ) : (
                <div>{report.dataSources.map(s => <SourceRow key={s.id} s={s} />)}</div>
              )}
            </motion.div>
          )}

          {/* Coverage bar + gaps */}
          <AnimatePresence>
            {report && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, delay: 0.15 }}
                className="border border-white/[0.07] rounded-lg p-4 bg-white/[0.01]"
              >
                <CoverageBar pct={coveragePct} />

                <div className="mt-3 flex items-center gap-4 text-[8px] font-mono">
                  <span style={{ color: "#4CD964" }}>
                    ✓ {report.coverage.liveSources} source{report.coverage.liveSources !== 1 ? "s" : ""} immediately available
                  </span>
                  {report.coverage.gatedSources > 0 && (
                    <span style={{ color: "#E0AF68" }}>
                      ⚠ {report.coverage.gatedSources} require authentication
                    </span>
                  )}
                </div>

                {report.coverage.gaps.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-2.5 h-2.5 text-[#E0AF68]/50" />
                      <span className="text-[7px] font-mono text-[#4A5568] uppercase tracking-wider">
                        What is missing
                      </span>
                    </div>
                    {report.coverage.gaps.map((gap, i) => (
                      <div key={i} className="text-[8px] font-mono text-[#5A6575] pl-4">· {gap}</div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* ── Footer ── */}
      <div className="shrink-0 border-t border-white/[0.05] bg-[#07080B]">
        <div className="px-4 md:px-6 py-3 flex items-center justify-between gap-4">

          {/* Coverage / authority badge */}
          <AnimatePresence mode="wait">
            {report ? (
              <motion.div key="badge" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                {isPacketDriven ? (
                  <>
                    <div
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded border text-[8px] font-mono font-bold tracking-wider"
                      style={{ borderColor: "#5E8FFF30", backgroundColor: "#5E8FFF08", color: "#5E8FFF" }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-[#5E8FFF]" />
                      <span>RAPIDS · {totalAuthorities} CANDIDATE{totalAuthorities !== 1 ? "S" : ""}</span>
                    </div>
                    <span className="text-[7px] font-mono text-[#3A4555]">
                      {registeredCount} registered · {newCount} new
                    </span>
                  </>
                ) : (
                  <>
                    <div
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded border text-[8px] font-mono font-bold tracking-wider"
                      style={{
                        borderColor: `${covColor}30`,
                        backgroundColor: `${covColor}08`,
                        color: covColor,
                      }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: covColor }} />
                      <span>{coveragePct}% COVERAGE</span>
                    </div>
                    <span className="text-[7px] font-mono text-[#3A4555]">
                      {totalAuthorities} authorit{totalAuthorities !== 1 ? "ies" : "y"} · {totalSources} source{totalSources !== 1 ? "s" : ""}
                    </span>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div key="badge-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-1 h-1 rounded-full bg-[#5E8FFF]/40"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                ))}
                <span className="text-[8px] font-mono text-[#3A4555]">RAPIDS searching…</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SIMON ready / waiting */}
          <AnimatePresence mode="wait">
            {analysisReady ? (
              <motion.button
                key="ready"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={onViewAnalysis}
                className="flex items-center gap-2 px-5 py-2 rounded border border-[#E0AF68]/40 bg-[#E0AF68]/10 text-[#E0AF68] font-mono text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-[#E0AF68]/15 transition-all cursor-pointer"
              >
                <span>VIEW ANALYSIS</span>
                <ArrowRight className="w-3 h-3" />
              </motion.button>
            ) : (
              <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div key={i} className="w-1 h-1 rounded-full bg-[#E0AF68]"
                    animate={{ opacity: [0.1, 0.9, 0.1] }}
                    transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2 }} />
                ))}
                <span className="text-[8px] font-mono text-[#4A5568] tracking-wider">SIMON ANALYZING</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

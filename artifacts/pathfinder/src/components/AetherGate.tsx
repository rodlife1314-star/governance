import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, XCircle, Link2 } from "lucide-react";
import { AetherRequirementPacket, AetherEvidenceItem, AetherAuthorityLink, AetherBlockedAuthority } from "../augment-types";

interface AetherGateProps {
  observation: string;
  packet: AetherRequirementPacket | null;
  onProceed: () => void;
  onNewObservation: () => void;
}

const DOMAIN_ACCENT: Record<string, string> = {
  finance:      "#E0AF68",
  medicine:     "#4CD964",
  law:          "#BF7AF0",
  technology:   "#64D2FF",
  astrophysics: "#5E8FFF",
};

function domainAccent(domain: string): string {
  const key = domain.toLowerCase();
  for (const [k, v] of Object.entries(DOMAIN_ACCENT)) {
    if (key.includes(k)) return v;
  }
  return "#E0AF68";
}

const TIER_DOT: Record<string, string> = {
  primary:   "#E0AF68",
  reference: "#64D2FF",
  standard:  "#8A9DB0",
};

const EVIDENCE_ICON: Record<string, string> = {
  observation: "OBS",
  record:      "REC",
  measurement: "MSR",
  model:       "MDL",
  catalog:     "CAT",
};

function SkeletonBlock({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className="h-4 bg-white/[0.04] rounded"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
          style={{ width: `${60 + (i % 4) * 10}%` }}
        />
      ))}
    </div>
  );
}

function EvidenceItem({ item, accent, index }: { item: AetherEvidenceItem; accent: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06 }}
      className="flex items-start gap-3 py-2 border-b border-white/[0.04] last:border-0"
    >
      <div
        className="text-[7px] font-mono font-bold shrink-0 mt-0.5 px-1.5 py-0.5 rounded"
        style={{ backgroundColor: `${accent}15`, color: `${accent}90`, border: `1px solid ${accent}20` }}
      >
        {EVIDENCE_ICON[item.evidenceType] ?? "EV"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-mono font-bold text-white/80 mb-0.5">{item.label}</div>
        <div className="text-[9px] font-mono text-[#5A6575] leading-relaxed">{item.description}</div>
      </div>
    </motion.div>
  );
}

function AuthorityRow({ auth, index }: { auth: AetherAuthorityLink; index: number }) {
  const dot = TIER_DOT[auth.tier] ?? "#8A9DB0";
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: 0.1 + index * 0.06 }}
      className="flex items-start gap-3 py-2 border-b border-white/[0.03] last:border-0"
    >
      <div className="flex items-center gap-1.5 shrink-0 mt-1">
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dot }} />
        <span className="text-[7px] font-mono uppercase tracking-wider" style={{ color: dot, opacity: 0.7 }}>
          {auth.tier}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-mono font-bold text-white/85">{auth.shortName}</span>
          <a
            href={auth.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#3A4555] hover:text-[#5A6575] transition-colors"
          >
            <Link2 className="w-2.5 h-2.5" />
          </a>
        </div>
        <div className="text-[9px] font-mono text-[#4A5568] leading-relaxed">{auth.reason}</div>
      </div>
    </motion.div>
  );
}

function BlockedRow({ auth, index }: { auth: AetherBlockedAuthority; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: 0.15 + index * 0.06 }}
      className="flex items-start gap-3 py-2 border-b border-white/[0.03] last:border-0"
    >
      <XCircle className="w-3.5 h-3.5 text-[#FF6B6B]/50 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-mono font-bold text-[#FF6B6B]/60">{auth.shortName}</span>
          <a
            href={auth.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#3A4555] hover:text-[#5A6575] transition-colors"
          >
            <Link2 className="w-2.5 h-2.5" />
          </a>
        </div>
        <div className="text-[9px] font-mono text-[#4A4555] leading-relaxed">{auth.reason}</div>
      </div>
    </motion.div>
  );
}

export default function AetherGate({ observation, packet, onProceed, onNewObservation }: AetherGateProps) {
  const accent = packet ? domainAccent(packet.domain) : "#E0AF68";
  const isReady = packet?.retrievalStatus === "READY_FOR_RAPIDS";

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
            <div className="text-[7px] font-mono text-[#4A5568] uppercase tracking-wider mb-0.5">
              COGNITIVE LAYER
            </div>
            <div className="text-[9px] font-mono font-bold" style={{ color: accent }}>
              AETHER
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-5">

          {/* Domain + Uncertainty */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="border border-white/[0.07] rounded-lg p-4 bg-white/[0.015]"
          >
            {packet ? (
              <>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div
                      className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase mb-1"
                      style={{ color: accent }}
                    >
                      {packet.domain}
                    </div>
                    <div className="text-[13px] font-mono font-bold text-white leading-tight">
                      {packet.subDomain}
                    </div>
                  </div>
                  <div
                    className="text-[8px] font-mono font-bold px-2 py-1 rounded shrink-0"
                    style={{
                      backgroundColor: isReady ? "#4CD96415" : "#FF6B6B15",
                      border: `1px solid ${isReady ? "#4CD96430" : "#FF6B6B30"}`,
                      color: isReady ? "#4CD964" : "#FF6B6B",
                    }}
                  >
                    {packet.retrievalStatus.replace(/_/g, " ")}
                  </div>
                </div>
                <div className="border-t border-white/[0.05] pt-3">
                  <div className="text-[7px] font-mono text-[#4A5568] uppercase tracking-[0.2em] mb-1.5">
                    UNCERTAINTY CLASS
                  </div>
                  <div
                    className="text-[11px] font-mono font-bold mb-2"
                    style={{ color: accent }}
                  >
                    {packet.uncertaintyClass}
                  </div>
                  <div className="text-[10px] font-mono text-[#6B7B8E] leading-relaxed">
                    {packet.uncertaintyStatement}
                  </div>
                </div>
              </>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: accent }}
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                    />
                  ))}
                  <span className="text-[9px] font-mono text-[#4A5568]">AETHER · MAPPING UNCERTAINTY</span>
                </div>
                <SkeletonBlock lines={3} />
              </div>
            )}
          </motion.div>

          {/* Needed Evidence */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.06 }}
            className="border border-white/[0.07] rounded-lg p-4 bg-white/[0.01]"
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: `${accent}60` }}
              />
              <span className="text-[7px] font-mono text-[#4A5568] uppercase tracking-[0.2em]">
                NEEDED EVIDENCE · RAPIDS RETRIEVAL TARGET
              </span>
            </div>
            {packet ? (
              packet.neededEvidence.length === 0 ? (
                <div className="text-[9px] font-mono text-[#3A4555] italic">No evidence requirements generated</div>
              ) : (
                <div>
                  {packet.neededEvidence.map((item, i) => (
                    <EvidenceItem key={item.id} item={item} accent={accent} index={i} />
                  ))}
                </div>
              )
            ) : (
              <SkeletonBlock lines={4} />
            )}
          </motion.div>

          {/* Authority Chain + Blocked — two column */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.12 }}
            className="grid md:grid-cols-2 gap-4"
          >
            {/* Authority Chain */}
            <div className="border border-white/[0.07] rounded-lg p-4 bg-white/[0.01]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#E0AF68]/50" />
                <span className="text-[7px] font-mono text-[#4A5568] uppercase tracking-[0.2em]">
                  AUTHORITY CHAIN
                </span>
              </div>
              {packet ? (
                packet.authorityChain.length === 0 ? (
                  <div className="text-[9px] font-mono text-[#3A4555] italic">No authorities identified</div>
                ) : (
                  <div>
                    {packet.authorityChain.map((auth, i) => (
                      <AuthorityRow key={auth.shortName} auth={auth} index={i} />
                    ))}
                  </div>
                )
              ) : (
                <SkeletonBlock lines={3} />
              )}
            </div>

            {/* Blocked Authorities */}
            <div className="border border-[#FF6B6B]/10 rounded-lg p-4 bg-[#FF6B6B]/[0.01]">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-3 h-3 text-[#FF6B6B]/40" />
                <span className="text-[7px] font-mono text-[#4A5568] uppercase tracking-[0.2em]">
                  BLOCKED AUTHORITIES
                </span>
              </div>
              {packet ? (
                packet.blockedAuthorities.length === 0 ? (
                  <div className="text-[9px] font-mono text-[#3A4555] italic">No authorities blocked for this observation</div>
                ) : (
                  <div>
                    {packet.blockedAuthorities.map((auth, i) => (
                      <BlockedRow key={auth.shortName} auth={auth} index={i} />
                    ))}
                  </div>
                )
              ) : (
                <SkeletonBlock lines={2} />
              )}
              {packet && packet.blockedAuthorities.length > 0 && (
                <div className="mt-3 pt-2 border-t border-white/[0.04]">
                  <div className="text-[8px] font-mono text-[#3A4455] leading-relaxed">
                    These authorities are excluded from RAPIDS retrieval for this observation.
                    HERMES will not ingest evidence from blocked sources.
                  </div>
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </div>

      {/* ── Footer: proceed ── */}
      <div className="shrink-0 border-t border-white/[0.05] bg-[#07080B]">
        <div className="px-4 md:px-6 py-3 flex items-center justify-between gap-4">

          {/* Chain status */}
          <AnimatePresence mode="wait">
            {packet ? (
              <motion.div
                key="ready"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: isReady ? "#4CD964" : "#FF6B6B" }}
                />
                <span className="text-[8px] font-mono text-[#4A5568]">
                  AETHER · {packet.authorityChain.length} authorit{packet.authorityChain.length !== 1 ? "ies" : "y"} approved
                  {packet.blockedAuthorities.length > 0 && ` · ${packet.blockedAuthorities.length} blocked`}
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 h-1 rounded-full"
                    style={{ backgroundColor: accent }}
                    animate={{ opacity: [0.1, 0.8, 0.1] }}
                    transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
                <span className="text-[8px] font-mono text-[#3A4555] tracking-wider">MAPPING UNCERTAINTY</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Proceed button */}
          <AnimatePresence mode="wait">
            {packet ? (
              <motion.button
                key="proceed"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={onProceed}
                className="flex items-center gap-2 px-5 py-3 md:py-2 rounded font-mono text-[10px] font-bold tracking-[0.2em] uppercase transition-all cursor-pointer"
                style={{
                  backgroundColor: `${accent}12`,
                  border: `1px solid ${accent}40`,
                  color: accent,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${accent}20`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${accent}12`;
                }}
              >
                <span>PROCEED TO RAPIDS</span>
                <ArrowRight className="w-3 h-3" />
              </motion.button>
            ) : (
              <motion.div
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 h-1 rounded-full"
                    style={{ backgroundColor: accent }}
                    animate={{ opacity: [0.1, 0.9, 0.1] }}
                    transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
                <span className="text-[8px] font-mono text-[#4A5568] tracking-wider">AETHER COMPUTING</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

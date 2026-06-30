import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LiveFeedData, DimensionalAnalysis } from "../augment-types";

interface AuditRecord {
  id: string;
  authority: string;
  asset: string;
  price: string;
  logs: string[];
  operatorDecision: string;
  createdAt: string;
}

interface ActionPanelProps {
  liveFeed: LiveFeedData | null;
  analysis: DimensionalAnalysis | null;
  auditRecords: AuditRecord[];
  auditLoading: boolean;
  onFetchAudits: () => void;
}

type Route = "ARCHIVE" | "ESCALATE" | "INVESTIGATE" | "DISMISSED";

const ROUTE_STYLES: Record<Route, string> = {
  ARCHIVE:     "border-[#E0AF68]/30 bg-[#E0AF68]/8 text-[#E0AF68]",
  ESCALATE:    "border-rose-500/30 bg-rose-500/8 text-rose-400",
  INVESTIGATE: "border-[#64D2FF]/30 bg-[#64D2FF]/8 text-[#64D2FF]",
  DISMISSED:   "border-white/[0.04] bg-white/[0.02] text-[#4A5568]",
};

const PRINCIPLES = [
  "Authority establishes truth.",
  "Observation precedes interpretation.",
  "Findings require evidence.",
  "Decisions require accountability.",
  "Operator sovereignty is absolute.",
];

export default function ActionPanel({
  liveFeed,
  analysis,
  auditRecords,
  auditLoading,
  onFetchAudits,
}: ActionPanelProps) {
  const [routes, setRoutes] = useState<Record<string, Route>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"queue" | "governance">("queue");

  const spot = liveFeed ? parseFloat(liveFeed.coinbaseSpotPrice) : null;
  const future = liveFeed ? parseFloat(liveFeed.cmeFuturePrice) : null;
  const basis = spot && future ? future - spot : null;
  const structure = basis !== null ? (basis >= 0 ? "CONTANGO" : "BACKWARDATION") : null;

  const topDimensions = (analysis?.dimensions || [])
    .filter(d => (d.contribution ?? 0) > 0)
    .sort((a, b) => (b.contribution ?? 0) - (a.contribution ?? 0))
    .slice(0, 3);

  const route = (id: string, r: Route) =>
    setRoutes(prev => ({ ...prev, [id]: r }));

  const selectedObs = auditRecords.find(a => a.id === selected);
  const selectedRoute = selected ? routes[selected] : undefined;

  const QueuePanel = (
    <div className="flex flex-col overflow-hidden flex-1">
      {/* Current State bar */}
      <div className="border-b border-white/[0.04] px-4 md:px-5 py-3 md:py-4 flex items-start justify-between gap-4 shrink-0">
        <div className="space-y-1 min-w-0">
          <div className="text-[9px] font-mono tracking-[0.25em] text-[#AAB4C2] uppercase">Current State</div>
          {liveFeed ? (
            <div className="flex items-center gap-2 font-mono flex-wrap">
              <span className="text-[11px] font-bold text-white">
                ${parseFloat(liveFeed.coinbaseSpotPrice).toLocaleString()}
              </span>
              {structure && (
                <span className={`text-[9px] font-bold ${basis! >= 0 ? "text-[#64D2FF]" : "text-rose-400"}`}>
                  {basis! >= 0 ? "+" : ""}{basis!.toFixed(0)} {structure}
                </span>
              )}
              <span className="text-[9px] text-[#6B7280]">·</span>
              <span className="text-[9px] text-[#8A9DB0]">{liveFeed.source}</span>
            </div>
          ) : (
            <div className="text-[9px] font-mono text-[#6B7280]">Field acquiring…</div>
          )}
          {analysis?.pattern && (
            <div className="text-[9px] font-mono text-[#9BA5B3] leading-relaxed max-w-lg">
              {analysis.pattern}
            </div>
          )}
        </div>
        {topDimensions.length > 0 && (
          <div className="shrink-0 hidden sm:flex items-center gap-4">
            {topDimensions.map(d => (
              <div key={d.name} className="text-right">
                <div className="text-[8px] font-mono text-[#6B7280] uppercase tracking-wider">{d.name.split("/")[0].trim()}</div>
                <div className={`text-[10px] font-mono font-bold ${(d.contribution ?? 0) > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {d.contribution != null ? `${d.contribution > 0 ? "+" : ""}${d.contribution.toFixed(1)}%` : "—"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Queue header */}
      <div className="px-4 md:px-5 py-2.5 md:py-3 border-b border-white/[0.04] flex items-center justify-between shrink-0">
        <div>
          <div className="text-[9px] font-mono tracking-[0.25em] text-[#AAB4C2] uppercase mb-0.5">Decision Queue</div>
          <div className="text-[10px] font-mono font-semibold text-white">
            {auditRecords.length} observation{auditRecords.length !== 1 ? "s" : ""} sealed
          </div>
        </div>
        <button
          onClick={onFetchAudits}
          disabled={auditLoading}
          className="text-[8.5px] font-mono text-[#5A6575] hover:text-white transition-all border border-white/[0.04] px-2 py-1 rounded cursor-pointer"
        >
          {auditLoading ? "SYNCING…" : "SYNC"}
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 md:px-5 py-3 md:py-4 space-y-2">
        {auditRecords.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <div className="text-[10px] font-mono text-[#6B7280]">No observations sealed yet.</div>
            <div className="text-[9px] font-mono text-[#5A6575]">
              Go to AUGMENT → OPERATOR CHANNEL.<br />
              Seal an observation to begin the governance chain.
            </div>
          </div>
        ) : (
          auditRecords.map((obs) => {
            const r = routes[obs.id];
            const isSelected = selected === obs.id;
            return (
              <motion.div
                key={obs.id}
                layout
                onClick={() => setSelected(isSelected ? null : obs.id)}
                className={`border rounded-lg p-3 md:p-4 cursor-pointer transition-all ${
                  isSelected
                    ? "border-white/[0.12] bg-white/[0.03]"
                    : "border-white/[0.04] hover:border-white/[0.08]"
                }`}
              >
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {r ? (
                      <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border ${ROUTE_STYLES[r]}`}>{r}</span>
                    ) : (
                      <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border border-amber-500/20 bg-amber-500/8 text-amber-400">PENDING</span>
                    )}
                    <span className="text-[9px] font-mono text-[#6B7280]">{obs.id}</span>
                  </div>
                  <div className="text-right text-[9px] font-mono text-[#5A6575] shrink-0">
                    {new Date(obs.createdAt).toLocaleTimeString()}
                  </div>
                </div>

                <div className="text-[9.5px] font-mono text-[#C4CDD8] leading-relaxed mb-2">
                  {obs.logs[0] || "No operator note."}
                </div>

                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 border-t border-white/[0.04] space-y-2">
                        <div className="text-[8.5px] font-mono text-[#6B7280] uppercase tracking-wider">Route this observation</div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {(["ARCHIVE", "ESCALATE", "INVESTIGATE", "DISMISSED"] as Route[]).map((rt) => (
                            <button
                              key={rt}
                              onClick={(e) => { e.stopPropagation(); route(obs.id, rt); }}
                              className={`text-[8px] font-mono font-bold px-2 py-1 rounded border cursor-pointer transition-all ${
                                r === rt ? ROUTE_STYLES[rt] : "border-white/[0.06] text-[#5A6575] hover:text-white hover:border-white/[0.12]"
                              }`}
                            >
                              → {rt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );

  const GovernancePanel = (
    <div className="flex flex-col overflow-y-auto">
      {/* Impact */}
      <div className="border-b border-white/[0.04] px-4 md:px-5 py-4 md:py-5 space-y-3">
        <div className="text-[9px] font-mono tracking-[0.25em] text-[#AAB4C2] uppercase">Impact</div>
        {selectedObs && selectedRoute ? (
          <div className="space-y-2">
            <div className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border w-fit ${ROUTE_STYLES[selectedRoute]}`}>
              {selectedRoute}
            </div>
            <div className="space-y-1.5 text-[9px] font-mono text-[#8A9DB0]">
              {selectedRoute === "ARCHIVE" && <><div>→ Preserved in sovereign ledger</div><div>→ Authority chain recorded</div><div>→ Operator signature applied</div></>}
              {selectedRoute === "ESCALATE" && <><div>→ Flagged for senior review</div><div>→ Observation elevated in ledger</div><div>→ Authority notification queued</div></>}
              {selectedRoute === "INVESTIGATE" && <><div>→ Queued for deeper analysis</div><div>→ Pattern comparison triggered</div><div>→ RAPIDS re-evaluation requested</div></>}
              {selectedRoute === "DISMISSED" && <><div>→ Removed from active queue</div><div>→ Retained in archive</div><div>→ Operator decision recorded</div></>}
            </div>
          </div>
        ) : (
          <div className="text-[9px] font-mono text-[#6B7280]">
            {selectedObs ? "Select a route to see impact." : "Select an observation to route it."}
          </div>
        )}
      </div>

      {/* Governance chain */}
      <div className="border-b border-white/[0.04] px-4 md:px-5 py-4 md:py-5 space-y-3">
        <div className="text-[9px] font-mono tracking-[0.25em] text-[#AAB4C2] uppercase">Governance Chain</div>
        {[
          { label: "OBSERVATION", desc: "Operator sees" },
          { label: "AUTHORITY",   desc: "Truth validated" },
          { label: "FINDING",     desc: "Evidence gathered" },
          { label: "DECISION",    desc: "Operator decides" },
          { label: "AUDIT",       desc: "Record sealed" },
        ].map((step, i, arr) => (
          <div key={step.label} className="flex items-start gap-3">
            <div className="flex flex-col items-center shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3A4555] mt-0.5" />
              {i < arr.length - 1 && <div className="w-px h-5 bg-white/[0.04] mt-1" />}
            </div>
            <div>
              <div className="text-[8.5px] font-mono font-bold text-[#9BA5B3] tracking-wider">{step.label}</div>
              <div className="text-[8px] font-mono text-[#6B7280]">{step.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Principles */}
      <div className="px-4 md:px-5 py-4 md:py-5 space-y-3">
        <div className="text-[9px] font-mono tracking-[0.25em] text-[#AAB4C2] uppercase">Principles</div>
        {PRINCIPLES.map((p, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="text-[8px] font-mono text-[#4A5568] shrink-0 mt-[1px]">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-[9px] font-mono text-[#8A9DB0] leading-relaxed">{p}</span>
          </div>
        ))}
        <div className="pt-3 border-t border-white/[0.03]">
          <div className="text-[8px] font-mono text-[#5A6575] leading-relaxed italic">
            The system does not replace judgement.<br />
            It augments judgement through structure.
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: side-by-side */}
      <div className="hidden md:grid flex-1 overflow-hidden" style={{ gridTemplateColumns: "1fr 300px" }}>
        <div className="border-r border-white/[0.04] flex flex-col overflow-hidden">
          {QueuePanel}
        </div>
        <div className="flex flex-col overflow-y-auto">
          {GovernancePanel}
        </div>
      </div>

      {/* Mobile: tabbed */}
      <div className="md:hidden flex-1 flex flex-col overflow-hidden">
        {/* Tab strip */}
        <div className="flex border-b border-white/[0.04] shrink-0">
          {([["queue", "DECISIONS"], ["governance", "GOVERNANCE"]] as [typeof mobileTab, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setMobileTab(id)}
              className={`flex-1 py-2.5 text-[9px] font-mono font-bold tracking-[0.2em] cursor-pointer transition-all border-b-2 ${
                mobileTab === id ? "text-white border-[#E0AF68]" : "text-[#5A6575] border-transparent hover:text-[#8A9DB0]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Panel */}
        {mobileTab === "queue"
          ? <div className="flex-1 flex flex-col overflow-hidden">{QueuePanel}</div>
          : <div className="flex-1 overflow-y-auto">{GovernancePanel}</div>
        }
      </div>
    </>
  );
}

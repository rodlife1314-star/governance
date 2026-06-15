import { motion, AnimatePresence } from "framer-motion";
import { DimensionEntry, Finding } from "../augment-types";

const DIM_SHORTLABELS: Record<string, string> = {
  dollar:        "DXY",
  realyields:    "YIELDS",
  instflows:     "INST.FL",
  futures:       "FUTURES",
  onchain:       "ONCHAIN",
  risksentiment: "VIX",
  commodity:     "WTI",
  geopolitics:   "GEO",
  technical:     "QQQ",
  liquidity:     "DEPTH",
};

function dimTag(dimensionId: string, dimensions?: DimensionEntry[]): string {
  const dim = dimensions?.find((d) => d.id === dimensionId);
  if (dim?.name.includes("/")) {
    return dim.name.split("/").pop()!.trim().slice(0, 8).toUpperCase();
  }
  return DIM_SHORTLABELS[dimensionId] ?? dimensionId.slice(0, 7).toUpperCase();
}

function directionColor(dimensionId: string, dimensions?: DimensionEntry[]): string {
  const dim = dimensions?.find((d) => d.id === dimensionId);
  if (dim?.direction === "positive") return "#4CD964";
  if (dim?.direction === "negative") return "#FF6B6B";
  return "#64D2FF";
}

interface SimonPanelProps {
  pattern: string;
  findings: Finding[];
  simonSummary: string;
  loading: boolean;
  dimensions?: DimensionEntry[];
}

export default function SimonPanel({ pattern, findings, simonSummary, loading, dimensions }: SimonPanelProps) {
  return (
    <div className="flex flex-col h-full border-l border-white/[0.04] bg-[#07080B] overflow-y-auto" id="simon-panel">

      {/* PATTERN */}
      <div className="px-5 pt-5 pb-4 border-b border-white/[0.04]">
        <div className="text-[9px] font-mono font-bold tracking-[0.25em] text-[#AAB4C2] uppercase mb-3">PATTERN</div>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading-pattern" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="space-y-2 animate-pulse">
                <div className="h-3 w-full bg-white/[0.06] rounded" />
                <div className="h-3 w-3/4 bg-white/[0.06] rounded" />
              </div>
            </motion.div>
          ) : pattern ? (
            <motion.div
              key={pattern}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-[13px] font-mono font-semibold text-white leading-relaxed"
            >
              {pattern}
            </motion.div>
          ) : (
            <div className="text-[10px] font-mono text-[#5A6575]">awaiting dimensional resolution</div>
          )}
        </AnimatePresence>
      </div>

      {/* FINDINGS */}
      <div className="px-5 pt-4 pb-4 border-b border-white/[0.04] flex-1">
        <div className="flex items-center space-x-2 mb-3">
          <div className="text-[9px] font-mono font-bold tracking-[0.25em] text-[#AAB4C2] uppercase">FINDINGS</div>
          <div className="flex-1 h-px bg-white/[0.05]" />
          <div className="text-[8px] font-mono text-[#5A6575]">lens · dimension</div>
        </div>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading-findings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex space-x-2">
                    <div className="w-[52px] h-2.5 bg-white/[0.06] rounded shrink-0" />
                    <div className="h-2.5 bg-white/[0.06] rounded flex-1" />
                  </div>
                ))}
              </div>
            </motion.div>
          ) : findings.length > 0 ? (
            <motion.div
              key={findings.map((f) => f.dimensionId).join("")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-3"
            >
              {findings.map((f, i) => {
                const tag   = dimTag(f.dimensionId, dimensions);
                const color = directionColor(f.dimensionId, dimensions);
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.3 }}
                    className="flex items-start space-x-2.5"
                  >
                    <span
                      className="text-[8px] font-mono font-bold tracking-[0.12em] shrink-0 mt-0.5 w-[52px] text-right"
                      style={{ color }}
                    >
                      {tag}
                    </span>
                    <div className="w-px self-stretch shrink-0 mt-0.5" style={{ backgroundColor: `${color}30` }} />
                    <span className="text-[11px] font-mono text-[#E8EDF5] leading-relaxed">{f.text}</span>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="text-[10px] font-mono text-[#5A6575]">no findings yet</div>
          )}
        </AnimatePresence>
      </div>

      {/* SIMON */}
      <div className="px-5 pt-4 pb-5">
        <div className="flex items-center space-x-2 mb-3">
          <div className="text-[9px] font-mono font-bold tracking-[0.25em] text-[#AAB4C2] uppercase">SIMON</div>
          <div className="flex-1 h-px bg-white/[0.05]" />
          <div className="text-[8px] font-mono text-[#5A6575]">pattern · meaning · route</div>
        </div>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading-simon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="space-y-1.5 animate-pulse">
                <div className="h-2.5 bg-white/[0.05] rounded w-full" />
                <div className="h-2.5 bg-white/[0.05] rounded w-5/6" />
                <div className="h-2.5 bg-white/[0.05] rounded w-4/5" />
              </div>
            </motion.div>
          ) : simonSummary ? (
            <motion.div
              key={simonSummary}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-[10.5px] font-mono text-[#C8D0DB] leading-relaxed border-l-2 border-[#E0AF68]/40 pl-3"
            >
              {simonSummary}
            </motion.div>
          ) : (
            <div className="text-[10px] font-mono text-[#5A6575]">SIMON awaiting dimensions</div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DimensionEntry } from "../augment-types";

interface DimensionStackProps {
  dimensions: DimensionEntry[];
  loading: boolean;
  rapidsCompression: string;
}

const DIRECTION_COLOR: Record<string, string> = {
  positive: "#4CD964",
  negative: "#FF6B6B",
  neutral: "#E0AF68",
};

const DIRECTION_LABEL: Record<string, string> = {
  positive: "↑",
  neutral: "→",
  negative: "↓",
};

const EXPAND_LEVELS = [10, 20, 50, 100] as const;
type ExpandLevel = typeof EXPAND_LEVELS[number];

function DimensionRow({ dim, index, visible }: { dim: DimensionEntry; index: number; visible: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const color = DIRECTION_COLOR[dim.direction];
  const arrow = DIRECTION_LABEL[dim.direction];
  const barWidth = Math.min(100, dim.contribution);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.2, delay: index * 0.03 }}
          onClick={() => setExpanded(!expanded)}
          className="group cursor-pointer"
        >
          <div className="py-2.5 px-4 hover:bg-white/[0.015] transition-all border-b border-white/[0.025]">
            {/* Row header */}
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="flex items-baseline space-x-2.5 min-w-0">
                <span className="text-[9px] font-mono text-[#3A4555] w-4 shrink-0">{String(index + 1).padStart(2, "0")}</span>
                <span className="text-[10px] font-mono font-medium text-[#8A95A3] truncate">{dim.name}</span>
              </div>
              <div className="flex items-baseline space-x-1.5 shrink-0 ml-2">
                <span className="text-[9px] font-mono" style={{ color }}>{arrow}</span>
                <span className="text-[10px] font-mono font-bold" style={{ color }}>
                  {dim.contribution.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Contribution bar */}
            <div className="h-px bg-white/[0.03] rounded-full overflow-hidden mb-1.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${barWidth}%` }}
                transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.04 }}
                className="h-full rounded-full opacity-70"
                style={{ backgroundColor: color }}
              />
            </div>

            {/* Signal text */}
            <div className="text-[8.5px] font-mono text-[#3A4555] group-hover:text-[#5A6575] transition-colors truncate">
              {dim.signal}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SyntheticRow({ index, expandLevel }: { index: number; expandLevel: ExpandLevel }) {
  const syntheticNames = [
    "Funding Rate", "Options Skew", "Realized Vol", "Historical Basis",
    "Exchange Flows", "Miner Flows", "Stablecoin Ratio", "Derivatives OI",
    "Social Sentiment", "Search Volume", "Whale Alerts", "Lightning Network",
    "Hash Rate", "Difficulty Adj", "Mempool Backlog", "Fee Revenue",
    "Layer2 TVL", "DeFi Correlation", "NFT Market", "CBDC Signal",
    "Sovereign Demand", "Treasury Yield", "Corp Bond Spread", "Equity Correlation",
    "Carry Trade", "Repo Rate", "FX Volatility", "Commodities Index",
    "Energy Price", "Shipping CPI",
  ];
  const name = syntheticNames[index % syntheticNames.length] || `Signal ${index + 11}`;
  const fakeContrib = 2 + (Math.sin(index * 2.7) * 1.5);
  const dirs = ["positive", "negative", "neutral"];
  const dir = dirs[index % 3] as "positive" | "negative" | "neutral";
  const color = DIRECTION_COLOR[dir];

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 0.35, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      className="py-2 px-4 border-b border-white/[0.015]"
    >
      <div className="flex items-baseline justify-between mb-1">
        <div className="flex items-baseline space-x-2.5">
          <span className="text-[9px] font-mono text-[#2A3545] w-4 shrink-0">{String(index + 11).padStart(2, "0")}</span>
          <span className="text-[9px] font-mono text-[#5A6575]">{name}</span>
        </div>
        <span className="text-[9px] font-mono text-[#3A4555]">{fakeContrib.toFixed(1)}%</span>
      </div>
      <div className="h-px bg-white/[0.02] rounded-full overflow-hidden">
        <div className="h-full rounded-full opacity-30" style={{ backgroundColor: color, width: `${fakeContrib * 5}%` }} />
      </div>
    </motion.div>
  );
}

export default function DimensionStack({ dimensions, loading, rapidsCompression }: DimensionStackProps) {
  const [expandLevel, setExpandLevel] = useState<ExpandLevel>(10);

  const extraCount = expandLevel > 10 ? Math.min(expandLevel - 10, 30) : 0;

  return (
    <div className="flex flex-col h-full border-r border-white/[0.04] bg-[#07080B]" id="dimension-stack">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <span className="text-[9px] font-mono font-bold tracking-[0.2em] text-[#4A5568] uppercase">DIMENSIONS</span>
          {loading && (
            <span className="text-[8px] font-mono text-[#E0AF68] animate-pulse">RAPIDS ↓</span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          {EXPAND_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setExpandLevel(level)}
              className={`text-[8px] font-mono cursor-pointer px-1.5 py-0.5 rounded transition-all ${
                expandLevel === level
                  ? "text-[#E0AF68] bg-[#E0AF68]/10"
                  : "text-[#3A4555] hover:text-[#6B7280]"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Dimension rows */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading && dimensions.length === 0
          ? Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="py-3 px-4 border-b border-white/[0.025] animate-pulse">
                <div className="flex justify-between mb-1.5">
                  <div className="h-2 w-24 bg-white/[0.04] rounded" />
                  <div className="h-2 w-8 bg-white/[0.04] rounded" />
                </div>
                <div className="h-px bg-white/[0.03] rounded-full" />
              </div>
            ))
          : <>
              {dimensions.map((dim, i) => (
                <DimensionRow key={dim.id} dim={dim} index={i} visible={true} />
              ))}
              {expandLevel > 10 && Array.from({ length: extraCount }).map((_, i) => (
                <SyntheticRow key={`synth-${i}`} index={i} expandLevel={expandLevel} />
              ))}
            </>
        }
      </div>

      {/* RAPIDS compression footer */}
      <div className="px-4 py-2.5 border-t border-white/[0.04] shrink-0">
        <div className="text-[8px] font-mono text-[#3A4555] leading-relaxed">
          <span className="text-[#E0AF68]/40 mr-1.5">RAPIDS</span>
          {rapidsCompression || "awaiting field data"}
        </div>
      </div>
    </div>
  );
}

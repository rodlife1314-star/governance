import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DimensionEntry, FeedRecord, FeedStatus } from "../augment-types";

interface DimensionStackProps {
  dimensions: DimensionEntry[];
  loading: boolean;
  rapidsCompression: string;
  feeds?: FeedRecord[];
}

const DIRECTION_COLOR: Record<string, string> = {
  positive: "#4CD964",
  negative: "#FF6B6B",
  neutral:  "#E0AF68",
};

const DIRECTION_LABEL: Record<string, string> = {
  positive: "↑",
  neutral:  "→",
  negative: "↓",
};

const STATUS_CONFIG: Record<FeedStatus, { label: string; dot: string; text: string; bg: string; border: string }> = {
  live:        { label: "LIVE",      dot: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-400/8",  border: "border-emerald-400/20" },
  cached:      { label: "CACHED",    dot: "bg-[#E0AF68]",   text: "text-[#E0AF68]",  bg: "bg-[#E0AF68]/8",    border: "border-[#E0AF68]/20"   },
  degraded:    { label: "DEGRADED",  dot: "bg-amber-400",   text: "text-amber-400",  bg: "bg-amber-400/8",    border: "border-amber-400/20"   },
  unavailable: { label: "NO FEED",   dot: "bg-rose-500",    text: "text-rose-400",   bg: "bg-rose-500/8",     border: "border-rose-500/20"    },
};

function formatAge(fetchedAt: number): string {
  const s = Math.round((Date.now() - fetchedAt) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.round(m / 60)}h ago`;
}

function formatInterval(ms: number): string {
  if (!isFinite(ms)) return "—";
  if (ms < 60_000) return `${ms / 1000}s`;
  if (ms < 3_600_000) return `${ms / 60_000}m`;
  return `${ms / 3_600_000}h`;
}

function FeedStatusBadge({ status }: { status: FeedStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[7.5px] font-mono font-bold tracking-wider ${cfg.text} ${cfg.bg} ${cfg.border}`}>
      <span className={`w-1 h-1 rounded-full shrink-0 ${cfg.dot} ${status === "live" ? "animate-pulse" : ""}`} />
      {cfg.label}
    </span>
  );
}

function AuthorityPanel({ feed }: { feed: FeedRecord }) {
  const cfg = STATUS_CONFIG[feed.status];
  const dataTs = feed.dataTimestamp
    ? new Date(feed.dataTimestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "—";

  return (
    <div className={`mx-3 mb-2 rounded border ${cfg.border} ${cfg.bg} p-3 space-y-2`}>
      {/* Top row: authority + status */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[8px] font-mono text-[#4A5568] uppercase tracking-wider mb-0.5">Authority</div>
          {feed.authorityUrl ? (
            <a
              href={feed.authorityUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`text-[9px] font-mono ${cfg.text} hover:underline leading-tight block`}
            >
              {feed.authority}
            </a>
          ) : (
            <div className={`text-[9px] font-mono ${cfg.text}`}>{feed.authority}</div>
          )}
        </div>
        <FeedStatusBadge status={feed.status} />
      </div>

      {/* Value */}
      {feed.value !== null && (
        <div>
          <div className="text-[8px] font-mono text-[#4A5568] uppercase tracking-wider mb-0.5">Current Value</div>
          <div className="text-[9px] font-mono text-white leading-snug">{feed.valueLabel}</div>
        </div>
      )}

      {/* Timestamps + refresh */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        <div>
          <div className="text-[7.5px] font-mono text-[#3A4555] uppercase tracking-wider mb-0.5">Data Timestamp</div>
          <div className="text-[8.5px] font-mono text-[#6B7280]">{dataTs}</div>
        </div>
        <div>
          <div className="text-[7.5px] font-mono text-[#3A4555] uppercase tracking-wider mb-0.5">Fetched</div>
          <div className="text-[8.5px] font-mono text-[#6B7280]">{formatAge(feed.fetchedAt)}</div>
        </div>
        <div>
          <div className="text-[7.5px] font-mono text-[#3A4555] uppercase tracking-wider mb-0.5">Refresh Interval</div>
          <div className="text-[8.5px] font-mono text-[#6B7280]">{formatInterval(feed.refreshIntervalMs)}</div>
        </div>
        <div>
          <div className="text-[7.5px] font-mono text-[#3A4555] uppercase tracking-wider mb-0.5">Cache Age</div>
          <div className="text-[8.5px] font-mono text-[#6B7280]">{feed.cacheAgeMs < 1000 ? "fresh" : formatAge(Date.now() - feed.cacheAgeMs)}</div>
        </div>
      </div>

      {/* Packet ID */}
      <div>
        <div className="text-[7.5px] font-mono text-[#3A4555] uppercase tracking-wider mb-0.5">Source Packet</div>
        <div className="text-[8px] font-mono text-[#4A5568] break-all">{feed.packetId}</div>
      </div>

      {/* Context */}
      <div>
        <div className="text-[7.5px] font-mono text-[#3A4555] uppercase tracking-wider mb-0.5">Chain of Custody</div>
        <div className="text-[8px] font-mono text-[#5A6575] leading-relaxed">{feed.context}</div>
      </div>

      {/* Error */}
      {feed.error && (
        <div className="border-t border-rose-500/20 pt-2">
          <div className="text-[7.5px] font-mono text-rose-400 uppercase tracking-wider mb-0.5">Failure State</div>
          <div className="text-[8px] font-mono text-rose-300/70 leading-relaxed">{feed.error}</div>
        </div>
      )}
    </div>
  );
}

function DimensionRow({
  dim,
  index,
  visible,
  feed,
}: {
  dim: DimensionEntry;
  index: number;
  visible: boolean;
  feed?: FeedRecord;
}) {
  const [expanded, setExpanded] = useState(false);
  const color  = DIRECTION_COLOR[dim.direction];
  const arrow  = DIRECTION_LABEL[dim.direction];
  const barWidth = Math.min(100, dim.contribution);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.2, delay: index * 0.03 }}
          className="group cursor-pointer border-b border-white/[0.025]"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="py-2.5 px-4 hover:bg-white/[0.015] transition-all">
            {/* Row header */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center space-x-2 min-w-0">
                <span className="text-[9px] font-mono text-[#3A4555] w-4 shrink-0">{String(index + 1).padStart(2, "0")}</span>
                <span className="text-[10px] font-mono font-medium text-[#8A95A3] truncate">{dim.name}</span>
              </div>
              <div className="flex items-center space-x-2 shrink-0 ml-2">
                {feed && <FeedStatusBadge status={feed.status} />}
                <span className="text-[9px] font-mono" style={{ color }}>{arrow}</span>
                <span className="text-[10px] font-mono font-bold" style={{ color }}>{dim.contribution.toFixed(1)}%</span>
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
            <div className="text-[8.5px] font-mono text-[#3A4555] group-hover:text-[#5A6575] transition-colors leading-relaxed">
              {dim.signal}
            </div>
          </div>

          {/* Authority panel — expands on click */}
          <AnimatePresence>
            {expanded && feed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <AuthorityPanel feed={feed} />
              </motion.div>
            )}
            {expanded && !feed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="mx-3 mb-2 px-3 py-2 rounded border border-white/[0.04] bg-white/[0.02]">
                  <div className="text-[8px] font-mono text-[#3A4555]">No authority feed mapped for dimension <span className="text-[#6B7280]">{dim.id}</span></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const EXPAND_LEVELS = [10, 20, 50, 100] as const;
type ExpandLevel = typeof EXPAND_LEVELS[number];

function SyntheticRow({ index }: { index: number }) {
  const names = [
    "Funding Rate", "Options Skew", "Realized Vol", "Historical Basis",
    "Exchange Flows", "Miner Flows", "Stablecoin Ratio", "Derivatives OI",
    "Social Sentiment", "Search Volume", "Whale Alerts", "Lightning Network",
    "Hash Rate", "Difficulty Adj", "Mempool Backlog", "Fee Revenue",
    "Layer2 TVL", "DeFi Correlation", "NFT Market", "CBDC Signal",
    "Sovereign Demand", "Treasury Yield", "Corp Bond Spread", "Equity Correlation",
    "Carry Trade", "Repo Rate", "FX Volatility", "Commodities Index",
    "Energy Price", "Shipping CPI",
  ];
  const name  = names[index % names.length] || `Signal ${index + 11}`;
  const contrib = 2 + Math.sin(index * 2.7) * 1.5;
  const dirs = ["positive", "negative", "neutral"] as const;
  const dir  = dirs[index % 3];
  const color = DIRECTION_COLOR[dir];

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 0.3, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      className="py-2 px-4 border-b border-white/[0.015]"
    >
      <div className="flex items-baseline justify-between mb-1">
        <div className="flex items-baseline space-x-2.5">
          <span className="text-[9px] font-mono text-[#2A3545] w-4 shrink-0">{String(index + 11).padStart(2, "0")}</span>
          <span className="text-[9px] font-mono text-[#4A5568]">{name}</span>
        </div>
        <span className="text-[9px] font-mono text-[#3A4555]">{contrib.toFixed(1)}%</span>
      </div>
      <div className="h-px bg-white/[0.02] rounded-full overflow-hidden">
        <div className="h-full rounded-full opacity-25" style={{ backgroundColor: color, width: `${contrib * 5}%` }} />
      </div>
    </motion.div>
  );
}

// ── Live feed legend ─────────────────────────────────────────────────────────

function FeedsLegend({ feeds }: { feeds: FeedRecord[] }) {
  if (feeds.length === 0) return null;
  const live      = feeds.filter((f) => f.status === "live").length;
  const cached    = feeds.filter((f) => f.status === "cached").length;
  const degraded  = feeds.filter((f) => f.status === "degraded").length;
  const unavail   = feeds.filter((f) => f.status === "unavailable").length;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {live > 0 && (
        <span className="text-[7.5px] font-mono text-emerald-400 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />{live}L
        </span>
      )}
      {cached > 0 && (
        <span className="text-[7.5px] font-mono text-[#E0AF68] flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-[#E0AF68]" />{cached}C
        </span>
      )}
      {degraded > 0 && (
        <span className="text-[7.5px] font-mono text-amber-400 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-amber-400" />{degraded}D
        </span>
      )}
      {unavail > 0 && (
        <span className="text-[7.5px] font-mono text-rose-400 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-rose-500" />{unavail}U
        </span>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function DimensionStack({ dimensions, loading, rapidsCompression, feeds = [] }: DimensionStackProps) {
  const [expandLevel, setExpandLevel] = useState<ExpandLevel>(10);

  // Build a lookup map from feed id → FeedRecord
  const feedMap = new Map<string, FeedRecord>(feeds.map((f) => [f.id, f]));

  const extraCount = expandLevel > 10 ? Math.min(expandLevel - 10, 30) : 0;

  return (
    <div className="flex flex-col h-full border-r border-white/[0.04] bg-[#07080B]" id="dimension-stack">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <span className="text-[9px] font-mono font-bold tracking-[0.2em] text-[#4A5568] uppercase">DIMENSIONS</span>
          {loading && <span className="text-[8px] font-mono text-[#E0AF68] animate-pulse">RAPIDS ↓</span>}
        </div>
        <div className="flex items-center space-x-2">
          <FeedsLegend feeds={feeds} />
          <div className="flex items-center space-x-1 ml-1">
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
          : (
              <>
                {dimensions.map((dim, i) => (
                  <DimensionRow
                    key={dim.id}
                    dim={dim}
                    index={i}
                    visible={true}
                    feed={feedMap.get(dim.id)}
                  />
                ))}
                {expandLevel > 10 && Array.from({ length: extraCount }).map((_, i) => (
                  <SyntheticRow key={`synth-${i}`} index={i} />
                ))}
              </>
            )
        }
      </div>

      {/* RAPIDS compression footer */}
      <div className="px-4 py-2.5 border-t border-white/[0.04] shrink-0">
        <div className="text-[8px] font-mono text-[#3A4555] leading-relaxed">
          <span className="text-[#E0AF68]/40 mr-1.5">RAPIDS</span>
          {rapidsCompression || "awaiting field data"}
        </div>
        {feeds.length > 0 && (
          <div className="text-[7px] font-mono text-[#2A3545] mt-0.5">
            Click any dimension to inspect authority chain
          </div>
        )}
      </div>
    </div>
  );
}

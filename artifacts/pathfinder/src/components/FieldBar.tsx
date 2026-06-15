import { motion } from "framer-motion";
import { RefreshCw, Zap, Activity } from "lucide-react";
import { LiveFeedData } from "../augment-types";

interface FieldBarProps {
  liveFeed: LiveFeedData | null;
  feedLoading: boolean;
  analysisLoading: boolean;
  onRefresh: () => void;
  mode: "augment" | "archive" | "code";
  setMode: (m: "augment" | "archive" | "code") => void;
}

const MODES: { id: "augment" | "archive" | "code"; label: string }[] = [
  { id: "augment", label: "AUGMENT" },
  { id: "archive", label: "ARCHIVE" },
  { id: "code", label: "CODE" },
];

export default function FieldBar({
  liveFeed,
  feedLoading,
  analysisLoading,
  onRefresh,
  mode,
  setMode,
}: FieldBarProps) {
  const spot = liveFeed ? parseFloat(liveFeed.coinbaseSpotPrice) : null;
  const future = liveFeed ? parseFloat(liveFeed.cmeFuturePrice) : null;
  const basis = spot && future ? future - spot : null;
  const marketStructure = basis !== null ? (basis >= 0 ? "CONTANGO" : "BACKWDN") : null;

  return (
    <div className="h-14 border-b border-white/[0.05] flex items-center justify-between px-6 bg-[#07080B]" id="field-bar">
      {/* Left: Identity */}
      <div className="flex items-center space-x-4 min-w-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-5 h-5 relative">
            <div className="absolute inset-0 border border-[#E0AF68]/40 rotate-45 rounded-sm" />
            <div className="absolute inset-[3px] border border-[#E0AF68]/20 rotate-45 rounded-sm" />
          </div>
          <span className="text-[10px] font-mono font-bold tracking-[0.25em] text-[#E0AF68] uppercase">PATHFINDER</span>
          <span className="text-[9px] font-mono text-[#E0AF68]/30">AUGMENT</span>
        </div>

        <div className="h-4 w-px bg-white/[0.06]" />

        {/* Field observation */}
        {liveFeed ? (
          <div className="flex items-center space-x-3 font-mono">
            <div className="flex items-center space-x-1.5">
              <motion.div
                className="w-1 h-1 rounded-full bg-emerald-400"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-[9px] text-[#4A5568] uppercase tracking-wider">FIELD</span>
              <span className="text-[9px] text-[#6B7280]">BTC/USD</span>
            </div>
            <span className="text-[11px] font-bold text-white tracking-tight">
              ${parseFloat(liveFeed.coinbaseSpotPrice).toLocaleString()}
            </span>
            {basis !== null && (
              <>
                <span className="text-[9px] text-[#4A5568]">·</span>
                <span className={`text-[9px] font-bold ${basis >= 0 ? "text-[#64D2FF]" : "text-rose-400"}`}>
                  {basis >= 0 ? "+" : ""}{basis.toFixed(0)} {marketStructure}
                </span>
              </>
            )}
            <span className="text-[9px] text-[#4A5568]">·</span>
            <span className="text-[9px] text-[#6B7280]">{liveFeed.source}</span>
            <span className="text-[9px] text-[#4A5568]">·</span>
            <span className="text-[9px] text-[#4A5568]">{liveFeed.pingMs}ms</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 font-mono">
            <div className="w-1 h-1 rounded-full bg-[#4A5568] animate-pulse" />
            <span className="text-[9px] text-[#4A5568] uppercase tracking-wider">FIELD — ACQUIRING</span>
          </div>
        )}

        {(feedLoading || analysisLoading) && (
          <>
            <div className="h-4 w-px bg-white/[0.06]" />
            <div className="flex items-center space-x-1.5 text-[9px] font-mono text-[#4A5568]">
              <RefreshCw className="w-2.5 h-2.5 animate-spin text-[#E0AF68]" />
              <span>{analysisLoading ? "RAPIDS COMPUTING" : "ACQUIRING FIELD"}</span>
            </div>
          </>
        )}
      </div>

      {/* Right: mode + controls */}
      <div className="flex items-center space-x-3">
        {/* Mode switcher */}
        <div className="flex items-center space-x-0.5 bg-[#0D0E12] border border-white/[0.04] rounded-lg p-0.5">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-3 py-1 rounded-md text-[9px] font-mono font-bold tracking-wider cursor-pointer transition-all ${
                mode === m.id
                  ? "bg-[#151820] text-white"
                  : "text-[#3A4555] hover:text-[#6B7280]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <button
          onClick={onRefresh}
          disabled={feedLoading}
          className="flex items-center space-x-1.5 text-[9px] font-mono text-[#3A4555] hover:text-[#6B7280] cursor-pointer transition-all"
        >
          <Zap className={`w-3 h-3 ${feedLoading ? "text-[#E0AF68] animate-pulse" : ""}`} />
          <span>REFRESH</span>
        </button>
      </div>
    </div>
  );
}

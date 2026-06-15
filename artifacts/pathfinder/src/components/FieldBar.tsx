import { motion } from "framer-motion";
import { RefreshCw, Zap } from "lucide-react";
import { LiveFeedData } from "../augment-types";
import { AssetId, ASSETS, getAsset, formatPrice } from "../assets";

interface FieldBarProps {
  liveFeed: LiveFeedData | null;
  feedLoading: boolean;
  analysisLoading: boolean;
  onRefresh: () => void;
  mode: "augment" | "archive" | "action";
  setMode: (m: "augment" | "archive" | "action") => void;
  selectedAsset: AssetId;
  onAssetChange: (id: AssetId) => void;
}

const MODES: { id: "augment" | "archive" | "action"; label: string }[] = [
  { id: "augment", label: "AUGMENT" },
  { id: "archive", label: "ARCHIVE" },
  { id: "action", label: "ACTION" },
];

export default function FieldBar({
  liveFeed,
  feedLoading,
  analysisLoading,
  onRefresh,
  mode,
  setMode,
  selectedAsset,
  onAssetChange,
}: FieldBarProps) {
  const asset = getAsset(selectedAsset);
  const spot = liveFeed ? parseFloat(liveFeed.coinbaseSpotPrice) : null;
  const future = liveFeed ? parseFloat(liveFeed.cmeFuturePrice) : null;
  const basis = spot && future ? future - spot : null;
  const marketStructure = basis !== null ? (basis >= 0 ? "CONTANGO" : "BACKWDN") : null;

  return (
    <div className="border-b border-white/[0.05] bg-[#07080B] shrink-0" id="field-bar">

      {/* ── Row 1: Identity + mode switcher (always visible) ── */}
      <div className="flex items-center justify-between px-4 md:px-6 h-12 md:h-14">

        {/* Left: Logo */}
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-4 h-4 md:w-5 md:h-5 relative shrink-0">
            <div className="absolute inset-0 border border-[#E0AF68]/40 rotate-45 rounded-sm" />
            <div className="absolute inset-[3px] border border-[#E0AF68]/20 rotate-45 rounded-sm" />
          </div>
          <span className="text-[9px] md:text-[10px] font-mono font-bold tracking-[0.25em] text-[#E0AF68] uppercase">PATHFINDER</span>
          <span className="hidden sm:inline text-[9px] font-mono text-[#E0AF68]/30">AUGMENT</span>

          {/* Desktop: field data inline */}
          <div className="hidden md:flex items-center space-x-2 ml-3">
            <div className="h-4 w-px bg-white/[0.06]" />
            {liveFeed ? (
              <div className="flex items-center space-x-3 font-mono">
                <div className="flex items-center space-x-1.5">
                  <motion.div
                    className="w-1 h-1 rounded-full bg-emerald-400"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-[9px] text-[#4A5568] uppercase tracking-wider">FIELD</span>
                  <span className="text-[9px] text-[#6B7280]">{asset.pair}</span>
                </div>
                <span className="text-[11px] font-bold text-white tracking-tight">
                  {formatPrice(liveFeed.coinbaseSpotPrice, selectedAsset)}
                </span>
                {basis !== null && (
                  <>
                    <span className="text-[9px] text-[#4A5568]">·</span>
                    <span className={`text-[9px] font-bold ${basis >= 0 ? "text-[#64D2FF]" : "text-rose-400"}`}>
                      {basis >= 0 ? "+" : ""}{Math.abs(basis) < 1 ? basis.toFixed(3) : basis.toFixed(0)} {marketStructure}
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
        </div>

        {/* Right: Mode switcher + refresh */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center space-x-0.5 bg-[#0D0E12] border border-white/[0.04] rounded-lg p-0.5">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`px-2 md:px-3 py-1 rounded-md text-[8px] md:text-[9px] font-mono font-bold tracking-wider cursor-pointer transition-all ${
                  mode === m.id ? "bg-[#151820] text-white" : "text-[#3A4555] hover:text-[#6B7280]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <button
            onClick={onRefresh}
            disabled={feedLoading}
            className="hidden md:flex items-center space-x-1.5 text-[9px] font-mono text-[#3A4555] hover:text-[#6B7280] cursor-pointer transition-all"
          >
            <Zap className={`w-3 h-3 ${feedLoading ? "text-[#E0AF68] animate-pulse" : ""}`} />
            <span>REFRESH</span>
          </button>
        </div>
      </div>

      {/* ── Row 2: Asset selector + field price (mobile only) ── */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 border-t border-white/[0.04]">

        {/* Asset pills */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {ASSETS.map((a) => (
            <button
              key={a.id}
              onClick={() => onAssetChange(a.id)}
              className={`shrink-0 px-2 py-1 rounded text-[8px] font-mono font-bold tracking-wider cursor-pointer transition-all border ${
                selectedAsset === a.id
                  ? "border-[#E0AF68]/40 bg-[#E0AF68]/10 text-[#E0AF68]"
                  : "border-white/[0.04] text-[#3A4555] hover:text-[#6B7280]"
              }`}
            >
              {a.id}
            </button>
          ))}
        </div>

        {/* Price + refresh */}
        <div className="flex items-center gap-3 shrink-0 ml-2">
          {liveFeed ? (
            <div className="flex items-center gap-2 font-mono">
              <motion.div
                className="w-1 h-1 rounded-full bg-emerald-400 shrink-0"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-[10px] font-bold text-white">{formatPrice(liveFeed.coinbaseSpotPrice, selectedAsset)}</span>
              {basis !== null && (
                <span className={`text-[8.5px] font-bold ${basis >= 0 ? "text-[#64D2FF]" : "text-rose-400"}`}>
                  {marketStructure}
                </span>
              )}
            </div>
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-[#4A5568] animate-pulse" />
          )}
          <button
            onClick={onRefresh}
            disabled={feedLoading}
            className="text-[#3A4555] hover:text-[#6B7280] cursor-pointer transition-all"
          >
            <Zap className={`w-3.5 h-3.5 ${feedLoading ? "text-[#E0AF68] animate-pulse" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Desktop: Asset selector row ── */}
      <div className="hidden md:flex items-center gap-1.5 px-6 pb-2.5 pt-0">
        <span className="text-[8px] font-mono text-[#2A3545] tracking-wider uppercase mr-1">Instrument</span>
        {ASSETS.map((a) => (
          <button
            key={a.id}
            onClick={() => onAssetChange(a.id)}
            className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider cursor-pointer transition-all border ${
              selectedAsset === a.id
                ? "border-[#E0AF68]/40 bg-[#E0AF68]/10 text-[#E0AF68]"
                : "border-white/[0.04] text-[#3A4555] hover:text-[#6B7280]"
            }`}
          >
            {a.id} <span className="opacity-50 font-normal">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

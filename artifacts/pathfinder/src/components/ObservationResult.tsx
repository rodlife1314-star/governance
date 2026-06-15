import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown, ChevronUp, Archive, Search, Eye, AlertTriangle, Zap } from "lucide-react";
import { ObservationAnalysis } from "../augment-types";
import RapidsAperture from "./RapidsAperture";
import DimensionStack from "./DimensionStack";
import SimonPanel from "./SimonPanel";
import AuthorityStack from "./AuthorityStack";

interface ObservationResultProps {
  analysis: ObservationAnalysis;
  onNewObservation: () => void;
  onSeal: (text: string) => void;
  sealing: boolean;
  sealedFlash: boolean;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  default:   <Zap className="w-2.5 h-2.5" />,
  archive:   <Archive className="w-2.5 h-2.5" />,
  invest:    <Search className="w-2.5 h-2.5" />,
  monitor:   <Eye className="w-2.5 h-2.5" />,
  escalate:  <AlertTriangle className="w-2.5 h-2.5" />,
};

function actionIcon(action: string) {
  const lower = action.toLowerCase();
  if (lower.includes("archive") || lower.includes("record")) return ACTION_ICONS.archive;
  if (lower.includes("invest") || lower.includes("analys")) return ACTION_ICONS.invest;
  if (lower.includes("monitor") || lower.includes("watch")) return ACTION_ICONS.monitor;
  if (lower.includes("escalat") || lower.includes("alert")) return ACTION_ICONS.escalate;
  return ACTION_ICONS.default;
}

export default function ObservationResult({
  analysis,
  onNewObservation,
  onSeal,
  sealing,
  sealedFlash,
}: ObservationResultProps) {
  const [governanceOpen, setGovernanceOpen] = useState(false);
  const [augTab, setAugTab] = useState<"field" | "dims" | "intel">("field");

  const confidenceColor =
    analysis.confidence >= 80 ? "#4CD964"
    : analysis.confidence >= 50 ? "#E0AF68"
    : "#FF6B6B";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="flex-1 flex flex-col bg-[#07080B] overflow-hidden"
    >
      {/* ── Observation header bar ── */}
      <div className="shrink-0 border-b border-white/[0.05] bg-[#07080B]">
        <div className="flex items-start justify-between px-4 md:px-6 py-3 gap-4">

          {/* Left: back + observation text */}
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
              <div className="text-[11px] font-mono text-white leading-snug">
                "{analysis.rawObservation}"
              </div>
            </div>
          </div>

          {/* Right: inferred domain badge */}
          <div className="shrink-0 text-right">
            <div className="text-[7px] font-mono text-[#4A5568] uppercase tracking-wider mb-0.5">
              INFERRED
            </div>
            <div className="text-[9px] font-mono font-bold text-[#E0AF68]">
              {analysis.inferredDomainFull}
            </div>
            <div className="text-[8px] font-mono mt-0.5" style={{ color: confidenceColor }}>
              {analysis.confidence}% confidence
            </div>
          </div>
        </div>

        {/* Mobile tab bar */}
        <div className="md:hidden flex border-t border-white/[0.04]">
          {([["field", "LENS"], ["dims", "DIMS"], ["intel", "FINDINGS"]] as ["field" | "dims" | "intel", string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setAugTab(id)}
              className={`flex-1 py-2.5 text-[9px] font-mono font-bold tracking-[0.2em] transition-all cursor-pointer border-b-2 ${
                augTab === id
                  ? "text-white border-[#E0AF68]"
                  : "text-[#5A6575] border-transparent hover:text-[#8A9DB0]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main analysis panels ── */}
      <div className="flex-1 overflow-hidden flex flex-col">

        {/* Desktop: 3-column */}
        <div
          className="hidden md:grid flex-1 overflow-hidden"
          style={{ gridTemplateColumns: "1fr 360px 340px" }}
        >
          <RapidsAperture
            dimensions={analysis.dimensions}
            loading={false}
            rapidsCompression={analysis.rapidsCompression}
          />
          <DimensionStack
            dimensions={analysis.dimensions}
            loading={false}
            rapidsCompression={analysis.rapidsCompression}
            feeds={[]}
          />
          <SimonPanel
            pattern={analysis.pattern}
            findings={analysis.findings}
            simonSummary={analysis.simonSummary}
            loading={false}
            dimensions={analysis.dimensions}
          />
        </div>

        {/* Mobile: single panel */}
        <div className="md:hidden flex-1 overflow-hidden">
          {augTab === "field" && (
            <RapidsAperture
              dimensions={analysis.dimensions}
              loading={false}
              rapidsCompression={analysis.rapidsCompression}
            />
          )}
          {augTab === "dims" && (
            <DimensionStack
              dimensions={analysis.dimensions}
              loading={false}
              rapidsCompression={analysis.rapidsCompression}
              feeds={[]}
            />
          )}
          {augTab === "intel" && (
            <SimonPanel
              pattern={analysis.pattern}
              findings={analysis.findings}
              simonSummary={analysis.simonSummary}
              loading={false}
              dimensions={analysis.dimensions}
            />
          )}
        </div>
      </div>

      {/* ── Authority Stack ── */}
      {analysis.citedAuthorities && analysis.citedAuthorities.length > 0 && (
        <AuthorityStack
          authorities={analysis.citedAuthorities}
          inferredDomain={analysis.inferredDomain}
          inferredDomainFull={analysis.inferredDomainFull}
        />
      )}

      {/* ── Action bar ── */}
      <div className="shrink-0 border-t border-white/[0.04] bg-[#07080B]">
        <div className="flex items-center justify-between px-4 md:px-6 py-2.5 gap-3">

          {/* Suggested actions */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-[7px] font-mono text-[#3A4555] uppercase tracking-wider shrink-0 mr-1">
              ACTIONS
            </span>
            {analysis.suggestedActions.map((action) => (
              <button
                key={action}
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded border border-white/[0.05] bg-white/[0.01] text-[8px] font-mono text-[#5A6575] hover:text-[#8A9DB0] hover:border-white/[0.08] transition-all cursor-pointer"
              >
                {actionIcon(action)}
                <span>{action}</span>
              </button>
            ))}
          </div>

          {/* Seal observation */}
          <button
            onClick={() => onSeal(analysis.rawObservation)}
            disabled={sealing}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded border text-[8px] font-mono font-bold tracking-wider transition-all cursor-pointer ${
              sealedFlash
                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-400"
                : "border-[#E0AF68]/30 bg-[#E0AF68]/05 text-[#E0AF68]/70 hover:text-[#E0AF68] hover:border-[#E0AF68]/50"
            }`}
          >
            <Archive className="w-2.5 h-2.5" />
            <span>{sealedFlash ? "SEALED" : sealing ? "SEALING…" : "SEAL"}</span>
          </button>
        </div>

        {/* Governance — hidden by default */}
        <div className="border-t border-white/[0.03]">
          <button
            onClick={() => setGovernanceOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 md:px-6 py-1.5 text-[7px] font-mono text-[#2A3445] hover:text-[#4A5568] transition-colors cursor-pointer"
          >
            <span className="tracking-wider uppercase">Governance · Authority · Provenance</span>
            {governanceOpen ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
          </button>
          <AnimatePresence>
            {governanceOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 md:px-6 pb-3 pt-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <div className="text-[7px] font-mono text-[#3A4555] uppercase tracking-wider mb-1">Inferred Domain</div>
                    <div className="text-[9px] font-mono text-[#6B7B8E]">{analysis.inferredDomainFull}</div>
                  </div>
                  <div>
                    <div className="text-[7px] font-mono text-[#3A4555] uppercase tracking-wider mb-1">Confidence</div>
                    <div className="text-[9px] font-mono" style={{ color: confidenceColor }}>{analysis.confidence}%</div>
                  </div>
                  <div>
                    <div className="text-[7px] font-mono text-[#3A4555] uppercase tracking-wider mb-1">RAPIDS Compression</div>
                    <div className="text-[9px] font-mono text-[#6B7B8E]">{analysis.rapidsCompression}</div>
                  </div>
                  <div>
                    <div className="text-[7px] font-mono text-[#3A4555] uppercase tracking-wider mb-1">Dimensions</div>
                    <div className="text-[9px] font-mono text-[#6B7B8E]">{analysis.dimensions.length} discovered</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

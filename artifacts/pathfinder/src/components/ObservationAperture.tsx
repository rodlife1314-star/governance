import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";
import { DomainConfig } from "../domains";

interface ObservationApertureProps {
  onSubmit: (observation: string) => void;
  onFieldMode: () => void;
  domain?: DomainConfig;
}

const DOMAIN_EXAMPLES: Record<string, string[]> = {
  ASTROPHYSICS: [
    "(248370) 2005 QN173 — recurrent dust tail at perihelion — T_J = 3.192, active asteroid classification unclear",
    "Spectral line at 656nm — inconsistent with standard hydrogen emission profile",
    "Stellar magnitude dropping 0.3 mag/hr — unscheduled occultation candidate",
    "Orbital period shortening — non-gravitational Yarkovsky force signature suspected",
  ],
  MEDICINE: [
    "Patient presenting with asymmetric pupil dilation — no trauma history",
    "Troponin rising but ECG shows no ST elevation — ACS without classic presentation",
    "Fever recurring every 48 hours with splenomegaly — tertian pattern",
    "SpO₂ dropping to 88% on exertion — resting saturation 96%",
  ],
  LAW: [
    "Contract clause allows exit with 30 days notice — counterparty gave 12",
    "Arbitration clause specifies ICC rules — dispute arose under LCIA jurisdiction",
    "Limitation period expires in 14 days — claimant has not filed",
    "Force majeure clause invoked — event predates the contract by 3 days",
  ],
  IT: [
    "System latency spikes every 8 hours, correlated with garbage collection",
    "API endpoint returning 503 only on POST requests — GET responses normal",
    "Memory leak detected — heap growing 12MB per hour under normal load",
    "Certificate expiry in 3 days — auto-renewal process failed silently",
  ],
  FINANCE: [
    "Silver is rising despite a strong dollar",
    "BTC consolidating above 66k while futures basis compresses",
    "Gold spot-futures basis inverting — backwardation emerging",
    "10Y yield rising while 2Y stalls — curve steepening divergence",
  ],
};

const GENERIC_EXAMPLES = [
  "Silver is rising despite a strong dollar",
  "Patient presenting with asymmetric pupil dilation and no trauma history",
  "Contract clause allows exit only with 30 days notice — counterparty gave 12",
  "System latency spikes every 8 hours, correlated with garbage collection",
  "BTC consolidating above 66k while futures basis compresses",
  "Unusual spectral line at 656nm — inconsistent with standard hydrogen emission",
];

export default function ObservationAperture({ onSubmit, onFieldMode, domain }: ObservationApertureProps) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const examples = domain ? (DOMAIN_EXAMPLES[domain.id] ?? GENERIC_EXAMPLES) : GENERIC_EXAMPLES;
  const accent = domain?.accentColor ?? "#E0AF68";

  useEffect(() => {
    const t = setTimeout(() => textareaRef.current?.focus(), 400);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = () => {
    if (text.trim().length < 3) return;
    onSubmit(text.trim());
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
  };

  const handleExample = (ex: string) => {
    setText(ex);
    textareaRef.current?.focus();
  };

  const canSubmit = text.trim().length >= 3;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col bg-[#07080B] overflow-hidden"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 h-12 border-b border-white/[0.04] shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-4 h-4 relative shrink-0">
            <div className="absolute inset-0 border rotate-45 rounded-sm" style={{ borderColor: `${accent}40` }} />
            <div className="absolute inset-[3px] border rotate-45 rounded-sm" style={{ borderColor: `${accent}20` }} />
          </div>
          <span className="text-[9px] font-mono font-bold tracking-[0.25em] uppercase" style={{ color: accent }}>
            PATHFINDER
          </span>
          {domain ? (
            <span
              className="text-[8px] font-mono font-bold tracking-[0.15em] uppercase px-2 py-0.5 rounded"
              style={{
                color: accent,
                backgroundColor: `${accent}12`,
                border: `1px solid ${accent}30`,
              }}
            >
              {domain.shortLabel} MODE
            </span>
          ) : (
            <span className="text-[9px] font-mono tracking-wider" style={{ color: `${accent}30` }}>AUGMENT</span>
          )}
        </div>
        <button
          onClick={onFieldMode}
          className="flex items-center gap-1 text-[8px] font-mono text-[#3A4555] hover:text-[#6B7B8E] transition-colors cursor-pointer"
        >
          <span>DIRECT FIELD ANALYSIS</span>
          <ChevronRight className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">

          {/* The question */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            {domain && (
              <div
                className="text-[9px] font-mono font-bold tracking-[0.25em] uppercase mb-2"
                style={{ color: `${accent}80` }}
              >
                {domain.label.toUpperCase()} · {domain.tagline}
              </div>
            )}
            <h2 className="text-[28px] md:text-[36px] font-mono font-bold text-white leading-tight tracking-tight">
              What has your attention?
            </h2>
          </motion.div>

          {/* Observation input */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-4"
          >
            <div
              className="relative border rounded-lg transition-all duration-200"
              style={{
                borderColor: focused ? `${accent}50` : "rgba(255,255,255,0.06)",
                backgroundColor: focused ? "#0D0E12" : "#0A0B0E",
              }}
            >
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={handleKey}
                rows={3}
                placeholder={
                  domain
                    ? `Describe your ${domain.label.toLowerCase()} observation — any signal, anomaly, or pattern…`
                    : "Describe what you're observing — any domain, any signal, any anomaly…"
                }
                className="w-full bg-transparent text-white font-mono text-[13px] leading-relaxed px-4 py-3.5 resize-none outline-none placeholder:text-[#3A4555]"
              />
              {focused && (
                <div className="absolute bottom-2 right-3 text-[8px] font-mono text-[#3A4555]">
                  ⌘↵ to observe
                </div>
              )}
            </div>
          </motion.div>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="flex justify-end mb-10"
          >
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex items-center gap-2 px-5 py-2 rounded font-mono text-[10px] font-bold tracking-[0.2em] uppercase transition-all cursor-pointer"
              style={{
                backgroundColor: canSubmit ? `${accent}10` : "transparent",
                border: `1px solid ${canSubmit ? `${accent}40` : "rgba(255,255,255,0.04)"}`,
                color: canSubmit ? accent : "#3A4555",
              }}
            >
              <span>OBSERVE</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </motion.div>

          {/* Example observations */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <div className="text-[8px] font-mono text-[#3A4555] tracking-wider uppercase mb-3">
              {domain ? `${domain.label} example observations` : "Example observations"}
            </div>
            <div className="flex flex-col gap-1.5">
              {examples.map((ex) => (
                <button
                  key={ex}
                  onClick={() => handleExample(ex)}
                  className="text-left text-[10px] font-mono text-[#4A5568] hover:text-[#7A8898] transition-colors cursor-pointer leading-relaxed"
                >
                  <span className="text-[#2A3445] mr-2">·</span>
                  {ex}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom tagline */}
      <div className="shrink-0 px-6 pb-4 flex items-center justify-center">
        <span className="text-[8px] font-mono text-[#2A3445] tracking-wider">
          OBSERVE · DISCOVER · COMPRESS · SYNTHESISE · DECIDE
        </span>
      </div>
    </motion.div>
  );
}

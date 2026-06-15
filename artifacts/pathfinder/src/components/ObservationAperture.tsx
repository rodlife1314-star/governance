import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";

interface ObservationApertureProps {
  onSubmit: (observation: string) => void;
  onFieldMode: () => void;
}

const EXAMPLES = [
  "Silver is rising despite a strong dollar",
  "Patient presenting with asymmetric pupil dilation and no trauma history",
  "Contract clause allows exit only with 30 days notice — counterparty gave 12",
  "System latency spikes every 8 hours, correlated with garbage collection",
  "BTC consolidating above 66k while futures basis compresses",
  "Unusual spectral line at 656nm — inconsistent with standard hydrogen emission",
];

export default function ObservationAperture({ onSubmit, onFieldMode }: ObservationApertureProps) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      {/* Minimal top bar */}
      <div className="flex items-center justify-between px-6 h-12 border-b border-white/[0.04] shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-4 h-4 relative shrink-0">
            <div className="absolute inset-0 border border-[#E0AF68]/40 rotate-45 rounded-sm" />
            <div className="absolute inset-[3px] border border-[#E0AF68]/20 rotate-45 rounded-sm" />
          </div>
          <span className="text-[9px] font-mono font-bold tracking-[0.25em] text-[#E0AF68] uppercase">PATHFINDER</span>
          <span className="text-[9px] font-mono text-[#E0AF68]/25">AUGMENT</span>
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
            <h1 className="text-[13px] font-mono font-bold tracking-[0.2em] text-[#E0AF68] uppercase mb-2">
              PATHFINDER AUGMENT
            </h1>
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
              className={`relative border rounded-lg transition-all duration-200 ${
                focused
                  ? "border-[#E0AF68]/50 bg-[#0D0E12]"
                  : "border-white/[0.06] bg-[#0A0B0E]"
              }`}
            >
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={handleKey}
                rows={3}
                placeholder="Describe what you're observing — any domain, any signal, any anomaly…"
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
              className={`flex items-center gap-2 px-5 py-2 rounded font-mono text-[10px] font-bold tracking-[0.2em] uppercase transition-all cursor-pointer ${
                canSubmit
                  ? "bg-[#E0AF68]/10 border border-[#E0AF68]/40 text-[#E0AF68] hover:bg-[#E0AF68]/15"
                  : "bg-transparent border border-white/[0.04] text-[#3A4555]"
              }`}
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
              Example observations
            </div>
            <div className="flex flex-col gap-1.5">
              {EXAMPLES.map((ex) => (
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

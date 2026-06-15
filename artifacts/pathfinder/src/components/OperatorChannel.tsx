import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, CheckCircle } from "lucide-react";
import { LiveFeedData, Finding } from "../augment-types";

interface OperatorChannelProps {
  liveFeed: LiveFeedData | null;
  pattern: string;
  findings: Finding[];
  onSealObservation: (text: string) => Promise<void>;
  sealing: boolean;
  sealed: boolean;
}

export default function OperatorChannel({ liveFeed, pattern, findings, onSealObservation, sealing, sealed }: OperatorChannelProps) {
  const [text, setText] = useState("");

  const handleSeal = async () => {
    if (!text.trim() || sealing) return;
    await onSealObservation(text.trim());
    setText("");
  };

  return (
    <div className="border-t border-white/[0.04] bg-[#07080B] shrink-0" id="operator-channel">
      <div className="flex items-start gap-3 px-4 md:px-6 py-3 md:py-0 md:h-20 md:items-center">

        {/* Label */}
        <div className="flex items-center space-x-2 shrink-0 pt-0.5 md:pt-0">
          <div className="text-[9px] font-mono font-bold tracking-[0.2em] text-[#4A5568] uppercase">OPERATOR</div>
          <div className="w-px h-4 bg-white/[0.06]" />
        </div>

        {/* Input */}
        <div className="flex-1 min-w-0">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSeal(); }}
            placeholder="What do you observe? Your judgment takes precedent over the system."
            className="w-full bg-transparent border-none outline-none text-[10.5px] font-mono text-[#C4CDD8] placeholder-[#3A4555] resize-none leading-relaxed"
            style={{ minHeight: "2.5rem", maxHeight: "5rem" }}
            rows={2}
            disabled={sealing}
          />
        </div>

        {/* Seal */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center pb-0.5 md:pb-0">
          {text.length > 0 && (
            <span className="hidden md:inline text-[8px] font-mono text-[#5A6575]">⌘↵ seal</span>
          )}
          <AnimatePresence mode="wait">
            {sealed ? (
              <motion.div
                key="sealed"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center space-x-1.5 text-[9px] font-mono text-emerald-400"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>SEALED</span>
              </motion.div>
            ) : (
              <motion.button
                key="seal-btn"
                onClick={handleSeal}
                disabled={!text.trim() || sealing || !liveFeed}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded border text-[9px] font-mono font-bold cursor-pointer transition-all ${
                  text.trim() && liveFeed && !sealing
                    ? "border-[#E0AF68]/30 bg-[#E0AF68]/5 text-[#E0AF68] hover:bg-[#E0AF68]/10"
                    : "border-white/[0.04] bg-transparent text-[#3A4555] cursor-not-allowed"
                }`}
              >
                <Lock className={`w-3 h-3 ${sealing ? "animate-pulse" : ""}`} />
                <span className="hidden sm:inline">{sealing ? "SEALING" : "SEAL OBSERVATION"}</span>
                <span className="sm:hidden">{sealing ? "..." : "SEAL"}</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

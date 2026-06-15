import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, CheckCircle } from "lucide-react";
import { LiveFeedData } from "../augment-types";

interface OperatorChannelProps {
  liveFeed: LiveFeedData | null;
  pattern: string;
  findings: string[];
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
    <div className="h-20 border-t border-white/[0.04] bg-[#07080B] flex items-center px-6 space-x-4" id="operator-channel">
      {/* Label */}
      <div className="flex items-center space-x-2 shrink-0">
        <div className="text-[9px] font-mono font-bold tracking-[0.2em] text-[#4A5568] uppercase">OPERATOR</div>
        <div className="w-px h-4 bg-white/[0.06]" />
      </div>

      {/* Input */}
      <div className="flex-1">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSeal(); }}
          placeholder="What do you observe? Your judgment takes precedent over the system."
          className="w-full bg-transparent border-none outline-none text-[10.5px] font-mono text-[#8A95A3] placeholder-[#2A3545] resize-none h-10 leading-relaxed"
          rows={2}
          disabled={sealing}
        />
      </div>

      {/* Seal button */}
      <div className="flex items-center space-x-3 shrink-0">
        {text.length > 0 && (
          <span className="text-[8px] font-mono text-[#3A4555]">⌘↵ seal</span>
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
              <span>{sealing ? "SEALING" : "SEAL OBSERVATION"}</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

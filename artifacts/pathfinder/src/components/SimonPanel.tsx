import { motion, AnimatePresence } from "framer-motion";

interface SimonPanelProps {
  pattern: string;
  findings: string[];
  simonSummary: string;
  loading: boolean;
}

export default function SimonPanel({ pattern, findings, simonSummary, loading }: SimonPanelProps) {
  return (
    <div className="flex flex-col h-full border-l border-white/[0.04] bg-[#07080B] overflow-y-auto" id="simon-panel">

      {/* PATTERN */}
      <div className="px-5 pt-5 pb-4 border-b border-white/[0.04]">
        <div className="text-[9px] font-mono font-bold tracking-[0.25em] text-[#4A5568] uppercase mb-3">PATTERN</div>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading-pattern" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="space-y-2 animate-pulse">
                <div className="h-3 w-full bg-white/[0.04] rounded" />
                <div className="h-3 w-3/4 bg-white/[0.04] rounded" />
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
            <div className="text-[10px] font-mono text-[#3A4555]">awaiting dimensional resolution</div>
          )}
        </AnimatePresence>
      </div>

      {/* FINDINGS */}
      <div className="px-5 pt-4 pb-4 border-b border-white/[0.04] flex-1">
        <div className="text-[9px] font-mono font-bold tracking-[0.25em] text-[#4A5568] uppercase mb-3">FINDINGS</div>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading-findings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex space-x-2">
                    <div className="w-1 h-1 mt-1.5 bg-white/[0.04] rounded-full shrink-0" />
                    <div className="h-2.5 bg-white/[0.04] rounded flex-1" style={{ width: `${70 + i * 5}%` }} />
                  </div>
                ))}
              </div>
            </motion.div>
          ) : findings.length > 0 ? (
            <motion.div
              key={findings.join("")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-3"
            >
              {findings.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.3 }}
                  className="flex space-x-2.5 items-start"
                >
                  <div className="mt-1.5 w-1 h-1 rounded-full bg-[#E0AF68]/40 shrink-0" />
                  <span className="text-[11px] font-mono text-[#8A95A3] leading-relaxed">{f}</span>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-[10px] font-mono text-[#3A4555]">no findings yet</div>
          )}
        </AnimatePresence>
      </div>

      {/* SIMON */}
      <div className="px-5 pt-4 pb-5">
        <div className="flex items-center space-x-2 mb-3">
          <div className="text-[9px] font-mono font-bold tracking-[0.25em] text-[#4A5568] uppercase">SIMON</div>
          <div className="flex-1 h-px bg-white/[0.04]" />
          <div className="text-[8px] font-mono text-[#3A4555]">pattern · meaning · route</div>
        </div>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading-simon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="space-y-1.5 animate-pulse">
                <div className="h-2.5 bg-white/[0.03] rounded w-full" />
                <div className="h-2.5 bg-white/[0.03] rounded w-5/6" />
                <div className="h-2.5 bg-white/[0.03] rounded w-4/5" />
              </div>
            </motion.div>
          ) : simonSummary ? (
            <motion.div
              key={simonSummary}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-[10.5px] font-mono text-[#6B7280] leading-relaxed border-l border-[#E0AF68]/15 pl-3"
            >
              {simonSummary}
            </motion.div>
          ) : (
            <div className="text-[10px] font-mono text-[#3A4555]">SIMON awaiting dimensions</div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

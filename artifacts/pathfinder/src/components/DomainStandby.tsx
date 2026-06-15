import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { DomainConfig } from "../domains";

interface DomainStandbyProps {
  domain: DomainConfig;
}

export default function DomainStandby({ domain }: DomainStandbyProps) {
  return (
    <motion.div
      key={domain.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col items-center justify-center bg-[#07080B] overflow-hidden relative"
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(${domain.accentColor} 1px, transparent 1px), linear-gradient(90deg, ${domain.accentColor} 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Center card */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md px-8">

        {/* Icon ring */}
        <div className="relative mb-8">
          <div
            className="w-20 h-20 rounded-full border flex items-center justify-center"
            style={{ borderColor: `${domain.accentColor}20`, backgroundColor: `${domain.accentColor}06` }}
          >
            <Lock className="w-7 h-7" style={{ color: `${domain.accentColor}60` }} />
          </div>
          <motion.div
            className="absolute inset-0 rounded-full border"
            style={{ borderColor: `${domain.accentColor}15` }}
            animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Domain name */}
        <div
          className="text-[11px] font-mono font-bold tracking-[0.3em] uppercase mb-2"
          style={{ color: domain.accentColor }}
        >
          {domain.label}
        </div>

        <div className="text-[22px] font-mono font-bold text-white mb-3 tracking-tight">
          STANDBY
        </div>

        <div className="text-[11px] font-mono text-[#5A6575] leading-relaxed mb-8">
          {domain.tagline}
        </div>

        {/* Lens preview */}
        <div className="w-full border border-white/[0.04] rounded-lg p-4 bg-white/[0.01]">
          <div
            className="text-[8px] font-mono font-bold tracking-[0.25em] uppercase mb-3"
            style={{ color: `${domain.accentColor}80` }}
          >
            10-DIMENSIONAL LENS — ARCHITECTURE READY
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {domain.lensNames.map((name, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="w-1 h-1 rounded-full shrink-0"
                  style={{ backgroundColor: `${domain.accentColor}40` }}
                />
                <span className="text-[9px] font-mono text-[#4A5568]">{name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 text-[9px] font-mono text-[#3A4555] tracking-wider">
          PATHFINDER · {domain.id} MODULE · ACTIVATION PENDING
        </div>
      </div>
    </motion.div>
  );
}

import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, Scale, Cpu, Telescope, TrendingUp, Lock } from "lucide-react";
import { DOMAINS, DomainId, DomainConfig } from "../domains";

const ICONS: Record<DomainId, React.ReactNode> = {
  FINANCE:     <TrendingUp className="w-3 h-3" />,
  MEDICINE:    <FlaskConical className="w-3 h-3" />,
  LAW:         <Scale className="w-3 h-3" />,
  IT:          <Cpu className="w-3 h-3" />,
  ASTROPHYSICS:<Telescope className="w-3 h-3" />,
};

interface DomainSelectorProps {
  selected: DomainId;
  onSelect: (id: DomainId) => void;
}

export default function DomainSelector({ selected, onSelect }: DomainSelectorProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
      <span className="text-[8px] font-mono text-[#4A5568] tracking-wider uppercase mr-1 shrink-0">Domain</span>
      {DOMAINS.map((d: DomainConfig) => {
        const isActive = selected === d.id;
        return (
          <button
            key={d.id}
            onClick={() => onSelect(d.id)}
            title={d.live ? d.tagline : "Coming soon"}
            className={`relative shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded text-[8px] font-mono font-bold tracking-wider transition-all border cursor-pointer ${
              isActive
                ? "border-opacity-40 text-white"
                : "border-white/[0.04] text-[#5A6575] hover:text-[#8A9DB0]"
            }`}
            style={isActive ? {
              borderColor: `${d.color}40`,
              backgroundColor: `${d.color}12`,
              color: d.color,
            } : {}}
          >
            <span style={isActive ? { color: d.color } : { color: "#4A5568" }}>
              {ICONS[d.id]}
            </span>
            <span>{d.shortLabel}</span>
            {!d.live && (
              <Lock className="w-2 h-2 opacity-40" />
            )}
            {d.live && isActive && (
              <motion.div
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: d.color }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

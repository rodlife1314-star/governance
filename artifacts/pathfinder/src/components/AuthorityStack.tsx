import { ExternalLink, Shield, BookOpen, Award, FileText, Layers } from "lucide-react";
import { CitedAuthority } from "../augment-types";

interface AuthorityStackProps {
  authorities: CitedAuthority[];
  inferredDomain: string;
  inferredDomainFull: string;
}

const TIER_CONFIG: Record<string, {
  label: string;
  color: string;
  borderColor: string;
  bgColor: string;
  icon: React.ReactNode;
}> = {
  primary:    { label: "PRIMARY",    color: "#64D2FF", borderColor: "rgba(100,210,255,0.25)", bgColor: "rgba(100,210,255,0.06)", icon: <Shield   className="w-2.5 h-2.5" /> },
  regulatory: { label: "REGULATORY", color: "#E0AF68", borderColor: "rgba(224,175,104,0.25)", bgColor: "rgba(224,175,104,0.06)", icon: <Award    className="w-2.5 h-2.5" /> },
  standard:   { label: "STANDARD",   color: "#A78BFA", borderColor: "rgba(167,139,250,0.25)", bgColor: "rgba(167,139,250,0.06)", icon: <Layers   className="w-2.5 h-2.5" /> },
  reference:  { label: "REFERENCE",  color: "#4CD964", borderColor: "rgba(76,217,100,0.25)",  bgColor: "rgba(76,217,100,0.06)",  icon: <BookOpen className="w-2.5 h-2.5" /> },
  glossary:   { label: "GLOSSARY",   color: "#6B7B8E", borderColor: "rgba(107,123,142,0.2)",  bgColor: "rgba(107,123,142,0.04)", icon: <FileText className="w-2.5 h-2.5" /> },
};

function getTierConfig(tier: string) {
  return TIER_CONFIG[tier] ?? TIER_CONFIG.reference;
}

export default function AuthorityStack({ authorities, inferredDomain }: AuthorityStackProps) {
  if (!authorities || authorities.length === 0) return null;

  return (
    <div className="border-t border-white/[0.04] bg-[#07080B]">
      <div className="px-4 md:px-6 pt-3 pb-3">

        {/* Header */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="text-[7px] font-mono text-[#4A5568] uppercase tracking-[0.2em]">
              AUTHORITY STACK
            </div>
            <div className="text-[7px] font-mono text-[#2A3445] uppercase tracking-wider px-1.5 py-0.5 rounded border border-white/[0.03]">
              {inferredDomain}
            </div>
          </div>
          <div className="text-[7px] font-mono text-[#2A3445]">
            {authorities.length} {authorities.length === 1 ? "body" : "bodies"} governing this observation
          </div>
        </div>

        {/* Authority cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {authorities.map((auth) => {
            const cfg = getTierConfig(auth.tier);
            return (
              <div
                key={auth.shortName}
                className="flex items-start gap-2.5 p-2.5 rounded border transition-all"
                style={{ borderColor: cfg.borderColor, backgroundColor: cfg.bgColor }}
              >
                {/* Tier badge + icon */}
                <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
                  <div style={{ color: cfg.color }}>{cfg.icon}</div>
                  <div
                    className="text-[6px] font-mono font-bold tracking-wider"
                    style={{ color: cfg.color, opacity: 0.7 }}
                  >
                    {cfg.label}
                  </div>
                </div>

                {/* Body info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1 mb-0.5">
                    <div className="text-[9px] font-mono font-bold text-white leading-tight">
                      {auth.shortName}
                    </div>
                    <a
                      href={auth.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-0.5 text-[7px] font-mono transition-colors"
                      style={{ color: cfg.color, opacity: 0.6 }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
                    >
                      <ExternalLink className="w-2 h-2" />
                    </a>
                  </div>
                  <div className="text-[8px] font-mono text-[#4A5568] mb-1 leading-tight">
                    {auth.name}
                  </div>
                  <div className="text-[8px] font-mono text-[#6B7B8E] leading-snug">
                    {auth.relevance}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

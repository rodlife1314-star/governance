import { useMemo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DimensionEntry } from "../augment-types";

interface RapidsApertureProps {
  dimensions: DimensionEntry[];
  loading: boolean;
  rapidsCompression: string;
}

const CX = 200;
const CY = 200;
const OUTER_R = 155;
const N = 10;

function polarToCart(cx: number, cy: number, r: number, angleRad: number) {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function angle(i: number) {
  return -Math.PI / 2 + (i / N) * 2 * Math.PI;
}

const AXIS_LABELS = ["DXY", "RYLD", "INST", "FUT", "CHN", "RISK", "CMDT", "GEO", "TECH", "LQD"];

const DIR_COLOR: Record<string, string> = {
  positive: "#4CD964",
  negative: "#FF6B6B",
  neutral: "#E0AF68",
};

function buildPolygon(dims: DimensionEntry[]) {
  if (dims.length === 0) return "";
  return dims.map((d, i) => {
    const r = (d.contribution / 100) * OUTER_R;
    const a = angle(i);
    const p = polarToCart(CX, CY, r, a);
    return `${p.x},${p.y}`;
  }).join(" ");
}

function dominantColor(dims: DimensionEntry[]): string {
  const weighted = dims.reduce((acc, d) => {
    const score = d.direction === "positive" ? d.contribution : d.direction === "negative" ? -d.contribution : 0;
    return acc + score;
  }, 0);
  if (weighted > 20) return "#4CD964";
  if (weighted < -20) return "#FF6B6B";
  return "#E0AF68";
}

export default function RapidsAperture({ dimensions, loading, rapidsCompression }: RapidsApertureProps) {
  const [tick, setTick] = useState(0);
  const polygonPoints = useMemo(() => buildPolygon(dimensions), [dimensions]);
  const mainColor = useMemo(() => dimensions.length > 0 ? dominantColor(dimensions) : "#E0AF68", [dimensions]);

  useEffect(() => {
    const t = setInterval(() => setTick((p) => p + 1), 3000);
    return () => clearInterval(t);
  }, []);

  const refRings = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#07080B] px-2 py-4 md:px-4 md:py-6 relative" id="rapids-aperture">
      {/* Title */}
      <div className="absolute top-3 left-0 right-0 flex items-center justify-center">
        <span className="text-[8px] font-mono tracking-[0.3em] text-[#3A4555] uppercase">RAPIDS LENS</span>
      </div>

      {/* Responsive SVG container */}
      <div className="relative w-full max-w-[360px] md:max-w-[400px] aspect-square">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 400 400"
          id="rapids-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <radialGradient id="bg-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0E1018" />
              <stop offset="100%" stopColor="#07080B" />
            </radialGradient>
            <radialGradient id="poly-fill" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={mainColor} stopOpacity="0.18" />
              <stop offset="100%" stopColor={mainColor} stopOpacity="0.04" />
            </radialGradient>
            <filter id="glow-soft">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="center-glow">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <circle cx={CX} cy={CY} r={OUTER_R + 20} fill="url(#bg-grad)" />

          {refRings.map((fraction, ri) => {
            const pts = Array.from({ length: N }, (_, i) => {
              const p = polarToCart(CX, CY, fraction * OUTER_R, angle(i));
              return `${p.x},${p.y}`;
            }).join(" ");
            return (
              <polygon
                key={ri}
                points={pts}
                fill="none"
                stroke={fraction === 1.0 ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)"}
                strokeWidth={fraction === 1.0 ? "1" : "0.5"}
              />
            );
          })}

          {Array.from({ length: N }, (_, i) => {
            const outer = polarToCart(CX, CY, OUTER_R, angle(i));
            return (
              <line
                key={i}
                x1={CX} y1={CY}
                x2={outer.x} y2={outer.y}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="0.75"
              />
            );
          })}

          <AnimatePresence>
            {polygonPoints && !loading && (
              <motion.polygon
                key={polygonPoints}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                points={polygonPoints}
                fill="url(#poly-fill)"
                stroke={mainColor}
                strokeWidth="1.5"
                strokeOpacity="0.6"
                filter="url(#glow-soft)"
              />
            )}
          </AnimatePresence>

          {(loading || dimensions.length === 0) && (
            <>
              {refRings.map((fraction, ri) => {
                const pts = Array.from({ length: N }, (_, i) => {
                  const r = fraction * OUTER_R * (0.5 + 0.5 * Math.sin(tick * 0.8 + i * 0.7));
                  const p = polarToCart(CX, CY, r, angle(i));
                  return `${p.x},${p.y}`;
                }).join(" ");
                return (
                  <polygon
                    key={`anim-${ri}`}
                    points={pts}
                    fill="none"
                    stroke={`rgba(224,175,104,${0.04 + ri * 0.02})`}
                    strokeWidth="0.75"
                  />
                );
              })}
            </>
          )}

          {!loading && dimensions.map((d, i) => {
            const r = (d.contribution / 100) * OUTER_R;
            const p = polarToCart(CX, CY, r, angle(i));
            const color = DIR_COLOR[d.direction];
            return (
              <circle
                key={d.id}
                cx={p.x} cy={p.y}
                r="2.5"
                fill={color}
                fillOpacity="0.8"
                filter="url(#glow-soft)"
              />
            );
          })}

          {Array.from({ length: N }, (_, i) => {
            const labelR = OUTER_R + 16;
            const p = polarToCart(CX, CY, labelR, angle(i));
            const color = !loading && dimensions[i] ? DIR_COLOR[dimensions[i].direction] : "#3A4555";
            return (
              <text
                key={i}
                x={p.x} y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="7.5"
                fontFamily="JetBrains Mono, monospace"
                fill={color}
                fillOpacity="0.65"
              >
                {AXIS_LABELS[i]}
              </text>
            );
          })}

          <circle cx={CX} cy={CY} r="3" fill={mainColor} fillOpacity="0.9" filter="url(#center-glow)" />
          <motion.circle
            cx={CX} cy={CY} r="12"
            fill="none"
            stroke={mainColor}
            strokeWidth="0.5"
            strokeOpacity="0.3"
            animate={{ r: [10, 18, 10], strokeOpacity: [0.3, 0.05, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>

        {/* Center overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {loading ? (
            <div className="text-[8px] font-mono text-[#E0AF68]/50 tracking-[0.3em] animate-pulse">COMPUTING</div>
          ) : dimensions.length === 0 ? (
            <div className="text-[8px] font-mono text-[#3A4555] tracking-[0.3em]">ACQUIRING</div>
          ) : null}
        </div>
      </div>

      {rapidsCompression && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center">
          <div className="text-[8px] font-mono text-[#3A4555] tracking-wider text-center max-w-xs px-4 leading-relaxed">
            {rapidsCompression}
          </div>
        </div>
      )}
    </div>
  );
}

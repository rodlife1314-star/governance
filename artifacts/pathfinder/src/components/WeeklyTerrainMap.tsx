import { useState } from "react";
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";
import {
  Layers, Wind, Shield, Gauge, ChevronRight, Radio, ArrowUpRight,
  ArrowDownRight, RefreshCw, Settings, Scale, Activity, BrainCircuit,
  Fingerprint, Sparkles
} from "lucide-react";
import { getAbsoluteUrl } from "../utils";

interface CanonicalMarketPacket {
  liveSpot: number;
  liveFuture: number;
  basis: number;
  mode: "LIVE" | "HISTORICAL";
}

interface TerrainSubdivision {
  label: string;
  date: string;
  spotPrice: number;
  futuresBasis: number;
  volumeB: number;
  openInterestB: number;
  dominancePercent: number;
  dxyIndex: number;
  vixValue: number;
  fundingRatePercent: number;
  windForce: string;
  windIntensity: "Storm" | "Gale" | "Moderate" | "Light" | "Calm";
}

interface SovereignSlicePacket {
  id: string;
  scale: "day" | "week" | "month" | "macro";
  scaleLabel: string;
  range: string;
  title: string;
  backgroundNoiseLevel: string;
  fieldStabilityScore: number;
  priceDomain: string;
  feedTimestamp: string;
  sourceMode: string;
  startState: { spot: number; basis: number; oi: number; dominance: number };
  endState: { spot: number; basis: number; oi: number; dominance: number };
  primaryDrivers: string[];
  largestDriftEvent: string;
  largestConvergenceEvent: string;
  subdivisions: TerrainSubdivision[];
}

const GOVERNANCE_STEPS = [
  { key: "reality", number: "01", name: "Reality Field", desc: "Infinite continuous market" },
  { key: "slice", number: "02", name: "Slice Election", desc: "Scale boundary selected" },
  { key: "feeler", number: "03", name: "Feeler Packet", desc: "Live data ingested" },
  { key: "compression", number: "04", name: "Compression", desc: "Struct sealed" },
  { key: "aperture", number: "05", name: "Aperture Lock", desc: "Coordinate focused" },
  { key: "validation", number: "06", name: "Validation", desc: "Drift gate checked" },
  { key: "opinion", number: "07", name: "AI Opinion", desc: "Coprocessor trace" },
  { key: "operator", number: "08", name: "Operator", desc: "Decision authority" },
  { key: "ledger", number: "09", name: "Ledger", desc: "Audit committed" },
];

const SOVEREIGN_SLICES_REGISTRY: SovereignSlicePacket[] = [
  {
    id: "SLICE-DAY-MON",
    scale: "day",
    scaleLabel: "Daily Slice (Hourly Integration)",
    range: "June 09, 2026 (Monday)",
    title: "Monday June 09 – Recovery Consolidation Phase",
    backgroundNoiseLevel: "Low (0.42%)",
    fieldStabilityScore: 95.1,
    priceDomain: "HISTORICAL_108K_SIMULATED",
    feedTimestamp: "2026-06-09T23:59:59Z",
    sourceMode: "DAILY_SIMULATED",
    startState: { spot: 107200, basis: 28, oi: 13.4, dominance: 58.9 },
    endState: { spot: 108500, basis: 42, oi: 14.1, dominance: 59.2 },
    primaryDrivers: [
      "Early morning ETF inflows from US institutional traders drove spot accumulation above $107k.",
      "CME futures basis expanded from +$28 to +$42 as derivatives demand recovered post-weekend.",
      "Bitcoin dominance inched higher confirming continued altcoin de-risking patterns."
    ],
    largestDriftEvent: "Pre-market hours saw a brief backwardation spike as Asian liquidations temporarily pushed futures under spot by -$12.",
    largestConvergenceEvent: "12:00 UTC arbitrage convergence restored contango premium cleanly to +$38 as European session opened.",
    subdivisions: [
      { label: "00:00", date: "June 09", spotPrice: 107200, futuresBasis: 28, volumeB: 2.1, openInterestB: 13.4, dominancePercent: 58.9, dxyIndex: 103.2, vixValue: 12.8, fundingRatePercent: 0.010, windForce: "Pre-Market Calm", windIntensity: "Calm" },
      { label: "04:00", date: "June 09", spotPrice: 107450, futuresBasis: -12, volumeB: 1.4, openInterestB: 13.1, dominancePercent: 59.0, dxyIndex: 103.3, vixValue: 13.1, fundingRatePercent: -0.005, windForce: "Asian Liquidation Spike", windIntensity: "Gale" },
      { label: "08:00", date: "June 09", spotPrice: 107800, futuresBasis: 35, volumeB: 3.8, openInterestB: 13.5, dominancePercent: 59.1, dxyIndex: 103.0, vixValue: 12.5, fundingRatePercent: 0.012, windForce: "European Open Inflow", windIntensity: "Moderate" },
      { label: "12:00", date: "June 09", spotPrice: 108100, futuresBasis: 38, volumeB: 5.2, openInterestB: 13.8, dominancePercent: 59.1, dxyIndex: 102.9, vixValue: 12.2, fundingRatePercent: 0.014, windForce: "Arbitrage Convergence", windIntensity: "Light" },
      { label: "16:00", date: "June 09", spotPrice: 108350, futuresBasis: 40, volumeB: 6.1, openInterestB: 14.0, dominancePercent: 59.2, dxyIndex: 102.7, vixValue: 11.9, fundingRatePercent: 0.016, windForce: "US Afternoon Momentum", windIntensity: "Moderate" },
      { label: "20:00", date: "June 09", spotPrice: 108500, futuresBasis: 42, volumeB: 4.9, openInterestB: 14.1, dominancePercent: 59.2, dxyIndex: 102.8, vixValue: 12.0, fundingRatePercent: 0.017, windForce: "Evening Stability", windIntensity: "Light" },
    ]
  },
  {
    id: "SLICE-WEEK-26",
    scale: "week",
    scaleLabel: "Weekly Slice (Daily Integration)",
    range: "June 09 – June 13, 2026",
    title: "Week 26 – Institutional Recovery & Basis Re-alignment",
    backgroundNoiseLevel: "Moderate (0.85%)",
    fieldStabilityScore: 92.3,
    priceDomain: "HISTORICAL_108K_SIMULATED",
    feedTimestamp: "2026-06-13T20:00:00Z",
    sourceMode: "WEEKLY_INSTITUTIONAL_RECOVERY",
    startState: { spot: 107200, basis: 28, oi: 13.4, dominance: 58.9 },
    endState: { spot: 109550, basis: 58, oi: 14.8, dominance: 59.6 },
    primaryDrivers: [
      "ETF accumulation dominated all 5 sessions, with institutional buyers absorbing daily supply above $107k.",
      "CME basis expanded from +$28 to +$58 as risk appetite returned across derivatives desks globally.",
      "Bitcoin dominance climbed from 58.9% to 59.6%, signaling continued altcoin de-risking dynamics."
    ],
    largestDriftEvent: "Monday pre-market: Asian liquidation spike briefly pushed futures $12 under spot — intraday backwardation resolved within 3 hours.",
    largestConvergenceEvent: "Wednesday ETF flow confirmation drove a clean structural basis re-alignment to +$48 by end of New York session.",
    subdivisions: [
      { label: "Monday", date: "June 09", spotPrice: 107200, futuresBasis: 28, volumeB: 24.6, openInterestB: 13.4, dominancePercent: 58.9, dxyIndex: 103.2, vixValue: 12.8, fundingRatePercent: 0.010, windForce: "Recovery Inflow Winds", windIntensity: "Moderate" },
      { label: "Tuesday", date: "June 10", spotPrice: 107900, futuresBasis: 35, volumeB: 28.1, openInterestB: 13.7, dominancePercent: 59.0, dxyIndex: 102.9, vixValue: 12.4, fundingRatePercent: 0.012, windForce: "Basis Normalization", windIntensity: "Light" },
      { label: "Wednesday", date: "June 11", spotPrice: 108600, futuresBasis: 48, volumeB: 31.4, openInterestB: 14.1, dominancePercent: 59.2, dxyIndex: 102.5, vixValue: 11.8, fundingRatePercent: 0.015, windForce: "ETF Confirmation Surge", windIntensity: "Gale" },
      { label: "Thursday", date: "June 12", spotPrice: 109100, futuresBasis: 52, volumeB: 26.7, openInterestB: 14.5, dominancePercent: 59.4, dxyIndex: 102.3, vixValue: 11.5, fundingRatePercent: 0.018, windForce: "Derivatives Expansion", windIntensity: "Moderate" },
      { label: "Friday", date: "June 13", spotPrice: 109550, futuresBasis: 58, volumeB: 22.9, openInterestB: 14.8, dominancePercent: 59.6, dxyIndex: 102.1, vixValue: 11.2, fundingRatePercent: 0.020, windForce: "Weekly Close Stability", windIntensity: "Light" },
    ]
  },
  {
    id: "SLICE-WEEK-25",
    scale: "week",
    scaleLabel: "Weekly Slice (Daily Integration)",
    range: "June 02 – June 06, 2026",
    title: "Week 25 – CPI Shock & De-leveraging Gale",
    backgroundNoiseLevel: "High (2.15%)",
    fieldStabilityScore: 74.8,
    priceDomain: "HISTORICAL_105K_SIMULATED",
    feedTimestamp: "2026-06-06T20:00:00Z",
    sourceMode: "WEEKLY_CPI_SHOCK",
    startState: { spot: 106200, basis: 45, oi: 12.8, dominance: 56.8 },
    endState: { spot: 105100, basis: -110, oi: 12.4, dominance: 56.4 },
    primaryDrivers: [
      "Hot CPI print on Wednesday triggered a systematic de-risking across spot and derivatives desks globally.",
      "Basis collapsed from +$45 to -$110 as leveraged longs were liquidated at scale over 48-hour window.",
      "Open interest fell from $12.8B to $12.4B reflecting forced position closure and leverage flushing."
    ],
    largestDriftEvent: "Thursday saw a -$310 basis collapse as futures fell deeply under spot (backwardation) for 48 consecutive hours during the liquidation cascade.",
    largestConvergenceEvent: "Friday afternoon arb desks stepped in to partially restore basis to -$110 from the -$310 floor, limiting further structural damage.",
    subdivisions: [
      { label: "Monday", date: "June 02", spotPrice: 106200, futuresBasis: 45, volumeB: 31.2, openInterestB: 12.8, dominancePercent: 56.8, dxyIndex: 103.9, vixValue: 14.8, fundingRatePercent: 0.018, windForce: "Pre-CPI Stability", windIntensity: "Light" },
      { label: "Tuesday", date: "June 03", spotPrice: 105900, futuresBasis: 22, volumeB: 38.4, openInterestB: 12.7, dominancePercent: 56.7, dxyIndex: 104.2, vixValue: 16.2, fundingRatePercent: 0.008, windForce: "Pre-CPI Tension Build", windIntensity: "Moderate" },
      { label: "Wednesday", date: "June 04", spotPrice: 105600, futuresBasis: -85, volumeB: 52.1, openInterestB: 12.5, dominancePercent: 56.5, dxyIndex: 104.8, vixValue: 19.4, fundingRatePercent: -0.040, windForce: "CPI Shock Gale", windIntensity: "Storm" },
      { label: "Thursday", date: "June 05", spotPrice: 104800, futuresBasis: -310, volumeB: 68.9, openInterestB: 12.4, dominancePercent: 56.4, dxyIndex: 105.1, vixValue: 22.1, fundingRatePercent: -0.085, windForce: "Liquidation Cascade", windIntensity: "Storm" },
      { label: "Friday", date: "June 06", spotPrice: 105100, futuresBasis: -110, volumeB: 44.6, openInterestB: 12.4, dominancePercent: 56.4, dxyIndex: 104.7, vixValue: 18.3, fundingRatePercent: -0.042, windForce: "Partial Arb Recovery", windIntensity: "Gale" },
    ]
  },
  {
    id: "SLICE-MONTH-JUN",
    scale: "month",
    scaleLabel: "Monthly Slice (Weekly Integration)",
    range: "June 01 - June 30, 2026",
    title: "June 2026 Integration (Dynamic Contango Waves)",
    backgroundNoiseLevel: "Moderate (1.15%)",
    fieldStabilityScore: 88.2,
    priceDomain: "HISTORICAL_112K_SIMULATED",
    feedTimestamp: "2026-06-30T20:00:00Z",
    sourceMode: "MONTHLY_CONTANGO_WAVES",
    startState: { spot: 112500, basis: 40, oi: 16.5, dominance: 57.2 },
    endState: { spot: 114300, basis: 55, oi: 15.9, dominance: 60.1 },
    primaryDrivers: [
      "A systematic spot price bottom crawled steadily upward after recovering from the Week 1 CPI storm.",
      "Extreme buy-side spot ETF accumulation through Weeks 2 & 3 restored deep capital reserves.",
      "CME basis premiums resolved from dark negative back into structural, healthy yield curves at close."
    ],
    largestDriftEvent: "Week 1 inflation prints triggered a major spot liquidation, forcing futures under spot by -$310 for 48 hours.",
    largestConvergenceEvent: "Week 4 structural arbitrage convergence, restoring the premium field balance back to a flat +$55 contango.",
    subdivisions: [
      { label: "Week 1", date: "Jun 01-05", spotPrice: 105100, futuresBasis: -110, volumeB: 174.5, openInterestB: 12.4, dominancePercent: 56.4, dxyIndex: 104.4, vixValue: 17.0, fundingRatePercent: -0.030, windForce: "CPI Sell-off Gale", windIntensity: "Storm" },
      { label: "Week 2", date: "Jun 08-12", spotPrice: 109250, futuresBasis: 25, volumeB: 144.8, openInterestB: 15.2, dominancePercent: 59.8, dxyIndex: 102.8, vixValue: 11.9, fundingRatePercent: 0.012, windForce: "ETF Capital Inflows", windIntensity: "Moderate" },
      { label: "Week 3", date: "Jun 15-19", spotPrice: 111100, futuresBasis: 45, volumeB: 132.4, openInterestB: 14.8, dominancePercent: 59.4, dxyIndex: 102.4, vixValue: 11.5, fundingRatePercent: 0.018, windForce: "Aesthetic Consolidation Grid", windIntensity: "Light" },
      { label: "Week 4", date: "Jun 22-26", spotPrice: 114300, futuresBasis: 55, volumeB: 168.1, openInterestB: 15.9, dominancePercent: 60.1, dxyIndex: 101.9, vixValue: 11.1, fundingRatePercent: 0.024, windForce: "Unified Squeeze Momentum", windIntensity: "Gale" },
    ]
  },
  {
    id: "SLICE-CYCLE-H1",
    scale: "macro",
    scaleLabel: "Macro Cycle (Epoch Delta)",
    range: "January 01 - June 30, 2026",
    title: "H1 2026 Institutional Lift-off Cycle",
    backgroundNoiseLevel: "High Vol (3.42%)",
    fieldStabilityScore: 81.4,
    priceDomain: "HISTORICAL_88K_SIMULATED",
    feedTimestamp: "2026-06-30T20:00:00Z",
    sourceMode: "H1_INSTITUTIONAL_EPOCH",
    startState: { spot: 88500, basis: 15, oi: 8.4, dominance: 52.1 },
    endState: { spot: 114300, basis: 55, oi: 15.9, dominance: 60.1 },
    primaryDrivers: [
      "Secular upward trajectory driven by corporate treasury inclusion, sovereign reserves, and options listing expansion.",
      "DXY macro index locked in a long-term downtrend from 105.8 to 101.9, easing worldwide liquidity pressure.",
      "Bitcoin dominance systematically climbed from 52.1% to over 60%, consolidating altcoin capital velocity."
    ],
    largestDriftEvent: "April Halving volatility created severe block reward adjustments, driving temporary backwardation on CME contracts.",
    largestConvergenceEvent: "June Spot ETF expansion triggered unified global clearinghouse consensus, settling localized derivative premiums.",
    subdivisions: [
      { label: "Jan", date: "Jan 2026", spotPrice: 91200, futuresBasis: 20, volumeB: 480.0, openInterestB: 9.1, dominancePercent: 52.8, dxyIndex: 105.8, vixValue: 14.2, fundingRatePercent: 0.010, windForce: "New Year Portfolio Re-weights", windIntensity: "Moderate" },
      { label: "Feb", date: "Feb 2026", spotPrice: 95400, futuresBasis: 35, volumeB: 512.5, openInterestB: 10.4, dominancePercent: 53.9, dxyIndex: 104.9, vixValue: 13.5, fundingRatePercent: 0.015, windForce: "Corporate Accumulation Trade", windIntensity: "Moderate" },
      { label: "Mar", date: "Mar 2026", spotPrice: 101200, futuresBasis: 60, volumeB: 680.2, openInterestB: 11.8, dominancePercent: 55.4, dxyIndex: 103.8, vixValue: 12.8, fundingRatePercent: 0.022, windForce: "Options Regulatory Clearance", windIntensity: "Gale" },
      { label: "Apr", date: "Apr 2026", spotPrice: 98900, futuresBasis: -45, volumeB: 720.5, openInterestB: 10.1, dominancePercent: 55.1, dxyIndex: 104.5, vixValue: 16.5, fundingRatePercent: -0.005, windForce: "Halving Block Consolidation", windIntensity: "Gale" },
      { label: "May", date: "May 2026", spotPrice: 104350, futuresBasis: 5, volumeB: 450.9, openInterestB: 11.4, dominancePercent: 57.1, dxyIndex: 101.9, vixValue: 10.9, fundingRatePercent: 0.004, windForce: "Perfect Core Grounding", windIntensity: "Calm" },
      { label: "Jun", date: "Jun 2026", spotPrice: 114300, futuresBasis: 55, volumeB: 619.8, openInterestB: 15.9, dominancePercent: 60.1, dxyIndex: 101.9, vixValue: 11.1, fundingRatePercent: 0.024, windForce: "Macro Squeeze Re-acceleration", windIntensity: "Storm" },
    ]
  }
];

interface WeeklyTerrainMapProps {
  livePrice?: number;
  liveIndicator?: { spot: string; future: string; ping: number; source: string } | null;
  canonicalPacket?: CanonicalMarketPacket;
}

export default function WeeklyTerrainMap({ livePrice, liveIndicator, canonicalPacket }: WeeklyTerrainMapProps = {}) {
  const [activeScale, setActiveScale] = useState<"day" | "week" | "month" | "macro">("week");
  const [activePacketIndex, setActivePacketIndex] = useState(0);
  const [selectedSubIndex, setSelectedSubIndex] = useState(4);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [aiEvidenceChain, setAiEvidenceChain] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const filteredPackets = SOVEREIGN_SLICES_REGISTRY.filter(p => p.scale === activeScale);
  const packetIndex = activePacketIndex >= filteredPackets.length ? 0 : activePacketIndex;
  const activePacket = filteredPackets[packetIndex] || SOVEREIGN_SLICES_REGISTRY[1];
  const selectedSubdivisionIndex = selectedSubIndex >= activePacket.subdivisions.length ? activePacket.subdivisions.length - 1 : selectedSubIndex;
  const selectedSubdivision = activePacket.subdivisions[selectedSubdivisionIndex] || activePacket.subdivisions[0];

  const activeSpot = canonicalPacket ? canonicalPacket.liveSpot : (livePrice || (liveIndicator ? parseFloat(liveIndicator.spot) : 0));
  const activeMode = canonicalPacket ? canonicalPacket.mode : "LIVE";
  const anchorPrice = selectedSubdivision ? selectedSubdivision.spotPrice : activePacket.startState.spot;
  const priceDifference = activeSpot > 0 ? Math.abs(anchorPrice - activeSpot) : 0;
  const allowedDrift = 15000;
  const hasPriceDomainMismatch = activeMode === "LIVE" && activeSpot > 0 && priceDifference > allowedDrift;

  const handleScaleToggle = (scale: "day" | "week" | "month" | "macro") => {
    setActiveScale(scale);
    setActivePacketIndex(0);
    const packet = SOVEREIGN_SLICES_REGISTRY.find(p => p.scale === scale) || SOVEREIGN_SLICES_REGISTRY[1];
    setSelectedSubIndex(packet.subdivisions.length - 1);
    setAiAnalysis("");
    setAiEvidenceChain([]);
  };

  const getWindIntensityBadgeClass = (intensity: string) => {
    switch (intensity) {
      case "Storm": return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "Gale": return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "Moderate": return "bg-sleek-cyan/10 text-sleek-cyan border border-sleek-cyan/20";
      case "Light": return "bg-emerald-500/10 text-[#4CD964] border border-emerald-500/25";
      default: return "bg-slate-500/10 text-slate-400 border border-slate-500/15";
    }
  };

  const triggerAiForcesAnalysis = async () => {
    setIsAiLoading(true);
    setAiAnalysis("");
    setAiEvidenceChain([]);
    try {
      const response = await fetch(getAbsoluteUrl("/api/gemini/slice-scale-analysis"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scale: activeScale,
          sliceId: activePacket.id,
          title: activePacket.title,
          range: activePacket.range,
          startState: activePacket.startState,
          endState: activePacket.endState,
          primaryDrivers: activePacket.primaryDrivers,
          selectedSubdivision,
          priceDomain: activePacket.priceDomain,
          feedTimestamp: activePacket.feedTimestamp,
          sourceMode: activePacket.sourceMode
        })
      });
      const data = await response.json();
      if (data.success) {
        setAiAnalysis(data.analysis);
        setAiEvidenceChain(data.evidenceChain || []);
      } else {
        setAiAnalysis(data.analysis || `### ⚠️ Coprocessor Connection Offline\nSovereign local fallback triggered for scale [${activeScale.toUpperCase()}].`);
        setAiEvidenceChain(data.evidenceChain || buildFallbackEvidence());
      }
    } catch {
      setAiAnalysis("Failed to compile sovereign AI Coprocessor opinion on the wind field.");
      setAiEvidenceChain(buildFallbackEvidence());
    } finally {
      setIsAiLoading(false);
    }
  };

  const buildFallbackEvidence = () => [
    { metric: "Focus price anchor", value: `$${selectedSubdivision.spotPrice.toLocaleString()}`, referenceRange: "Live temporal locus", impact: "Anchors baseline pricing at this coordinate." },
    { metric: "Futures Basis Premium", value: `$${selectedSubdivision.futuresBasis}`, referenceRange: "+$20 to +$140 dynamic", impact: `Basis premium of $${selectedSubdivision.futuresBasis} reflects relative derivatives leverage demand.` },
    { metric: "Realized Volume", value: `$${selectedSubdivision.volumeB}B`, referenceRange: "Liquidity depth indicator", impact: `Strong trading activity at $${selectedSubdivision.volumeB}B validates pricing consolidation.` },
    { metric: "Open Interest", value: `$${selectedSubdivision.openInterestB}B`, referenceRange: "Leverage density metric", impact: `Open derivatives leverage at $${selectedSubdivision.openInterestB}B shapes liquidation volatility buffers.` },
    { metric: "Fiat Pressure (DXY)", value: `${selectedSubdivision.dxyIndex}`, referenceRange: "102 - 105 index level", impact: `US Dollar Index direction at ${selectedSubdivision.dxyIndex} influences systemic risk aversion.` },
    { metric: "Macro Volatility (VIX)", value: `${selectedSubdivision.vixValue}`, referenceRange: "12 - 18 risk gauge", impact: `Capital risk appetite at ${selectedSubdivision.vixValue} regulates global spot-buying flows.` },
  ];

  return (
    <div className="bg-sleek-panel border border-sleek-border rounded-xl p-5 shadow-2xl space-y-6" id="weekly-terrain-container">
      
      <div className="bg-[#090A0D] border border-white/5 rounded-xl px-4 py-3 text-left">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-mono font-bold tracking-widest text-slate-400 uppercase flex items-center space-x-1.5 animate-pulse">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Active Sovereign Governance Lineage Flow Contract</span>
          </span>
          <span className="text-[8px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase">Validated</span>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
          {GOVERNANCE_STEPS.map((step) => {
            let isActive = ["reality","slice","feeler","compression","aperture","validation"].includes(step.key);
            if (step.key === "opinion" && aiAnalysis) isActive = true;
            return (
              <div key={step.key} className={`p-1.5 rounded-lg border font-mono transition-all text-left flex flex-col justify-between ${isActive ? "bg-slate-900 border-sleek-cyan/40 shadow-sm" : "bg-[#0A0C10] border-transparent opacity-40 hover:opacity-75"}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[8px] font-extrabold ${isActive ? "text-sleek-cyan" : "text-slate-500"}`}>{step.number}</span>
                  <Fingerprint className={`w-2.5 h-2.5 ${isActive ? "text-sleek-cyan/80" : "text-slate-600"}`} />
                </div>
                <div className="mt-1">
                  <span className="text-[10px] font-bold text-white block leading-none">{step.name}</span>
                  <span className="text-[7.5px] text-slate-400 block truncate mt-0.5" title={step.desc}>{step.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col xl:flex-row xl:items-center justify-between pb-4 border-b border-[#232736]/40 gap-4">
        <div className="space-y-1.5 text-left">
          <div className="flex items-center space-x-2">
            <Layers className="text-amber-500 w-5 h-5" />
            <h3 className="text-xs font-bold font-mono tracking-widest text-[#E0AF68] uppercase">SOVEREIGN TEMPORAL SLICE FIELD EXPLORER</h3>
          </div>
          <p className="text-[11px] text-sleek-muted leading-relaxed max-w-3xl">
            "A slice is not defined by external divisions. A slice <strong>is</strong> a bounded section of reality chosen for observation. Day, Week, Month, and Quarter are merely different scale focal lengths of the same continuous fields."
          </p>
        </div>
        <div className="bg-[#101217] p-1 rounded-lg border border-[#232736] flex items-center space-x-1">
          {(["day", "week", "month", "macro"] as const).map((s) => (
            <button key={s} onClick={() => handleScaleToggle(s)} className={`px-3 py-1.5 rounded-md text-[10px] font-mono font-bold uppercase cursor-pointer tracking-wider transition-all flex items-center space-x-1 ${activeScale === s ? "bg-sleek-cyan text-black font-extrabold shadow" : "text-sleek-muted hover:text-white"}`}>
              <Scale className="w-3 h-3" />
              <span>{s}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-[#0A0C10]/60 p-2.5 border border-[#232736]/20 rounded-xl justify-start text-left">
        <span className="text-[9px] font-mono font-bold uppercase text-slate-400 mr-2 flex items-center space-x-1">
          <Settings className="w-3 h-3 text-sleek-cyan" />
          <span>Active Bounded Packets ({activeScale.toUpperCase()} scale):</span>
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {filteredPackets.map((p, idx) => (
            <button key={p.id} onClick={() => { setActivePacketIndex(idx); setSelectedSubIndex(p.subdivisions.length - 1); setAiAnalysis(""); }} className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase cursor-pointer tracking-wide transition-all ${packetIndex === idx ? "bg-[#E0AF68] text-black font-extrabold" : "bg-[#101217]/80 text-sleek-muted hover:text-white border border-[#232736]/40"}`}>
              📂 {p.id}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-[#090A0E]/60 border border-[#232736]/40 p-4 rounded-xl space-y-4">
            <div className="flex items-center justify-between text-left">
              <span className="text-[10px] font-mono font-bold text-slate-300 uppercase flex items-center space-x-1.5">
                <Wind className="w-3.5 h-3.5 text-sleek-cyan" />
                <span>1. Continuous Field Mapping ( {activePacket.scaleLabel} )</span>
              </span>
              <span className="text-[9px] font-mono text-sleek-muted">{activePacket.range}</span>
            </div>
            <div className="h-60" id="composed-slice-chart">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={activePacket.subdivisions} margin={{ top: 15, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2128" />
                  <XAxis dataKey="label" stroke="#8A92AC" fontSize={10} fontFamily="monospace" />
                  <YAxis yAxisId="price" stroke="#E0AF68" fontSize={10} fontFamily="monospace" domain={["auto","auto"]} tickFormatter={(v) => `$${(v/1000).toFixed(1)}k`} />
                  <YAxis yAxisId="basis" orientation="right" stroke="#64D2FF" fontSize={10} fontFamily="monospace" domain={["auto","auto"]} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={{ backgroundColor: "#0F1115", borderColor: "#232736", fontFamily: "monospace", fontSize: "11px" }} labelClassName="text-[#E0AF68] font-bold" />
                  <Line yAxisId="price" type="monotone" dataKey="spotPrice" stroke="#E0AF68" strokeWidth={2.5} dot={{ r: 4, stroke: "#E0AF68", strokeWidth: 1, fill: "#090A0E" }} activeDot={{ r: 6 }} name="Spot Price (Anchor)" />
                  <Bar yAxisId="basis" dataKey="futuresBasis" fill="#1E4D6E" stroke="#30A9FF" strokeWidth={1} maxBarSize={30} name="Basis Offset Premium / Discount ($)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-7 gap-2 pt-1 text-left">
              {activePacket.subdivisions.map((d, index) => (
                <button key={d.label} onClick={() => setSelectedSubIndex(index)} className={`p-2 rounded-lg border font-mono transition-all text-left flex flex-col justify-between cursor-pointer ${selectedSubdivisionIndex === index ? "bg-sleek-cyan/15 border-sleek-cyan text-white shadow" : "bg-[#101217] border-[#232736]/60 text-sleek-muted hover:border-[#3a3f52] hover:text-slate-200"}`}>
                  <div>
                    <span className="text-[10px] font-bold block truncate leading-none">{d.label}</span>
                    <span className="text-[8px] text-gray-500 block mt-1 leading-none">{d.date}</span>
                  </div>
                  <div className="mt-2 pt-1 border-t border-white/5 flex items-baseline justify-between select-none">
                    <span className="text-[9px] text-[#E0AF68] font-bold">${(d.spotPrice/1000).toFixed(1)}k</span>
                    <span className={`text-[8.5px] font-bold ${d.futuresBasis >= 0 ? "text-sleek-cyan" : "text-rose-400"}`}>{d.futuresBasis >= 0 ? `+${d.futuresBasis}` : d.futuresBasis}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#090A0E]/40 border border-[#232736]/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#232736]/30 pb-2 text-left">
              <span className="text-[10px] font-mono font-bold text-white uppercase flex items-center space-x-1.5">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                <span>2. Microstructural Wind Velocities inside Bounded Coordinates ({selectedSubdivision.label})</span>
              </span>
              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${getWindIntensityBadgeClass(selectedSubdivision.windIntensity)}`}>
                Wind: {selectedSubdivision.windForce}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 text-left">
              <div className="bg-[#101217]/80 p-2.5 rounded-lg border border-[#232736]/40 font-mono">
                <span className="text-[#8A95A5] uppercase text-[8px] tracking-wide block leading-none">Asset dominance</span>
                <span className="text-white font-bold text-xs mt-1 block">{selectedSubdivision.dominancePercent.toFixed(2)}%</span>
                <span className="text-[7.5px] text-sleek-muted leading-none mt-0.5 block flex items-center gap-0.5"><Activity className="w-2.5 h-2.5" /> Market Share</span>
              </div>
              <div className="bg-[#101217]/80 p-2.5 rounded-lg border border-[#232736]/40 font-mono">
                <span className="text-[#8A95A5] uppercase text-[8px] tracking-wide block leading-none">Realized Volume</span>
                <span className="text-white font-bold text-xs mt-1 block">${selectedSubdivision.volumeB.toFixed(1)}B</span>
                <span className="text-[7.5px] text-sleek-muted leading-none mt-0.5 block">Liquidity depth</span>
              </div>
              <div className="bg-[#101217]/80 p-2.5 rounded-lg border border-[#232736]/40 font-mono">
                <span className="text-[#8A95A5] uppercase text-[8px] tracking-wide block leading-none">Open Interest</span>
                <span className="text-pink-400 font-bold text-xs mt-1 block">${selectedSubdivision.openInterestB.toFixed(1)}B</span>
                <span className="text-[7.5px] text-pink-400/60 leading-none mt-0.5 block">Leverage pool</span>
              </div>
              <div className="bg-[#101217]/80 p-2.5 rounded-lg border border-[#232736]/40 font-mono">
                <span className="text-[#8A95A5] uppercase text-[8px] tracking-wide block leading-none">US Dollar DXY</span>
                <span className="text-amber-400 font-bold text-xs mt-1 block">{selectedSubdivision.dxyIndex.toFixed(1)}</span>
                <span className="text-[7.5px] text-sleek-muted leading-none mt-0.5 block">Fiat pressure</span>
              </div>
              <div className="bg-[#101217]/80 p-2.5 rounded-lg border border-[#232736]/40 font-mono">
                <span className="text-[#8A95A5] uppercase text-[8px] tracking-wide block">VIX Index</span>
                <span className="text-indigo-400 font-bold text-xs mt-1 block">{selectedSubdivision.vixValue.toFixed(1)}</span>
                <span className="text-[7.5px] text-sleek-muted leading-none mt-0.5 block">Macro risk gauge</span>
              </div>
              <div className="bg-[#101217]/80 p-2.5 rounded-lg border border-[#232736]/40 font-mono">
                <span className="text-[#8A95A5] uppercase text-[8px] tracking-wide block">Funding Rate</span>
                <span className={`font-bold text-xs mt-1 block ${selectedSubdivision.fundingRatePercent >= 0 ? "text-sleek-cyan" : "text-rose-400"}`}>
                  {selectedSubdivision.fundingRatePercent >= 0 ? `+${selectedSubdivision.fundingRatePercent}%` : `${selectedSubdivision.fundingRatePercent}%`}
                </span>
                <span className="text-[7.5px] text-sleek-muted leading-none mt-0.5 block">Systemic fee</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="bg-[#0D1017] border border-[#232736]/70 rounded-xl p-4 space-y-4 flex-1 text-left">
            <div className="flex items-center justify-between border-b border-[#232736]/40 pb-2">
              <span className="text-[10px] font-mono font-bold text-slate-300 uppercase flex items-center space-x-1.5">
                <Radio className="w-3.5 h-3.5 text-amber-400" />
                <span>3. struct: SovereignCompressionPacket</span>
              </span>
              <span className="text-[8px] font-mono font-bold text-[#E0AF68] bg-[#E0AF68]/10 border border-[#E0AF68]/20 px-1 rounded uppercase">{activeScale} Bound</span>
            </div>
            <div className="space-y-3 font-mono text-[10px]">
              <div>
                <span className="text-[#8A95A5] uppercase text-[8px] tracking-widest font-bold">Packet Subject:</span>
                <p className="text-white font-bold leading-normal text-[11px] mt-0.5">{activePacket.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 bg-[#08090C] p-2.5 border border-[#232736]/30 rounded-lg">
                <div className="space-y-1">
                  <span className="text-slate-400 text-[8px] font-bold block flex items-center gap-1"><ArrowUpRight className="w-3 h-3 text-[#E0AF68]" /> ANCHOR START</span>
                  <div className="text-xs font-bold text-white">${activePacket.startState.spot.toLocaleString()}</div>
                  <div className="text-[8.5px] text-sleek-muted">Basis: <span className="text-sleek-cyan">${activePacket.startState.basis}</span> | OI: {activePacket.startState.oi}B</div>
                </div>
                <div className="space-y-1 border-l border-[#232736]/40 pl-3">
                  <span className="text-slate-400 text-[8px] font-bold block flex items-center gap-1"><ArrowDownRight className="w-3 h-3 text-sleek-cyan" /> ANCHOR END</span>
                  <div className="text-xs font-bold text-white">${activePacket.endState.spot.toLocaleString()}</div>
                  <div className="text-[8.5px] text-sleek-muted">Basis: <span className="text-sleek-cyan">${activePacket.endState.basis}</span> | OI: {activePacket.endState.oi}B</div>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[#8A95A5] uppercase text-[8px] tracking-widest font-bold">Primary Winds (Drivers):</span>
                <div className="space-y-1.5 pt-1">
                  {activePacket.primaryDrivers.map((driver, index) => (
                    <div key={index} className="flex items-start space-x-1.5 leading-normal">
                      <ChevronRight className="w-3.5 h-3.5 text-[#E0AF68] shrink-0 mt-0.5" />
                      <span className="text-[#A9B1D6] text-[9.5px]">{driver}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-[#232736]/30">
                <div className="bg-rose-500/5 border border-rose-500/10 rounded p-2 text-[9px]">
                  <span className="font-bold uppercase tracking-wider block text-rose-400">Largest Drift Event:</span>
                  <p className="leading-snug text-slate-300 mt-1">{activePacket.largestDriftEvent}</p>
                </div>
                <div className="bg-[#4CD964]/5 border border-[#4CD964]/10 rounded p-2 text-[9px]">
                  <span className="font-bold uppercase tracking-wider block text-[#4CD964]">Largest Convergence Event:</span>
                  <p className="leading-snug text-slate-300 mt-1">{activePacket.largestConvergenceEvent}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1.5 text-[9px] border-t border-[#232736]/20">
                <div>
                  <span className="text-sleek-muted block text-[8px] uppercase">Background Noise:</span>
                  <span className="text-white font-bold">{activePacket.backgroundNoiseLevel}</span>
                </div>
                <div>
                  <span className="text-sleek-muted block text-[8px] uppercase">Field Stability Score:</span>
                  <span className="text-[#4CD964] font-bold">{activePacket.fieldStabilityScore}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#141824] border border-[#a855f7]/20 rounded-xl p-4 space-y-3 flex flex-col justify-between text-left">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <BrainCircuit className="text-purple-400 w-4 h-4 animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">Trace Coprocessor Opinion</span>
              </div>
              <p className="text-[9.5px] text-slate-300 font-mono leading-relaxed">
                Command Gemini to evaluate target <strong>{activeScale.toUpperCase()} Scale</strong> metrics inside our isolated governance sandbox environment.
              </p>
            </div>
            {isAiLoading ? (
              <div className="py-4 flex flex-col items-center justify-center space-y-2 text-xs text-sleek-muted font-mono bg-[#0D1017] border border-white/5 rounded-lg h-32">
                <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
                <span>Decoding wind vector sequences...</span>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-3">
                <div className="bg-[#090A0E] border border-purple-500/10 p-3 rounded-lg h-32 overflow-y-auto text-[10px] font-sans leading-normal text-slate-300 space-y-2">
                  <div className="text-[8px] font-mono text-purple-400 font-bold uppercase tracking-widest border-b border-white/5 pb-1 flex justify-between">
                    <span>Gemini Voice: Flight Leader</span>
                    <span>DEC-CO-001</span>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed">{aiAnalysis}</p>
                </div>
                {aiEvidenceChain && aiEvidenceChain.length > 0 && (
                  <div className="bg-[#090A0E] border border-purple-500/10 p-3 rounded-lg space-y-2">
                    <div className="text-[8px] font-mono text-[#8A95A5] font-bold uppercase tracking-widest border-b border-white/5 pb-1 flex justify-between items-center">
                      <span>🔬 SYSTEM APERTURE EVIDENCE LEDGER</span>
                      <span className="text-[#a855f7] bg-[#a855f7]/10 px-1 rounded font-bold uppercase font-mono text-[7px]">Trace Link Active</span>
                    </div>
                    <div className="max-h-[180px] overflow-y-auto space-y-2 pr-0.5">
                      {aiEvidenceChain.map((item, index) => (
                        <div key={index} className="bg-[#141824]/60 p-2 rounded border border-white/5 text-[9.5px] space-y-1">
                          <div className="flex justify-between items-center font-mono">
                            <span className="text-white font-bold">{item.metric}</span>
                            <span className="text-sleek-cyan bg-sleek-cyan/10 px-1 rounded font-bold text-[9px]">{item.value}</span>
                          </div>
                          <div className="text-[9px] text-[#8692A6]">Limit Interval: <span className="text-slate-300 italic">{item.referenceRange}</span></div>
                          <p className="text-slate-400 font-sans leading-relaxed text-[9px] pt-1 border-t border-white/5 mt-1">{item.impact}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#0D1017] border border-dashed border-[#232736] p-4 rounded-lg h-32 flex items-center justify-center text-center text-sleek-muted text-[10px] font-mono">
                Awaiting Operator Command Trigger...
              </div>
            )}
            {hasPriceDomainMismatch && (
              <div className="bg-rose-500/10 border border-rose-500/25 p-3 rounded-lg space-y-2 text-rose-400">
                <div className="text-[9px] font-mono font-bold uppercase tracking-widest border-b border-rose-500/15 pb-1 flex justify-between items-center">
                  <span>🚨 PRICE_DOMAIN_MISMATCH BLOCK</span>
                  <span className="bg-rose-500/20 px-1 rounded text-[7px] font-bold">Friction Gate Active</span>
                </div>
                <p className="text-[9.5px] font-sans leading-normal">
                  The selected coordinate price universe (<strong className="text-white">${anchorPrice.toLocaleString()}</strong>) belongs to a different domain than the live feed price (<strong className="text-white">${activeSpot.toLocaleString()}</strong>).
                </p>
                <div className="text-[9px] font-mono bg-[#0D1017]/50 p-2 rounded space-y-1 border border-rose-500/10">
                  <div>Price Offset Delta: <span className="font-bold text-white">${priceDifference.toLocaleString()} USD</span></div>
                  <div>Maximum Allowed Drift: <span className="font-bold text-slate-300">${allowedDrift.toLocaleString()} USD</span></div>
                  <div className="text-[#8A95A5] pt-1 mt-1 border-t border-rose-500/10 leading-relaxed">Source Mode: <span className="text-slate-200">{activePacket.sourceMode}</span></div>
                </div>
              </div>
            )}
            <button
              onClick={triggerAiForcesAnalysis}
              disabled={isAiLoading || hasPriceDomainMismatch}
              className={`w-full font-mono text-xs font-bold py-2 rounded-lg flex items-center justify-center space-x-1.5 shadow-md border ${hasPriceDomainMismatch ? "bg-slate-800/40 text-slate-500 border-slate-700/30 cursor-not-allowed" : "bg-[#a855f7] hover:bg-[#b06cf8] text-white border-[#bf7ffc]/20 cursor-pointer transition-colors"}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAiLoading ? "EVALUATING WINDS..." : hasPriceDomainMismatch ? "COPROCESSOR ACCESS BLOCKED" : `GENERATE ${activeScale.toUpperCase()} SCALE DIAGNOSTIC`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

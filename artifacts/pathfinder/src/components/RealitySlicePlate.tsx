import { motion } from "framer-motion";
import { 
  Layers, 
  Coins, 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Percent, 
  Activity, 
  ArrowRight, 
  ChevronRight, 
  Cpu, 
  Eye, 
  Compass, 
  Database,
  Sliders,
  Sparkles,
  HelpCircle,
  HelpCircle as ShieldCheck
} from "lucide-react";
import { RealitySlice } from "../types";

interface RealitySlicePlateProps {
  slice: RealitySlice | null;
  divergenceThreshold: number;
  setDivergenceThreshold: (val: number) => void;
}

export default function RealitySlicePlate({
  slice,
  divergenceThreshold,
  setDivergenceThreshold
}: RealitySlicePlateProps) {
  const activeSpot = slice?.spotPrice ?? 108425.80;
  const activeFutures = slice?.futuresPrice ?? 108460.50;
  const activeDelta = Math.abs(activeSpot - activeFutures);
  const isAligned = activeDelta <= divergenceThreshold;

  const dominance = slice?.btcDominance ?? 58.45;
  const volume = slice?.volume ?? 28450000000;
  const spreadSpot = slice?.spreadSpot ?? 0.85;
  const spreadFutures = slice?.spreadFutures ?? 2.80;
  const depthBidsSpot = slice?.depthBidsSpot ?? 425.8;
  const depthAsksSpot = slice?.depthAsksSpot ?? 412.3;
  const depthBidsFutures = slice?.depthBidsFutures ?? 325.2;
  const depthAsksFutures = slice?.depthAsksFutures ?? 310.5;
  const openInterest = slice?.openInterest ?? 14845000000;
  const futuresBasis = slice?.futuresBasis ?? 0.032;
  const timestampA = slice?.timestampA ?? "15:03:02.105";
  const timestampB = slice?.timestampB ?? "15:03:02.102";
  const latencyA = slice?.latencyA_ms ?? 14.5;
  const latencyB = slice?.latencyB_ms ?? 21.2;

  const simonObservation = isAligned 
    ? "SIMON reports balanced dual-authority baselines. Fluctuations remain within safe tolerances."
    : "SIMON flags dynamic arbitrage opening. Delta exceeds alignment thresholds.";

  const hermesContext = isAligned
    ? "HERMES retrieves nominal rules. System state satisfies consensus expectations."
    : "HERMES identifies divergence limit exceedance. Restoring emergency offset guidelines.";

  const astraMemory = isAligned
    ? "ASTRA confirms alignment. Ideal baseline for standard state commits."
    : "ASTRA records temporary fault isolation block. Retaining volatile state memory.";

  return (
    <div className="bg-sleek-panel border border-sleek-border rounded-xl p-5 shadow-2xl" id="reality-slice-delta-plate-container">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 mb-5 border-b border-[#232736]/40 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 bg-sleek-cyan rounded-full animate-ping shrink-0" />
            <h3 className="text-xs font-bold font-mono tracking-widest text-[#64D2FF] uppercase">
              REAL-TIME OBSERVATION VECTORS & DELTA PLATE
            </h3>
          </div>
          <p className="text-[11px] text-sleek-muted-more font-mono mt-1 text-[#8A92AC]">
            "Real-time compression stream: The packet does not know the field. It listens for frequencies. The aperture decides what deserves attention. The operator decides what deserves meaning."
          </p>
        </div>
        <div className="flex items-center space-x-3 text-[10px] font-mono bg-[#101217] px-3 py-1.5 rounded-lg border border-[#232736]/60">
          <span className="text-sleek-muted">APERTURE LIMIT:</span>
          <span className="text-sleek-cyan font-bold">${divergenceThreshold.toFixed(2)}</span>
          <span className="text-[#3a3f52]">|</span>
          <span className="text-sleek-muted">SLICED DELTA:</span>
          <span className={`font-bold ${isAligned ? "text-[#4CD964]" : "text-sleek-red animate-pulse"}`}>
            ${activeDelta.toFixed(2)}
          </span>
          <span className="text-[#3a3f52]">|</span>
          <span className={`font-bold uppercase text-[9px] px-1.5 py-0.5 rounded ${isAligned ? "text-[#4CD964] bg-[#4CD964]/10" : "text-sleek-red bg-sleek-red/10 animate-pulse"}`}>
            {isAligned ? "● ALIGNED" : "⚠ DIVERGENT"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#090A0E]/80 border border-[#232736]/40 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-[10px] font-mono border-b border-[#232736]/30 pb-1.5">
                <span className="text-sleek-muted uppercase tracking-wider flex items-center space-x-1">
                  <Coins className="w-3.5 h-3.5 text-[#E0AF68] mr-1" />
                  <span>1. Price Vector (Spot)</span>
                </span>
                <span className="text-[#E0AF68] font-bold">TradingView</span>
              </div>
              <div className="font-mono">
                <div className="text-xl font-bold text-white">${activeSpot.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                <div className="text-[9px] text-sleek-muted mt-1 space-y-0.5">
                  <div>Spread: <span className="text-[#E0AF68]">${spreadSpot}</span></div>
                  <div>Bids: <span className="text-[#4CD964]">${depthBidsSpot}M</span> | Asks: <span className="text-sleek-red">${depthAsksSpot}M</span></div>
                </div>
              </div>
            </div>

            <div className="bg-[#090A0E]/80 border border-[#232736]/40 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-[10px] font-mono border-b border-[#232736]/30 pb-1.5">
                <span className="text-sleek-muted uppercase tracking-wider flex items-center space-x-1">
                  <BarChart3 className="w-3.5 h-3.5 text-sleek-cyan mr-1" />
                  <span>2. Price Vector (Futures)</span>
                </span>
                <span className="text-sleek-cyan font-bold">CME</span>
              </div>
              <div className="font-mono">
                <div className="text-xl font-bold text-white">${activeFutures.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                <div className="text-[9px] text-sleek-muted mt-1 space-y-0.5">
                  <div>Spread: <span className="text-sleek-cyan">${spreadFutures}</span></div>
                  <div>Bids: <span className="text-[#4CD964]">${depthBidsFutures}M</span> | Asks: <span className="text-sleek-red">${depthAsksFutures}M</span></div>
                </div>
              </div>
            </div>

            <div className="bg-[#090A0E]/80 border border-[#232736]/40 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-[10px] font-mono border-b border-[#232736]/30 pb-1.5">
                <span className="text-sleek-muted uppercase tracking-wider flex items-center space-x-1">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-400 mr-1" />
                  <span>3. Market Vector</span>
                </span>
                <span className="text-purple-400 font-bold">On-Chain</span>
              </div>
              <div className="font-mono text-[10px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-sleek-muted">BTC Dominance:</span>
                  <span className="text-white font-bold">{dominance.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sleek-muted">Volume 24h:</span>
                  <span className="text-[#4CD964] font-bold">${(volume / 1e9).toFixed(2)}B</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sleek-muted">Open Interest:</span>
                  <span className="text-sleek-cyan font-bold">${(openInterest / 1e9).toFixed(2)}B</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sleek-muted">Futures Basis:</span>
                  <span className="text-amber-400 font-bold">{(futuresBasis * 100).toFixed(3)}%</span>
                </div>
              </div>
            </div>

            <div className="bg-[#090A0E]/80 border border-[#232736]/40 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-[10px] font-mono border-b border-[#232736]/30 pb-1.5">
                <span className="text-sleek-muted uppercase tracking-wider flex items-center space-x-1">
                  <Activity className="w-3.5 h-3.5 text-violet-400 mr-1" />
                  <span>4. Delta Vector</span>
                </span>
                <span className={`font-bold ${isAligned ? "text-[#4CD964]" : "text-sleek-red"}`}>
                  {isAligned ? "ALIGNED" : "DIVERGENT"}
                </span>
              </div>
              <div className="font-mono text-[10px] space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-sleek-muted">Raw Delta:</span>
                  <span className={`font-bold text-sm ${isAligned ? "text-[#4CD964]" : "text-sleek-red"}`}>
                    ${activeDelta.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sleek-muted">Aperture Limit:</span>
                  <span className="text-sleek-cyan font-bold">${divergenceThreshold.toFixed(2)}</span>
                </div>
                <div className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase text-center ${isAligned ? "text-[#4CD964] bg-[#4CD964]/10 border-[#4CD964]/20" : "text-sleek-red bg-sleek-red/10 border-sleek-red/20 animate-pulse"}`}>
                  {isAligned ? "✓ PASS — WITHIN GATE" : "⚠ FAIL — EXCEEDS GATE"}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#090A0E]/80 border border-[#232736]/40 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-[10px] font-mono border-b border-[#232736]/30 pb-1.5">
              <span className="text-sleek-muted uppercase tracking-wider flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-zinc-400 mr-1" />
                <span>5. Time Vector</span>
              </span>
              <span className="text-zinc-400 font-bold">Hardware Timestamp Alignments</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
              <div className="bg-[#101217] p-2.5 rounded flex items-center justify-between">
                <div>
                  <span className="text-sleek-muted text-[9px] block">TIMESTAMP A (SPOT FEED)</span>
                  <span className="text-white font-bold">{timestampA}</span>
                </div>
                <div className="text-right">
                  <span className="text-sleek-muted text-[9px] block">LATENCY</span>
                  <span className="text-[#4CD964] font-bold">{latencyA}ms</span>
                </div>
              </div>
              <div className="bg-[#101217] p-2.5 rounded flex items-center justify-between">
                <div>
                  <span className="text-sleek-muted text-[9px] block">TIMESTAMP B (FUTURES FEED)</span>
                  <span className="text-white font-bold">{timestampB}</span>
                </div>
                <div className="text-right">
                  <span className="text-sleek-muted text-[9px] block">LATENCY</span>
                  <span className="text-sleek-cyan font-bold">{latencyB}ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#090A0E]/50 border border-[#232736]/60 rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-1.5 text-xs font-bold font-mono text-white pb-2 border-b border-[#232736]/40">
              <Compass className="w-4 h-4 text-purple-400" />
              <span>THE DELTA PLATE & APERTURE ROUTER</span>
            </div>

            <div className="space-y-3 font-mono text-[10px]">
              <div className="flex items-start space-x-2.5">
                <div className="w-5 h-5 bg-[#1B2A3A] border border-sleek-cyan text-sleek-cyan rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                  1
                </div>
                <div className="flex-1">
                  <span className="text-slate-200 font-bold uppercase tracking-wider block">Reality Ingestion Vector Stack</span>
                  <p className="text-sleek-muted text-[9px] leading-relaxed">
                    Parallel ingestion pipelines lock 10 unique data vectors for BTCUSD concurrently.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <div className="w-5 h-5 bg-[#2B233A] border border-purple-400 text-purple-300 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                  2
                </div>
                <div className="flex-1">
                  <span className="text-slate-200 font-bold uppercase tracking-wider block">Comparison Map (RAPIDS)</span>
                  <p className="text-sleek-muted text-[9px] leading-relaxed">
                    Sub-nanosecond comparison calculates dynamic Price offset and Timestamp drift.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2.5 border-t border-[#232736]/20 pt-2 bg-[#12141C]/40 p-2 rounded-lg">
                <div className="w-5 h-5 bg-[#1C2C28] border border-[#4CD964] text-[#4CD964] rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                  3
                </div>
                <div className="flex-1 space-y-1.5">
                  <span className="text-slate-200 font-bold uppercase tracking-wider block">Aperture Threshold Evaluation</span>
                  <div>
                    <div className="flex justify-between items-center text-[9px] text-sleek-muted mb-0.5">
                      <span>Divergence Slider Limit:</span>
                      <span className="text-[#30D5C8] font-bold">${divergenceThreshold.toFixed(2)}</span>
                    </div>
                    <input 
                      type="range"
                      min="0.10"
                      max="10.00"
                      step="0.10"
                      value={divergenceThreshold}
                      onChange={(e) => setDivergenceThreshold(parseFloat(e.target.value))}
                      className="w-full accent-sleek-cyan cursor-pointer h-1 bg-[#101217] rounded-lg appearance-none border border-[#232736]"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] pt-1">
                    <span className="text-sleek-muted">STATUS:</span>
                    <span className={`font-bold ${isAligned ? "text-[#4CD964]" : "text-sleek-red animate-pulse"}`}>
                      {isAligned ? "✓ ALIGNED (ACCEPT SAFE PASS)" : "⚠ DIVERGENT (ISOLATED FAULT)"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#12141C]/85 border border-dashed border-[#232736] rounded-lg p-2.5 space-y-1">
              <span className="text-[8px] font-mono font-bold tracking-widest text-slate-400 block uppercase">
                THE CORRECTION COMPASS: DRIFT AS NAVIGATION SIGNAL
              </span>
              <p className="text-[10px] text-[#A9B1D6] font-mono leading-relaxed italic">
                "An aircraft oscillates around its desired heading. Crosswind and turbulence create drift. Drift is not failure; it is the boundary signal triggering correction. The centre absorbs drift, and the flight path converges."
              </p>
            </div>

            <div className="border-t border-[#232736]/40 pt-3 space-y-2">
              <span className="text-[9px] font-mono font-bold uppercase text-sleek-muted tracking-wider block">
                Agentic Observation Trace
              </span>
              
              <div className="space-y-1.5 font-mono text-[9px] text-left">
                <div className="bg-[#101217] p-2 rounded border border-[#232736]/30">
                  <div className="flex items-center space-x-1 text-[#64D2FF] font-bold mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#64D2FF]"></span>
                    <span>SIMON (Observe)</span>
                  </div>
                  <p className="text-slate-300 leading-tight">{simonObservation}</p>
                </div>

                <div className="bg-[#101217] p-2 rounded border border-[#232736]/30">
                  <div className="flex items-center space-x-1 text-slate-300 font-bold mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    <span>HERMES (Retrieve)</span>
                  </div>
                  <p className="text-slate-300 leading-tight">{hermesContext}</p>
                </div>

                <div className="bg-[#101217] p-2 rounded border border-[#232736]/30">
                  <div className="flex items-center space-x-1 text-amber-500 font-bold mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span>ASTRA (Remember)</span>
                  </div>
                  <p className="text-slate-300 leading-tight">{astraMemory}</p>
                </div>
              </div>
            </div>

          </div>

          <div className="mt-4 pt-3 border-t border-[#232736]/40 flex items-center justify-between text-[9px] font-mono text-sleek-muted">
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>APERTURE ACCELERATOR: RUNNING</span>
            </span>
            <span>SYSTEM/APERTURE_ALIGN</span>
          </div>

        </div>

      </div>
    </div>
  );
}

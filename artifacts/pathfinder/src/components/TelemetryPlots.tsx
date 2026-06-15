import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { TelecomTelemetry } from "../types";

interface TelemetryPlotsProps {
  telemetryData: TelecomTelemetry[];
  currentLatencyNs: number;
}

export default function TelemetryPlots({
  telemetryData,
  currentLatencyNs,
}: TelemetryPlotsProps) {
  return (
    <div className="space-y-6" id="telemetry-plots-container">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-sleek-panel border border-sleek-border p-4 rounded-xl shadow-2xl" id="stat-latency">
          <p className="text-xs text-sleek-muted font-mono">SIMULATED CORE LATENCY</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold font-mono text-sleek-green">
              {currentLatencyNs.toFixed(2)}
            </span>
            <span className="text-xs text-sleek-muted font-mono">ns</span>
          </div>
          <span className="text-[10px] text-sleek-green font-mono bg-sleek-green/10 border border-sleek-green/20 px-1.5 py-0.5 rounded mt-2 inline-block">
            Target Limit: &lt;85ns (Simulation Label)
          </span>
        </div>

        <div className="bg-sleek-panel border border-sleek-border p-4 rounded-xl shadow-2xl" id="stat-throughput">
          <p className="text-xs text-sleek-muted font-mono">EMULATED PACKET THROUGHPUT</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold font-mono text-sleek-cyan">2,485</span>
            <span className="text-xs text-sleek-muted font-mono">Kp/s</span>
          </div>
          <span className="text-[10px] text-sleek-cyan font-mono bg-sleek-cyan/10 border border-sleek-cyan/20 px-1.5 py-0.5 rounded mt-2 inline-block">
            Simulated SIMD-512 Vector Mode
          </span>
        </div>

        <div className="bg-sleek-panel border border-sleek-border p-4 rounded-xl shadow-2xl" id="stat-gains">
          <p className="text-xs text-sleek-muted font-mono">PID GAIN (SIMULATED)</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold font-mono text-amber-400">
              {telemetryData[telemetryData.length - 1]?.feedbackGain.toFixed(3) || "1.150"}
            </span>
            <span className="text-xs text-sleek-muted font-mono">Kp</span>
          </div>
          <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded mt-2 inline-block">
            Auto-tuned PID Sim
          </span>
        </div>

        <div className="bg-sleek-panel border border-sleek-border p-4 rounded-xl shadow-2xl" id="stat-alignment">
          <p className="text-xs text-sleek-muted font-mono">SIMULATED CACHE HIT RATES</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold font-mono text-violet-400">
              {(telemetryData[telemetryData.length - 1]?.cacheHitRef * 100).toFixed(1) || "98.8"}
            </span>
            <span className="text-xs text-sleek-muted font-mono">%</span>
          </div>
          <span className="text-[10px] text-violet-400 font-mono bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded mt-2 inline-block">
            Emulated repr(align(64)) metric
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-sleek-panel border border-sleek-border p-4 rounded-xl shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-sleek-text font-mono">
              SIMULATED LATENCY TRENDS OVER TIME
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-sleek-green/10 border border-sleek-green/20 text-sleek-green font-mono">
              Area Curve
            </span>
          </div>
          <div className="h-64 rounded">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4CD964" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4CD964" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2128" />
                <XAxis dataKey="timestamp" stroke="#6B7280" fontSize={11} />
                <YAxis stroke="#6B7280" fontSize={11} domain={[60, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0F1115", borderColor: "#1E2128" }}
                  labelClassName="text-sleek-muted text-xs font-mono"
                  itemStyle={{ color: "#4CD964", fontSize: 12, fontFamily: "monospace" }}
                />
                <Area
                  type="monotone"
                  dataKey="latencyNs"
                  stroke="#4CD964"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorLatency)"
                  name="Latency (ns)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-sleek-panel border border-sleek-border p-4 rounded-xl shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-sleek-text font-mono">
              ADAPTIVE PID FEEDBACK & COMPILER DYNAMICS
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-sleek-cyan/10 border border-sleek-cyan/20 text-sleek-cyan font-mono">
              Proportional Gain (Kp)
            </span>
          </div>
          <div className="h-64 rounded">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2128" />
                <XAxis dataKey="timestamp" stroke="#6B7280" fontSize={11} />
                <YAxis stroke="#6B7280" fontSize={11} domain={[0.5, 2.5]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0F1115", borderColor: "#1E2128" }}
                  labelClassName="text-sleek-muted text-xs font-mono"
                  itemStyle={{ fontSize: 12, fontFamily: "monospace" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontFamily: "monospace", color: "#E0E2E5" }} />
                <Line
                  type="monotone"
                  dataKey="feedbackGain"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  name="Gain Modifier (Kp)"
                />
                <Line
                  type="monotone"
                  dataKey="throughputKps"
                  stroke="#64D2FF"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Virtual Load"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

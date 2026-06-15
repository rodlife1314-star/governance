export interface RustFile {
  path: string;
  name: string;
  layer: "systems" | "core" | "agents" | "documentation";
  latencyImpact: string;
  sizeBytes: number;
  description: string;
  code: string;
}

export interface CompilationReport {
  state?: CompilationState;
  binaryName?: string;
  instructionCount?: number;
  sizeBytes?: number;
  compileTimeMs?: number;
  warnings?: string[];
  logs?: string[];
  success?: boolean;
  latencyNs?: number;
  optimizationsApplied?: string[];
}

export type CompilationState =
  | "idle"
  | "parsing"
  | "codegen"
  | "optimizing"
  | "verification"
  | "linking"
  | "success"
  | "failed_contract";

export interface SystemSignal {
  id: string;
  timestamp: string;
  action: "BUY" | "SELL";
  price: number;
  size: number;
  latencyNs: number;
  inspectDurationNs: number;
  allowedByGate: boolean;
  rejectReason?: string;
}

export interface TelecomTelemetry {
  timestamp: number;
  latencyNs: number;
  throughputKps: number;
  feedbackGain: number;
  cacheHitRef: number;
}

export interface SovereignAudit {
  id?: string;
  packetId: string;
  asset: string;
  authority: string;
  spotPrice: string;
  futuresPrice: string;
  basisDelta: number;
  divergenceState: string;
  operatorDecision: string;
  aiOutcome: string;
  aiSummary: string;
  sliceIntentId: string;
  runtimeMode: string;
  createdAt: string;
  eventLogs: string[];
}

export interface RealitySlice {
  spotPrice: number;
  futuresPrice: number;
  btcDominance: number;
  volume: number;
  spreadSpot: number;
  spreadFutures: number;
  depthBidsSpot: number;
  depthAsksSpot: number;
  depthBidsFutures: number;
  depthAsksFutures: number;
  openInterest: number;
  futuresBasis: number;
  timestampA: string;
  timestampB: string;
  latencyA_ms: number;
  latencyB_ms: number;
  source: string;
  pingMs: number;
}

export interface CanonicalMarketPacket {
  asset: string;
  mode: "LIVE" | "HISTORICAL" | "SIMULATED";
  sourceMode: string;
  priceDomain: string;
  timestamp: string;
  liveSpot: number;
  liveFuture: number;
  midPrice: number;
  basisDelta: number;
  volume24h: number;
  openInterest: number;
  dominance: number;
  dxy: number;
  vix: number;
  fundingRate: number;
  spotPrice: number;
  futuresPrice: number;
  priceDelta: number;
  basisPremium: number;
  authorityA?: string;
  authorityB?: string;
}

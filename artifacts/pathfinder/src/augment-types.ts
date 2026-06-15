export interface DimensionEntry {
  id: string;
  name: string;
  signal: string;
  contribution: number;
  direction: "positive" | "negative" | "neutral";
}

export interface DimensionalAnalysis {
  dimensions: DimensionEntry[];
  pattern: string;
  findings: string[];
  simonSummary: string;
  rapidsCompression: string;
}

export interface LiveFeedData {
  coinbaseSpotPrice: string;
  cmeFuturePrice: string;
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
  pingMs: number;
  source: string;
}

export type FeedStatus = "live" | "cached" | "degraded" | "unavailable";

export interface FeedRecord {
  id: string;
  name: string;
  authority: string;
  authorityUrl: string;
  packetId: string;
  value: number | null;
  valueLabel: string;
  valueUnit: string;
  fetchedAt: number;
  dataTimestamp: string | null;
  refreshIntervalMs: number;
  status: FeedStatus;
  cacheAgeMs: number;
  error: string | null;
  context: string;
}

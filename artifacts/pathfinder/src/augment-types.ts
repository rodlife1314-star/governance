export interface DimensionEntry {
  id: string;
  name: string;
  signal: string;
  contribution: number;
  direction: "positive" | "negative" | "neutral";
}

export interface Finding {
  dimensionId: string;
  text: string;
}

export interface DimensionalAnalysis {
  dimensions: DimensionEntry[];
  pattern: string;
  findings: Finding[];
  simonSummary: string;
  rapidsCompression: string;
}

export interface CitedAuthority {
  shortName: string;
  name: string;
  url: string;
  tier: "primary" | "regulatory" | "reference" | "standard" | "glossary";
  relevance: string;
}

export interface ObservationAnalysis extends DimensionalAnalysis {
  rawObservation: string;
  inferredDomain: string;
  inferredDomainFull: string;
  confidence: number;
  suggestedActions: string[];
  citedAuthorities?: CitedAuthority[];
}

export type DataQualityStatus = "live" | "snapshot" | "unavailable";

export interface DataQuality {
  spot: DataQualityStatus;
  futures: DataQualityStatus;
  volume: DataQualityStatus;
  oi: DataQualityStatus;
  dominance: DataQualityStatus;
  depth: DataQualityStatus;
}

export interface LiveFeedData {
  coinbaseSpotPrice: string;
  cmeFuturePrice: string;
  btcDominance: number | null;
  volume: number | null;
  spreadSpot: number | null;
  spreadFutures: number | null;
  depthBidsSpot: number | null;
  depthAsksSpot: number | null;
  depthBidsFutures: number | null;
  depthAsksFutures: number | null;
  openInterest: number | null;
  futuresBasis: number;
  timestampA: string;
  timestampB: string;
  latencyA_ms: number;
  latencyB_ms: number;
  pingMs: number;
  source: string;
  dataQuality: DataQuality;
}

export type FeedStatus = "live" | "cached" | "degraded" | "unavailable";

export interface FeedRecord {
  id: string;
  name: string;
  authority: string;
  authorityUrl: string;
  definitionAuthority: string;
  definitionUrl: string;
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

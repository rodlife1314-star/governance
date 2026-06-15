import { LiveFeedData } from "./augment-types";

export type AssetId = "BTC" | "XAU" | "NDX" | "US30" | "XAG";

export interface AssetConfig {
  id: AssetId;
  label: string;
  pair: string;
  source: string;
  live: boolean;
  basePrice: number;
  futuresPremiumPct: number;
  volume: number;
  openInterest: number;
  spreadFraction: number;
  depthUnits: string;
}

export const ASSETS: AssetConfig[] = [
  {
    id: "BTC", label: "Bitcoin", pair: "BTC/USD", source: "Coinbase/CME",
    live: true, basePrice: 66800, futuresPremiumPct: 0.0015,
    volume: 26e9, openInterest: 14e9, spreadFraction: 0.00001, depthUnits: "BTC",
  },
  {
    id: "XAU", label: "Gold", pair: "XAU/USD", source: "LBMA/CME",
    live: false, basePrice: 2320, futuresPremiumPct: 0.0008,
    volume: 185e9, openInterest: 58e9, spreadFraction: 0.00005, depthUnits: "oz",
  },
  {
    id: "NDX", label: "NASDAQ", pair: "NDX/USD", source: "CME/CBOE",
    live: false, basePrice: 19500, futuresPremiumPct: 0.0005,
    volume: 98e9, openInterest: 42e9, spreadFraction: 0.00003, depthUnits: "contracts",
  },
  {
    id: "US30", label: "US 30", pair: "US30/USD", source: "CME/DJIA",
    live: false, basePrice: 39200, futuresPremiumPct: 0.0004,
    volume: 76e9, openInterest: 31e9, spreadFraction: 0.00003, depthUnits: "contracts",
  },
  {
    id: "XAG", label: "Silver", pair: "XAG/USD", source: "LBMA/CME",
    live: false, basePrice: 29.5, futuresPremiumPct: 0.0012,
    volume: 24e9, openInterest: 8e9, spreadFraction: 0.0001, depthUnits: "oz",
  },
];

export function getAsset(id: AssetId): AssetConfig {
  return ASSETS.find((a) => a.id === id) ?? ASSETS[0];
}

function jitter(pct: number) {
  return 1 + (Math.random() - 0.5) * 2 * pct;
}

function nowTs() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}:${String(n.getSeconds()).padStart(2,"0")}.${String(n.getMilliseconds()).padStart(3,"0")}`;
}

export function generateMockFeed(asset: AssetConfig): LiveFeedData {
  const spot = asset.basePrice * jitter(0.0006);
  const premium = spot * asset.futuresPremiumPct * (0.6 + Math.random() * 0.8);
  const future = spot + premium;
  const spread = spot * asset.spreadFraction;
  const depth = asset.volume * 0.000012;
  const ts = nowTs();
  const latA = 8 + Math.random() * 18;
  const latB = 12 + Math.random() * 22;
  return {
    coinbaseSpotPrice: spot.toFixed(spot < 100 ? 3 : 2),
    cmeFuturePrice: future.toFixed(future < 100 ? 3 : 2),
    btcDominance: 0,
    volume: asset.volume * jitter(0.04),
    spreadSpot: spread,
    spreadFutures: spread * 1.4,
    depthBidsSpot: depth * jitter(0.08),
    depthAsksSpot: depth * 0.95 * jitter(0.08),
    depthBidsFutures: depth * 1.6 * jitter(0.08),
    depthAsksFutures: depth * 1.55 * jitter(0.08),
    openInterest: asset.openInterest * jitter(0.03),
    futuresBasis: (future - spot) / spot,
    timestampA: ts,
    timestampB: ts,
    latencyA_ms: parseFloat(latA.toFixed(1)),
    latencyB_ms: parseFloat(latB.toFixed(1)),
    pingMs: Math.floor(latA),
    source: asset.source,
  };
}

export function formatPrice(price: string, assetId: AssetId): string {
  const n = parseFloat(price);
  if (assetId === "XAG") return `$${n.toFixed(3)}`;
  if (n < 100) return `$${n.toFixed(3)}`;
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

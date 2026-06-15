export type AssetId = "BTC" | "XAU" | "NDX" | "US30" | "XAG";

export interface AssetConfig {
  id: AssetId;
  label: string;
  pair: string;
  source: string;
}

export const ASSETS: AssetConfig[] = [
  { id: "BTC",  label: "Bitcoin", pair: "BTC/USD",  source: "Coinbase / CoinGecko" },
  { id: "XAU",  label: "Gold",    pair: "XAU/USD",  source: "Yahoo Finance (GC=F)" },
  { id: "NDX",  label: "NASDAQ",  pair: "NDX/USD",  source: "Yahoo Finance (^NDX / NQ=F)" },
  { id: "US30", label: "US 30",   pair: "US30/USD", source: "Yahoo Finance (^DJI / YM=F)" },
  { id: "XAG",  label: "Silver",  pair: "XAG/USD",  source: "Yahoo Finance (SI=F)" },
];

export function getAsset(id: AssetId): AssetConfig {
  return ASSETS.find((a) => a.id === id) ?? ASSETS[0];
}

export function formatPrice(price: string, assetId: AssetId): string {
  const n = parseFloat(price);
  if (assetId === "XAG") return `$${n.toFixed(3)}`;
  if (n < 100) return `$${n.toFixed(3)}`;
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

import { Router } from "express";

const router = Router();

// ── Types ─────────────────────────────────────────────────────────────────────

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

interface CacheEntry {
  record: FeedRecord;
  fetchedAt: number;
}

const CACHE = new Map<string, CacheEntry>();

// ── Raw API helpers ───────────────────────────────────────────────────────────

// Yahoo Finance — requires Referer header to avoid 429
const YF_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://finance.yahoo.com/",
  "Origin": "https://finance.yahoo.com",
};

async function fetchYF(symbol: string): Promise<{ price: number; prevClose: number; marketTime: number }> {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const res = await fetch(url, { headers: YF_HEADERS, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Yahoo Finance HTTP ${res.status} for ${symbol}`);
  const data = await res.json() as Record<string, unknown>;
  const meta = ((data.chart as Record<string, unknown>)?.result as Record<string, unknown>[])?.[0]?.meta as Record<string, unknown>;
  const price = meta?.regularMarketPrice as number;
  if (!price) throw new Error(`Yahoo Finance: no price in response for ${symbol}`);
  const prevClose = (meta?.previousClose ?? meta?.chartPreviousClose ?? price) as number;
  return { price, prevClose, marketTime: (meta?.regularMarketTime as number) ?? Math.floor(Date.now() / 1000) };
}

// Shared raw cache: ExchangeRate API covers both DXY and CHN from one call
let erRaw: { eurusd: number; usdcny: number; updatedAt: number; fetchedAt: number } | null = null;

async function fetchERates(): Promise<{ eurusd: number; usdcny: number; updatedAt: number }> {
  if (erRaw && Date.now() - erRaw.fetchedAt < 60_000) {
    return { eurusd: erRaw.eurusd, usdcny: erRaw.usdcny, updatedAt: erRaw.updatedAt };
  }
  const res = await fetch("https://open.er-api.com/v6/latest/USD", {
    headers: { "Accept": "application/json", "User-Agent": "Pathfinder/1.0" },
    signal: AbortSignal.timeout(7000),
  });
  if (!res.ok) throw new Error(`ExchangeRate API HTTP ${res.status}`);
  const data = await res.json() as Record<string, unknown>;
  const rates = data.rates as Record<string, number>;
  const out = {
    eurusd: rates.EUR,
    usdcny: rates.CNY,
    updatedAt: (data.time_last_update_unix as number) ?? Math.floor(Date.now() / 1000),
  };
  erRaw = { ...out, fetchedAt: Date.now() };
  return out;
}

// CBOE publishes VIX history CSV daily — parse last row
async function fetchCBOEVix(): Promise<{ vix: number; date: string }> {
  const res = await fetch(
    "https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv",
    { signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) throw new Error(`CBOE VIX HTTP ${res.status}`);
  const text = await res.text();
  const lines = text.trim().split("\n").filter(Boolean);
  const last = lines[lines.length - 1];
  // Format: DATE,OPEN,HIGH,LOW,CLOSE
  const parts = last.split(",");
  const close = parseFloat(parts[4]);
  const date = parts[0]?.trim() ?? "";
  if (isNaN(close)) throw new Error("CBOE VIX: could not parse close price");
  return { vix: close, date };
}

// OKX public API — no key, no geo-block observed
async function fetchOKXFunding(): Promise<{ fundingRate: number; nextFundingTime: number; markPrice: number }> {
  const res = await fetch(
    "https://www.okx.com/api/v5/public/funding-rate?instId=BTC-USDT-SWAP",
    { signal: AbortSignal.timeout(7000) }
  );
  if (!res.ok) throw new Error(`OKX funding rate HTTP ${res.status}`);
  const data = await res.json() as Record<string, unknown>;
  const row = (data.data as Record<string, string>[])?.[0];
  if (!row) throw new Error("OKX: no funding rate data");
  return {
    fundingRate: parseFloat(row.fundingRate),
    nextFundingTime: parseInt(row.fundingTime, 10),
    markPrice: parseFloat(row.markPx ?? "0"),
  };
}

async function fetchOKXOpenInterest(): Promise<{ oiUsd: number; oiBTC: number; ts: number }> {
  const res = await fetch(
    "https://www.okx.com/api/v5/public/open-interest?instType=SWAP&instId=BTC-USDT-SWAP",
    { signal: AbortSignal.timeout(7000) }
  );
  if (!res.ok) throw new Error(`OKX open interest HTTP ${res.status}`);
  const data = await res.json() as Record<string, unknown>;
  const row = (data.data as Record<string, string>[])?.[0];
  if (!row) throw new Error("OKX: no open interest data");
  return {
    oiUsd: parseFloat(row.oiUsd),
    oiBTC: parseFloat(row.oi),
    ts: parseInt(row.ts, 10),
  };
}

async function fetchCoinbaseTicker(): Promise<{ bid: number; ask: number; spread: number; volume: number }> {
  const res = await fetch("https://api.exchange.coinbase.com/products/BTC-USD/ticker", {
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`Coinbase Exchange ticker HTTP ${res.status}`);
  const data = await res.json() as Record<string, string>;
  const bid = parseFloat(data.bid);
  const ask = parseFloat(data.ask);
  return { bid, ask, spread: parseFloat((ask - bid).toFixed(3)), volume: parseFloat(data.volume) };
}

// ── Feed definitions ──────────────────────────────────────────────────────────

interface FeedDef {
  id: string;
  name: string;
  authority: string;
  authorityUrl: string;
  definitionAuthority: string;
  definitionUrl: string;
  refreshMs: number;
  valueUnit: string;
  context: string;
  unavailableByDesign?: boolean;
  fetch: () => Promise<{ value: number; valueLabel: string; dataTimestamp: string | null }>;
}

const FEED_DEFS: FeedDef[] = [
  {
    id: "dollar",
    name: "Dollar / DXY",
    authority: "Open Exchange Rates API",
    authorityUrl: "https://open.er-api.com",
    definitionAuthority: "ICE (Intercontinental Exchange)",
    definitionUrl: "https://www.ice.com/usdollarindex",
    refreshMs: 300_000,
    valueUnit: "index",
    context: "EUR/USD inverse as DXY directional proxy (EUR ≈ 57.6% of DXY weight). Higher value = stronger USD = headwind for risk assets including BTC.",
    fetch: async () => {
      const { eurusd, updatedAt } = await fetchERates();
      const dxyProxy = parseFloat((100 / eurusd).toFixed(3));
      return {
        value: dxyProxy,
        valueLabel: `DXY≈${dxyProxy} (EUR/USD ${eurusd.toFixed(4)})`,
        dataTimestamp: new Date(updatedAt * 1000).toISOString(),
      };
    },
  },
  {
    id: "realyields",
    name: "Real Yields / 10Y Treasury",
    authority: "U.S. Treasury via Yahoo Finance",
    authorityUrl: "https://finance.yahoo.com/quote/%5ETNX",
    definitionAuthority: "U.S. Treasury / Federal Reserve",
    definitionUrl: "https://home.treasury.gov/resource-center/data-chart-center/interest-rates",
    refreshMs: 300_000,
    valueUnit: "%",
    context: "10-Year Treasury yield (nominal). Proxy for rate environment — rising yields compress risk asset multiples. TIPS real yield = nominal − breakeven inflation.",
    fetch: async () => {
      const { price, prevClose, marketTime } = await fetchYF("^TNX");
      const change = price - prevClose;
      const sign = change >= 0 ? "+" : "";
      return {
        value: price,
        valueLabel: `10Y Treasury ${price.toFixed(3)}% (${sign}${change.toFixed(3)}%)`,
        dataTimestamp: new Date(marketTime * 1000).toISOString(),
      };
    },
  },
  {
    id: "instflows",
    name: "Institutional Flows / OI",
    authority: "OKX Exchange Public API",
    authorityUrl: "https://www.okx.com/api/v5/public/open-interest?instType=SWAP&instId=BTC-USDT-SWAP",
    definitionAuthority: "CFTC (Commodity Futures Trading Commission)",
    definitionUrl: "https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/CFTCGlossary/index.htm",
    refreshMs: 120_000,
    valueUnit: "USD",
    context: "BTC-USDT perpetual swap open interest in USD from OKX. Rising OI with rising price = strong institutional demand. Falling OI = deleveraging.",
    fetch: async () => {
      const { oiUsd, oiBTC, ts } = await fetchOKXOpenInterest();
      const usdB = (oiUsd / 1e9).toFixed(2);
      return {
        value: oiUsd,
        valueLabel: `OI $${usdB}B (${oiBTC.toFixed(0)} BTC) — OKX SWAP`,
        dataTimestamp: new Date(ts).toISOString(),
      };
    },
  },
  {
    id: "futures",
    name: "Futures Positioning / Funding",
    authority: "OKX Exchange Public API",
    authorityUrl: "https://www.okx.com/api/v5/public/funding-rate?instId=BTC-USDT-SWAP",
    definitionAuthority: "BIS (Bank for International Settlements)",
    definitionUrl: "https://www.bis.org/publ/work803.htm",
    refreshMs: 120_000,
    valueUnit: "rate",
    context: "BTC perpetual funding rate from OKX. Positive = longs paying shorts (bullish crowding). Negative = shorts paying longs (bearish pressure). Settles every 8 hours.",
    fetch: async () => {
      const { fundingRate, nextFundingTime } = await fetchOKXFunding();
      const pct = (fundingRate * 100).toFixed(5);
      const sign = fundingRate >= 0 ? "+" : "";
      const nextH = new Date(nextFundingTime).toISOString().slice(11, 16);
      return {
        value: fundingRate,
        valueLabel: `Funding ${sign}${pct}% — next settlement ${nextH}Z`,
        dataTimestamp: new Date().toISOString(),
      };
    },
  },
  {
    id: "onchain",
    name: "China / CNY Signal",
    authority: "Open Exchange Rates API",
    authorityUrl: "https://open.er-api.com",
    definitionAuthority: "BIS FX Statistics",
    definitionUrl: "https://www.bis.org/statistics/xrusd.htm",
    refreshMs: 300_000,
    valueUnit: "CNY/USD",
    context: "USD/CNY exchange rate as China capital flow proxy. Weaker CNY (higher number) signals capital seeking alternatives. BTC demand from mainland China correlates with CNY depreciation pressure.",
    fetch: async () => {
      const { usdcny, updatedAt } = await fetchERates();
      return {
        value: usdcny,
        valueLabel: `USD/CNY ${usdcny.toFixed(4)}`,
        dataTimestamp: new Date(updatedAt * 1000).toISOString(),
      };
    },
  },
  {
    id: "risksentiment",
    name: "Risk Sentiment / VIX",
    authority: "CBOE Global Indices (cdn.cboe.com)",
    authorityUrl: "https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv",
    definitionAuthority: "CBOE Global Markets",
    definitionUrl: "https://www.cboe.com/tradable_products/vix/",
    refreshMs: 3_600_000,
    valueUnit: "index",
    context: "CBOE Volatility Index daily close from CBOE's own data feed. VIX < 15 = complacency. VIX 15–25 = moderate uncertainty. VIX > 25 = elevated fear. Inversely correlated with risk assets.",
    fetch: async () => {
      const { vix, date } = await fetchCBOEVix();
      const level = vix < 15 ? "LOW FEAR" : vix < 25 ? "MODERATE" : "ELEVATED FEAR";
      return {
        value: vix,
        valueLabel: `VIX ${vix.toFixed(2)} — ${level} (close ${date})`,
        dataTimestamp: date,
      };
    },
  },
  {
    id: "commodity",
    name: "Commodity Complex / WTI",
    authority: "CME Group via Yahoo Finance",
    authorityUrl: "https://finance.yahoo.com/quote/CL%3DF",
    definitionAuthority: "EIA (U.S. Energy Information Administration)",
    definitionUrl: "https://www.eia.gov/petroleum/",
    refreshMs: 300_000,
    valueUnit: "USD/bbl",
    context: "WTI crude oil front-month futures. Commodity risk-on correlates with BTC macro backdrop. Rising crude = expansion signal = favorable environment for risk assets.",
    fetch: async () => {
      const { price, prevClose, marketTime } = await fetchYF("CL=F");
      const change = price - prevClose;
      const sign = change >= 0 ? "+" : "";
      return {
        value: price,
        valueLabel: `WTI $${price.toFixed(2)}/bbl (${sign}${change.toFixed(2)})`,
        dataTimestamp: new Date(marketTime * 1000).toISOString(),
      };
    },
  },
  {
    id: "geopolitics",
    name: "Geopolitics",
    authority: "NO AUTHORITY FEED",
    authorityUrl: "",
    definitionAuthority: "Operator field observation",
    definitionUrl: "",
    refreshMs: Infinity,
    valueUnit: "",
    context: "No suitable free real-time geopolitical risk API available without subscription. Operator field observation required. Dimension held at neutral until human authority supplied.",
    unavailableByDesign: true,
    fetch: async () => { throw new Error("Unavailable by design"); },
  },
  {
    id: "technical",
    name: "Technology Demand / QQQ",
    authority: "Nasdaq via Yahoo Finance",
    authorityUrl: "https://finance.yahoo.com/quote/QQQ",
    definitionAuthority: "Nasdaq Global Indexes",
    definitionUrl: "https://indexes.nasdaqomx.com/index/overview/NDX",
    refreshMs: 300_000,
    valueUnit: "USD",
    context: "Invesco QQQ ETF (Nasdaq-100). Tech sector risk appetite proxy for institutional demand for growth assets. Strong QQQ = favorable macro environment for BTC institutional allocation.",
    fetch: async () => {
      const { price, prevClose, marketTime } = await fetchYF("QQQ");
      const change = ((price - prevClose) / prevClose) * 100;
      const sign = change >= 0 ? "+" : "";
      return {
        value: price,
        valueLabel: `QQQ $${price.toFixed(2)} (${sign}${change.toFixed(2)}%)`,
        dataTimestamp: new Date(marketTime * 1000).toISOString(),
      };
    },
  },
  {
    id: "liquidity",
    name: "Liquidity / Market Depth",
    authority: "Coinbase Exchange Public Ticker API",
    authorityUrl: "https://api.exchange.coinbase.com",
    definitionAuthority: "FINRA Glossary",
    definitionUrl: "https://www.finra.org/investors/learn-to-invest/glossary",
    refreshMs: 30_000,
    valueUnit: "USD",
    context: "BTC-USD live bid/ask spread and 24h volume from Coinbase Exchange order book ticker. Tighter spread = deeper liquidity = lower execution cost for institutional size.",
    fetch: async () => {
      const { bid, ask, spread, volume } = await fetchCoinbaseTicker();
      return {
        value: spread,
        valueLabel: `Spread $${spread.toFixed(3)} | Bid $${bid.toFixed(2)} | Vol ${(volume / 1000).toFixed(1)}k BTC`,
        dataTimestamp: new Date().toISOString(),
      };
    },
  },
];

// ── Cache + fetch logic ───────────────────────────────────────────────────────

function makePacketId(id: string): string {
  return `${id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}

async function fetchFeed(def: FeedDef): Promise<FeedRecord> {
  const now = Date.now();
  const cached = CACHE.get(def.id);
  const cacheAge = cached ? now - cached.fetchedAt : Infinity;

  const defFields = {
    definitionAuthority: def.definitionAuthority,
    definitionUrl: def.definitionUrl,
  };

  if (def.unavailableByDesign) {
    return {
      id: def.id, name: def.name, authority: def.authority, authorityUrl: def.authorityUrl,
      ...defFields,
      packetId: makePacketId(def.id), value: null,
      valueLabel: "UNAVAILABLE — no authority feed by design",
      valueUnit: def.valueUnit, fetchedAt: now, dataTimestamp: null,
      refreshIntervalMs: def.refreshMs, status: "unavailable", cacheAgeMs: 0,
      error: "No free real-time geopolitical risk API. Operator field observation required.",
      context: def.context,
    };
  }

  // Cache fresh enough
  if (cached && cacheAge < def.refreshMs) {
    const halfLife = def.refreshMs * 0.5;
    return { ...cached.record, cacheAgeMs: cacheAge, status: cacheAge < halfLife ? "live" : "cached" };
  }

  // Attempt fresh fetch
  try {
    const result = await def.fetch();
    const record: FeedRecord = {
      id: def.id, name: def.name, authority: def.authority, authorityUrl: def.authorityUrl,
      ...defFields,
      packetId: makePacketId(def.id), value: result.value, valueLabel: result.valueLabel,
      valueUnit: def.valueUnit, fetchedAt: now, dataTimestamp: result.dataTimestamp,
      refreshIntervalMs: def.refreshMs, status: "live", cacheAgeMs: 0,
      error: null, context: def.context,
    };
    CACHE.set(def.id, { record, fetchedAt: now });
    return record;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (cached) {
      return {
        ...cached.record,
        packetId: makePacketId(def.id),
        status: "degraded",
        cacheAgeMs: cacheAge,
        error: errorMsg,
        fetchedAt: now,
      };
    }
    return {
      id: def.id, name: def.name, authority: def.authority, authorityUrl: def.authorityUrl,
      ...defFields,
      packetId: makePacketId(def.id), value: null, valueLabel: "UNAVAILABLE",
      valueUnit: def.valueUnit, fetchedAt: now, dataTimestamp: null,
      refreshIntervalMs: def.refreshMs, status: "unavailable", cacheAgeMs: 0,
      error: errorMsg, context: def.context,
    };
  }
}

export async function fetchAllFeeds(): Promise<FeedRecord[]> {
  return Promise.all(FEED_DEFS.map(fetchFeed));
}

// ── Route ─────────────────────────────────────────────────────────────────────

router.get("/dimensions/feeds", async (req, res) => {
  try {
    const feeds = await fetchAllFeeds();
    res.json({ success: true, feeds, fetchedAt: Date.now() });
  } catch (err: any) {
    req.log.error(err, "dimensions/feeds aggregation failed");
    res.status(500).json({ success: false, error: "Feed aggregation failed" });
  }
});

export default router;

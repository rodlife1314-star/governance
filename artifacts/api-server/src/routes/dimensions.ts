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

// Asset-namespaced cache: key = `${asset}:${feedId}`
const CACHE = new Map<string, CacheEntry>();

// ── Raw API helpers ───────────────────────────────────────────────────────────

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

// ExchangeRate API: covers DXY (EUR), CNY, JPY from one call
let erRaw: { eurusd: number; usdcny: number; usdjpy: number; updatedAt: number; fetchedAt: number } | null = null;

async function fetchERates(): Promise<{ eurusd: number; usdcny: number; usdjpy: number; updatedAt: number }> {
  if (erRaw && Date.now() - erRaw.fetchedAt < 60_000) {
    return { eurusd: erRaw.eurusd, usdcny: erRaw.usdcny, usdjpy: erRaw.usdjpy, updatedAt: erRaw.updatedAt };
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
    usdjpy: rates.JPY,
    updatedAt: (data.time_last_update_unix as number) ?? Math.floor(Date.now() / 1000),
  };
  erRaw = { ...out, fetchedAt: Date.now() };
  return out;
}

async function fetchCBOEVix(): Promise<{ vix: number; date: string }> {
  const res = await fetch(
    "https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv",
    { signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) throw new Error(`CBOE VIX HTTP ${res.status}`);
  const text = await res.text();
  const lines = text.trim().split("\n").filter(Boolean);
  const last = lines[lines.length - 1];
  const parts = last.split(",");
  const close = parseFloat(parts[4]);
  const date = parts[0]?.trim() ?? "";
  if (isNaN(close)) throw new Error("CBOE VIX: could not parse close price");
  return { vix: close, date };
}

async function fetchOKXFunding(): Promise<{ fundingRate: number; nextFundingTime: number }> {
  const res = await fetch(
    "https://www.okx.com/api/v5/public/funding-rate?instId=BTC-USDT-SWAP",
    { signal: AbortSignal.timeout(7000) }
  );
  if (!res.ok) throw new Error(`OKX funding rate HTTP ${res.status}`);
  const data = await res.json() as Record<string, unknown>;
  const row = (data.data as Record<string, string>[])?.[0];
  if (!row) throw new Error("OKX: no funding rate data");
  return { fundingRate: parseFloat(row.fundingRate), nextFundingTime: parseInt(row.fundingTime, 10) };
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
  return { oiUsd: parseFloat(row.oiUsd), oiBTC: parseFloat(row.oi), ts: parseInt(row.ts, 10) };
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

// ── Feed definition type ──────────────────────────────────────────────────────

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

// ── Universal feeds (same for all assets) ─────────────────────────────────────

const UNIVERSAL_FEED_DEFS: FeedDef[] = [
  {
    id: "dollar",
    name: "Dollar / DXY",
    authority: "Open Exchange Rates API",
    authorityUrl: "https://open.er-api.com",
    definitionAuthority: "ICE (Intercontinental Exchange)",
    definitionUrl: "https://www.ice.com/usdollarindex",
    refreshMs: 300_000,
    valueUnit: "index",
    context: "EUR/USD inverse as DXY directional proxy (EUR ≈ 57.6% of DXY weight). Higher value = stronger USD = headwind for risk assets.",
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
    context: "10-Year Treasury yield (nominal). Proxy for rate environment — rising yields compress risk asset multiples.",
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
    id: "risksentiment",
    name: "Risk Sentiment / VIX",
    authority: "CBOE Global Indices (cdn.cboe.com)",
    authorityUrl: "https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv",
    definitionAuthority: "CBOE Global Markets",
    definitionUrl: "https://www.cboe.com/tradable_products/vix/",
    refreshMs: 3_600_000,
    valueUnit: "index",
    context: "CBOE Volatility Index daily close. VIX < 15 = complacency. VIX 15–25 = moderate uncertainty. VIX > 25 = elevated fear.",
    fetch: async () => {
      const { vix, date } = await fetchCBOEVix();
      const level = vix < 15 ? "LOW FEAR" : vix < 25 ? "MODERATE" : "ELEVATED FEAR";
      return { value: vix, valueLabel: `VIX ${vix.toFixed(2)} — ${level} (close ${date})`, dataTimestamp: date };
    },
  },
  {
    id: "commodity",
    name: "Commodity Complex / WTI",
    authority: "CME Group via Yahoo Finance",
    authorityUrl: "https://finance.yahoo.com/quote/CL%3DF",
    definitionAuthority: "EIA (U.S. Energy Information Administration)",
    definitionUrl: "https://www.eia.gov/petroleum/",
    refreshMs: 60_000,
    valueUnit: "USD/bbl",
    context: "WTI crude oil front-month futures. Commodity risk-on correlates with macro backdrop for risk assets.",
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
    id: "technical",
    name: "Technology Demand / QQQ",
    authority: "Nasdaq via Yahoo Finance",
    authorityUrl: "https://finance.yahoo.com/quote/QQQ",
    definitionAuthority: "Nasdaq Global Indexes",
    definitionUrl: "https://indexes.nasdaqomx.com/index/overview/NDX",
    refreshMs: 300_000,
    valueUnit: "USD",
    context: "Invesco QQQ ETF (Nasdaq-100). Tech sector risk appetite proxy for institutional demand for growth assets.",
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
    id: "geopolitics",
    name: "Geopolitics",
    authority: "NO AUTHORITY FEED",
    authorityUrl: "",
    definitionAuthority: "Operator field observation",
    definitionUrl: "",
    refreshMs: Infinity,
    valueUnit: "",
    context: "No free real-time geopolitical risk API available. Operator field observation required.",
    unavailableByDesign: true,
    fetch: async () => { throw new Error("Unavailable by design"); },
  },
];

// ── BTC asset-specific feeds ──────────────────────────────────────────────────

const BTC_FEED_DEFS: FeedDef[] = [
  {
    id: "instflows",
    name: "Institutional Flows / OI",
    authority: "OKX Exchange Public API",
    authorityUrl: "https://www.okx.com/api/v5/public/open-interest?instType=SWAP&instId=BTC-USDT-SWAP",
    definitionAuthority: "CFTC (Commodity Futures Trading Commission)",
    definitionUrl: "https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/CFTCGlossary/index.htm",
    refreshMs: 120_000,
    valueUnit: "USD",
    context: "BTC-USDT perpetual swap open interest in USD from OKX. Rising OI with rising price = strong institutional demand.",
    fetch: async () => {
      const { oiUsd, oiBTC, ts } = await fetchOKXOpenInterest();
      return {
        value: oiUsd,
        valueLabel: `OI $${(oiUsd / 1e9).toFixed(2)}B (${oiBTC.toFixed(0)} BTC) — OKX SWAP`,
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
    context: "BTC perpetual funding rate from OKX. Positive = longs paying shorts (bullish crowding). Negative = shorts paying longs.",
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
    name: "On-Chain / CNY Signal",
    authority: "Open Exchange Rates API",
    authorityUrl: "https://open.er-api.com",
    definitionAuthority: "BIS FX Statistics",
    definitionUrl: "https://www.bis.org/statistics/xrusd.htm",
    refreshMs: 300_000,
    valueUnit: "CNY/USD",
    context: "USD/CNY exchange rate as China capital flow proxy. Weaker CNY = capital seeking alternatives, correlates with BTC demand.",
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
    id: "liquidity",
    name: "Liquidity / Market Depth",
    authority: "Coinbase Exchange Public Ticker API",
    authorityUrl: "https://api.exchange.coinbase.com",
    definitionAuthority: "FINRA Glossary",
    definitionUrl: "https://www.finra.org/investors/learn-to-invest/glossary",
    refreshMs: 30_000,
    valueUnit: "USD",
    context: "BTC-USD live bid/ask spread and 24h volume from Coinbase Exchange. Tighter spread = deeper liquidity.",
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

// ── XAU (Gold) asset-specific feeds ──────────────────────────────────────────

const XAU_FEED_DEFS: FeedDef[] = [
  {
    id: "instflows",
    name: "Gold ETF Flow / GLD",
    authority: "NYSE Arca via Yahoo Finance",
    authorityUrl: "https://finance.yahoo.com/quote/GLD",
    definitionAuthority: "World Gold Council",
    definitionUrl: "https://www.gold.org/goldhub/data/gold-etfs-holdings",
    refreshMs: 300_000,
    valueUnit: "USD",
    context: "SPDR Gold Shares (GLD) ETF. Rising GLD = institutional gold demand accumulating. Tracks physical gold holdings.",
    fetch: async () => {
      const { price, prevClose, marketTime } = await fetchYF("GLD");
      const change = price - prevClose;
      const sign = change >= 0 ? "+" : "";
      return {
        value: price,
        valueLabel: `GLD $${price.toFixed(2)} (${sign}${change.toFixed(2)})`,
        dataTimestamp: new Date(marketTime * 1000).toISOString(),
      };
    },
  },
  {
    id: "futures",
    name: "Safe Haven / JPY",
    authority: "Open Exchange Rates API",
    authorityUrl: "https://open.er-api.com",
    definitionAuthority: "BIS FX Statistics",
    definitionUrl: "https://www.bis.org/statistics/xrusd.htm",
    refreshMs: 300_000,
    valueUnit: "JPY/USD",
    context: "USD/JPY as safe-haven demand proxy. Lower USD/JPY (yen strengthening) = risk-off = historically positive for gold.",
    fetch: async () => {
      const { usdjpy, updatedAt } = await fetchERates();
      return {
        value: usdjpy,
        valueLabel: `USD/JPY ${usdjpy.toFixed(2)}`,
        dataTimestamp: new Date(updatedAt * 1000).toISOString(),
      };
    },
  },
  {
    id: "onchain",
    name: "Precious Metals Ratio / Silver",
    authority: "CME Group via Yahoo Finance",
    authorityUrl: "https://finance.yahoo.com/quote/SI%3DF",
    definitionAuthority: "LBMA (London Bullion Market Association)",
    definitionUrl: "https://www.lbma.org.uk/prices-and-data/precious-metal-prices",
    refreshMs: 300_000,
    valueUnit: "USD/oz",
    context: "Silver front-month futures (SI=F). Gold/Silver ratio = Gold / Silver. Rising ratio = gold outperforming (safe haven bid). Falling ratio = industrial demand rising.",
    fetch: async () => {
      const [gold, silver] = await Promise.all([fetchYF("GC=F"), fetchYF("SI=F")]);
      const ratio = gold.price / silver.price;
      return {
        value: silver.price,
        valueLabel: `SI=F $${silver.price.toFixed(2)}/oz  |  G/S Ratio ${ratio.toFixed(1)}`,
        dataTimestamp: new Date(silver.marketTime * 1000).toISOString(),
      };
    },
  },
  {
    id: "liquidity",
    name: "Inflation Expectations / TIP",
    authority: "iShares via Yahoo Finance",
    authorityUrl: "https://finance.yahoo.com/quote/TIP",
    definitionAuthority: "U.S. Treasury / TIPS",
    definitionUrl: "https://www.treasurydirect.gov/savings-bonds/i-bonds/i-bonds-interest-rates/",
    refreshMs: 300_000,
    valueUnit: "USD",
    context: "iShares TIPS Bond ETF (TIP). Rising TIP = market pricing in higher inflation = real rate concern = historically positive for gold.",
    fetch: async () => {
      const { price, prevClose, marketTime } = await fetchYF("TIP");
      const change = ((price - prevClose) / prevClose) * 100;
      const sign = change >= 0 ? "+" : "";
      return {
        value: price,
        valueLabel: `TIP $${price.toFixed(2)} (${sign}${change.toFixed(2)}%)`,
        dataTimestamp: new Date(marketTime * 1000).toISOString(),
      };
    },
  },
];

// ── NDX (NASDAQ 100) asset-specific feeds ─────────────────────────────────────

const NDX_FEED_DEFS: FeedDef[] = [
  {
    id: "instflows",
    name: "Tech Sector / XLK",
    authority: "NYSE Arca via Yahoo Finance",
    authorityUrl: "https://finance.yahoo.com/quote/XLK",
    definitionAuthority: "GICS Technology Sector",
    definitionUrl: "https://www.msci.com/our-solutions/indexes/gics",
    refreshMs: 300_000,
    valueUnit: "USD",
    context: "Technology Select Sector SPDR Fund (XLK). Tracks S&P 500 tech stocks. XLK flows indicate institutional tech sector positioning.",
    fetch: async () => {
      const { price, prevClose, marketTime } = await fetchYF("XLK");
      const change = ((price - prevClose) / prevClose) * 100;
      const sign = change >= 0 ? "+" : "";
      return {
        value: price,
        valueLabel: `XLK $${price.toFixed(2)} (${sign}${change.toFixed(2)}%)`,
        dataTimestamp: new Date(marketTime * 1000).toISOString(),
      };
    },
  },
  {
    id: "futures",
    name: "Semiconductor Demand / SMH",
    authority: "Nasdaq via Yahoo Finance",
    authorityUrl: "https://finance.yahoo.com/quote/SMH",
    definitionAuthority: "SIA (Semiconductor Industry Association)",
    definitionUrl: "https://www.semiconductors.org/",
    refreshMs: 300_000,
    valueUnit: "USD",
    context: "VanEck Semiconductor ETF (SMH). Semiconductors are a leading indicator for tech earnings and AI infrastructure demand.",
    fetch: async () => {
      const { price, prevClose, marketTime } = await fetchYF("SMH");
      const change = ((price - prevClose) / prevClose) * 100;
      const sign = change >= 0 ? "+" : "";
      return {
        value: price,
        valueLabel: `SMH $${price.toFixed(2)} (${sign}${change.toFixed(2)}%)`,
        dataTimestamp: new Date(marketTime * 1000).toISOString(),
      };
    },
  },
  {
    id: "onchain",
    name: "Growth Appetite / ARKK",
    authority: "NYSE Arca via Yahoo Finance",
    authorityUrl: "https://finance.yahoo.com/quote/ARKK",
    definitionAuthority: "ARK Investment Management",
    definitionUrl: "https://ark-funds.com/funds/arkk/",
    refreshMs: 300_000,
    valueUnit: "USD",
    context: "ARK Innovation ETF (ARKK). Proxy for high-beta growth appetite. ARKK leading NASDAQ = speculative risk-on environment.",
    fetch: async () => {
      const { price, prevClose, marketTime } = await fetchYF("ARKK");
      const change = ((price - prevClose) / prevClose) * 100;
      const sign = change >= 0 ? "+" : "";
      return {
        value: price,
        valueLabel: `ARKK $${price.toFixed(2)} (${sign}${change.toFixed(2)}%)`,
        dataTimestamp: new Date(marketTime * 1000).toISOString(),
      };
    },
  },
  {
    id: "liquidity",
    name: "NASDAQ Volatility / VXN",
    authority: "CBOE via Yahoo Finance",
    authorityUrl: "https://finance.yahoo.com/quote/%5EVXN",
    definitionAuthority: "CBOE Global Markets",
    definitionUrl: "https://www.cboe.com/tradable_products/vxn/",
    refreshMs: 300_000,
    valueUnit: "index",
    context: "CBOE NASDAQ-100 Volatility Index (VXN). Nasdaq-specific fear gauge. VXN > 25 = elevated Nasdaq uncertainty.",
    fetch: async () => {
      const { price, marketTime } = await fetchYF("^VXN");
      const level = price < 20 ? "CALM" : price < 30 ? "MODERATE" : "ELEVATED";
      return {
        value: price,
        valueLabel: `VXN ${price.toFixed(2)} — ${level}`,
        dataTimestamp: new Date(marketTime * 1000).toISOString(),
      };
    },
  },
];

// ── US30 (Dow Jones) asset-specific feeds ─────────────────────────────────────

const US30_FEED_DEFS: FeedDef[] = [
  {
    id: "instflows",
    name: "Dow Jones ETF / DIA",
    authority: "NYSE Arca via Yahoo Finance",
    authorityUrl: "https://finance.yahoo.com/quote/DIA",
    definitionAuthority: "S&P Dow Jones Indices",
    definitionUrl: "https://www.spglobal.com/spdji/en/indices/equity/dow-jones-industrial-average/",
    refreshMs: 300_000,
    valueUnit: "USD",
    context: "SPDR Dow Jones Industrial Average ETF (DIA). Institutional Dow allocation proxy. DIA flow = value/blue-chip rotation signal.",
    fetch: async () => {
      const { price, prevClose, marketTime } = await fetchYF("DIA");
      const change = ((price - prevClose) / prevClose) * 100;
      const sign = change >= 0 ? "+" : "";
      return {
        value: price,
        valueLabel: `DIA $${price.toFixed(2)} (${sign}${change.toFixed(2)}%)`,
        dataTimestamp: new Date(marketTime * 1000).toISOString(),
      };
    },
  },
  {
    id: "futures",
    name: "Value Factor / IWD",
    authority: "NYSE Arca via Yahoo Finance",
    authorityUrl: "https://finance.yahoo.com/quote/IWD",
    definitionAuthority: "FTSE Russell",
    definitionUrl: "https://www.ftserussell.com/products/indices/russell-us",
    refreshMs: 300_000,
    valueUnit: "USD",
    context: "iShares Russell 1000 Value ETF (IWD). Value-factor rotation signal. IWD outperforming = institutional preference for established earnings vs growth.",
    fetch: async () => {
      const { price, prevClose, marketTime } = await fetchYF("IWD");
      const change = ((price - prevClose) / prevClose) * 100;
      const sign = change >= 0 ? "+" : "";
      return {
        value: price,
        valueLabel: `IWD $${price.toFixed(2)} (${sign}${change.toFixed(2)}%)`,
        dataTimestamp: new Date(marketTime * 1000).toISOString(),
      };
    },
  },
  {
    id: "onchain",
    name: "Long Bond / 30Y Treasury",
    authority: "U.S. Treasury via Yahoo Finance",
    authorityUrl: "https://finance.yahoo.com/quote/%5ETYX",
    definitionAuthority: "U.S. Treasury",
    definitionUrl: "https://home.treasury.gov/resource-center/data-chart-center/interest-rates",
    refreshMs: 300_000,
    valueUnit: "%",
    context: "30-Year Treasury yield (^TYX). Long-duration rate environment for dividend and value stocks. Rising 30Y = compression of Dow dividend multiples.",
    fetch: async () => {
      const { price, prevClose, marketTime } = await fetchYF("^TYX");
      const change = price - prevClose;
      const sign = change >= 0 ? "+" : "";
      return {
        value: price,
        valueLabel: `30Y Treasury ${price.toFixed(3)}% (${sign}${change.toFixed(3)}%)`,
        dataTimestamp: new Date(marketTime * 1000).toISOString(),
      };
    },
  },
  {
    id: "liquidity",
    name: "Dividend Yield / DVY",
    authority: "Nasdaq via Yahoo Finance",
    authorityUrl: "https://finance.yahoo.com/quote/DVY",
    definitionAuthority: "Dow Jones Indices",
    definitionUrl: "https://www.spglobal.com/spdji/en/",
    refreshMs: 300_000,
    valueUnit: "USD",
    context: "iShares Select Dividend ETF (DVY). High-dividend stock demand proxy. DVY strength = risk-averse income-seeking = defensive positioning.",
    fetch: async () => {
      const { price, prevClose, marketTime } = await fetchYF("DVY");
      const change = ((price - prevClose) / prevClose) * 100;
      const sign = change >= 0 ? "+" : "";
      return {
        value: price,
        valueLabel: `DVY $${price.toFixed(2)} (${sign}${change.toFixed(2)}%)`,
        dataTimestamp: new Date(marketTime * 1000).toISOString(),
      };
    },
  },
];

// ── XAG (Silver) asset-specific feeds ────────────────────────────────────────

const XAG_FEED_DEFS: FeedDef[] = [
  {
    id: "instflows",
    name: "Silver ETF / SLV",
    authority: "NYSE Arca via Yahoo Finance",
    authorityUrl: "https://finance.yahoo.com/quote/SLV",
    definitionAuthority: "LBMA (London Bullion Market Association)",
    definitionUrl: "https://www.lbma.org.uk/prices-and-data/precious-metal-prices",
    refreshMs: 300_000,
    valueUnit: "USD",
    context: "iShares Silver Trust ETF (SLV). Institutional silver demand proxy. SLV inflows = accumulation signal for physical silver.",
    fetch: async () => {
      const { price, prevClose, marketTime } = await fetchYF("SLV");
      const change = price - prevClose;
      const sign = change >= 0 ? "+" : "";
      return {
        value: price,
        valueLabel: `SLV $${price.toFixed(2)} (${sign}${change.toFixed(2)})`,
        dataTimestamp: new Date(marketTime * 1000).toISOString(),
      };
    },
  },
  {
    id: "futures",
    name: "Industrial Metals / Copper",
    authority: "CME Group via Yahoo Finance",
    authorityUrl: "https://finance.yahoo.com/quote/HG%3DF",
    definitionAuthority: "LME (London Metal Exchange)",
    definitionUrl: "https://www.lme.com/metals/non-ferrous/copper/",
    refreshMs: 300_000,
    valueUnit: "USD/lb",
    context: "Copper front-month futures (HG=F). Industrial metals demand proxy. Silver has 50%+ industrial use — copper demand correlates with silver industrial demand.",
    fetch: async () => {
      const { price, prevClose, marketTime } = await fetchYF("HG=F");
      const change = price - prevClose;
      const sign = change >= 0 ? "+" : "";
      return {
        value: price,
        valueLabel: `Copper $${price.toFixed(3)}/lb (${sign}${change.toFixed(3)})`,
        dataTimestamp: new Date(marketTime * 1000).toISOString(),
      };
    },
  },
  {
    id: "onchain",
    name: "Gold / Silver Ratio",
    authority: "CME Group via Yahoo Finance",
    authorityUrl: "https://finance.yahoo.com/quote/GC%3DF",
    definitionAuthority: "LBMA",
    definitionUrl: "https://www.lbma.org.uk/prices-and-data/precious-metal-prices",
    refreshMs: 300_000,
    valueUnit: "ratio",
    context: "Gold/Silver ratio (GC=F / SI=F). High ratio (>80) = silver historically cheap vs gold. Low ratio (<60) = silver outperforming, industrial demand elevated.",
    fetch: async () => {
      const [gold, silver] = await Promise.all([fetchYF("GC=F"), fetchYF("SI=F")]);
      const ratio = gold.price / silver.price;
      const dir = ratio > 80 ? "SILVER UNDERVALUED" : ratio < 60 ? "SILVER OUTPERFORMING" : "AT PARITY";
      return {
        value: ratio,
        valueLabel: `G/S Ratio ${ratio.toFixed(1)} — ${dir}  |  Gold $${gold.price.toFixed(0)}`,
        dataTimestamp: new Date(gold.marketTime * 1000).toISOString(),
      };
    },
  },
  {
    id: "liquidity",
    name: "Mining Equities / GDXJ",
    authority: "NYSE Arca via Yahoo Finance",
    authorityUrl: "https://finance.yahoo.com/quote/GDXJ",
    definitionAuthority: "VanEck",
    definitionUrl: "https://www.vaneck.com/us/en/investments/junior-gold-miners-etf-gdxj/",
    refreshMs: 300_000,
    valueUnit: "USD",
    context: "VanEck Junior Gold/Silver Miners ETF (GDXJ). Mining equity health is a leveraged leading indicator for precious metals demand.",
    fetch: async () => {
      const { price, prevClose, marketTime } = await fetchYF("GDXJ");
      const change = ((price - prevClose) / prevClose) * 100;
      const sign = change >= 0 ? "+" : "";
      return {
        value: price,
        valueLabel: `GDXJ $${price.toFixed(2)} (${sign}${change.toFixed(2)}%)`,
        dataTimestamp: new Date(marketTime * 1000).toISOString(),
      };
    },
  },
];

// ── Asset feed def map ────────────────────────────────────────────────────────

const ASSET_FEED_DEFS: Record<string, FeedDef[]> = {
  BTC:  BTC_FEED_DEFS,
  XAU:  XAU_FEED_DEFS,
  NDX:  NDX_FEED_DEFS,
  US30: US30_FEED_DEFS,
  XAG:  XAG_FEED_DEFS,
};

function getAssetFeedDefs(asset: string): FeedDef[] {
  const specific = ASSET_FEED_DEFS[asset] ?? BTC_FEED_DEFS;
  return [...UNIVERSAL_FEED_DEFS, ...specific];
}

// ── Cache + fetch logic ───────────────────────────────────────────────────────

function makePacketId(id: string): string {
  return `${id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}

async function fetchFeed(def: FeedDef, asset: string): Promise<FeedRecord> {
  const cacheKey = `${asset}:${def.id}`;
  const now = Date.now();
  const cached = CACHE.get(cacheKey);
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

  if (cached && cacheAge < def.refreshMs) {
    const halfLife = def.refreshMs * 0.5;
    return { ...cached.record, cacheAgeMs: cacheAge, status: cacheAge < halfLife ? "live" : "cached" };
  }

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
    CACHE.set(cacheKey, { record, fetchedAt: now });
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

export async function fetchAllFeeds(asset = "BTC"): Promise<FeedRecord[]> {
  return Promise.all(getAssetFeedDefs(asset).map((def) => fetchFeed(def, asset)));
}

// ── Route ─────────────────────────────────────────────────────────────────────

router.get("/dimensions/feeds", async (req, res) => {
  const asset = String(req.query.asset || "BTC").toUpperCase();
  try {
    const feeds = await fetchAllFeeds(asset);
    res.json({ success: true, feeds, asset, fetchedAt: Date.now() });
  } catch (err: any) {
    req.log.error(err, "dimensions/feeds aggregation failed");
    res.status(500).json({ success: false, error: "Feed aggregation failed" });
  }
});

export default router;

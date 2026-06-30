import { Router } from "express";
import { db } from "@workspace/db";
import { sovereignAudits, languageAuthorities } from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

// ── Timestamp helper ──────────────────────────────────────────────────────────

function nowTs() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}:${String(n.getSeconds()).padStart(2,"0")}.${String(n.getMilliseconds()).padStart(3,"0")}`;
}

// ── Yahoo Finance helper ──────────────────────────────────────────────────────

const YF_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://finance.yahoo.com/",
  "Origin": "https://finance.yahoo.com",
};

interface YFTicker {
  price: number;
  prevClose: number;
  volume: number | null;
}

async function fetchYFTicker(symbol: string): Promise<YFTicker> {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const res = await fetch(url, { headers: YF_HEADERS, signal: AbortSignal.timeout(7000) });
  if (!res.ok) throw new Error(`Yahoo Finance HTTP ${res.status} for ${symbol}`);
  const data = await res.json() as Record<string, unknown>;
  const meta = ((data.chart as Record<string, unknown>)?.result as Record<string, unknown>[])?.[0]?.meta as Record<string, unknown>;
  const price = meta?.regularMarketPrice as number;
  if (!price) throw new Error(`Yahoo Finance: no price for ${symbol}`);
  const prevClose = (meta?.previousClose ?? meta?.chartPreviousClose ?? price) as number;
  const volume = typeof meta?.regularMarketVolume === "number" ? meta.regularMarketVolume as number : null;
  return { price, prevClose, volume };
}

// ── CoinGecko response types ──────────────────────────────────────────────────

interface CoinGeckoGlobal {
  data: {
    market_cap_percentage: { btc: number; [key: string]: number };
  };
}

interface CoinGeckoBitcoin {
  market_data: {
    total_volume: { usd: number };
    current_price: { usd: number };
  };
}

// ── Asset symbol maps ─────────────────────────────────────────────────────────
// Note: XAUUSD=X and XAGUSD=X are not reliably served by Yahoo Finance's chart API.
// Using CME futures symbols as primary reference for precious metals — these ARE the
// standard market reference prices. For indices, we fetch both cash and futures.

const SPOT_SYMBOLS: Record<string, string> = {
  XAU:  "GC=F",   // CME gold futures — primary price reference for gold
  NDX:  "^NDX",   // NASDAQ 100 cash index
  US30: "^DJI",   // Dow Jones Industrial Average
  XAG:  "SI=F",   // CME silver futures — primary price reference for silver
};

const FUTURES_SYMBOLS: Record<string, string> = {
  XAU:  "GC=F",   // same source — cash/futures basis not available via Yahoo Finance
  NDX:  "NQ=F",   // E-mini NASDAQ 100 futures (Chicago Mercantile Exchange)
  US30: "YM=F",   // E-mini DJIA futures (Chicago Mercantile Exchange)
  XAG:  "SI=F",   // same source — cash/futures basis not available via Yahoo Finance
};

const ASSET_SOURCES: Record<string, string> = {
  XAU:  "Yahoo Finance (GC=F / CME Gold Futures)",
  NDX:  "Yahoo Finance (^NDX cash) / Yahoo Finance (NQ=F E-mini)",
  US30: "Yahoo Finance (^DJI cash) / Yahoo Finance (YM=F E-mini)",
  XAG:  "Yahoo Finance (SI=F / CME Silver Futures)",
};

// CME contract multipliers for USD notional conversion.
// Yahoo Finance regularMarketVolume is in contracts, not USD.
// GC=F: 100 troy oz/contract; SI=F: 5000 troy oz/contract;
// NQ=F: $20/point (E-mini NASDAQ 100); YM=F: $5/point (E-mini DJIA mini)
const CONTRACT_MULTIPLIERS: Record<string, number> = {
  "GC=F": 100,      // 100 oz / contract
  "SI=F": 5000,     // 5000 oz / contract
  "NQ=F": 20,       // $20 per index point
  "YM=F": 5,        // $5 per index point
};

// ── Live feed route ───────────────────────────────────────────────────────────

router.get("/sovereign/live-feed", async (req, res) => {
  const asset = String(req.query.asset || "BTC").toUpperCase();
  const t0 = Date.now();
  const ts = nowTs();

  // ── BTC: Coinbase spot + CoinGecko market data ────────────────────────────
  // Note: Binance is geo-restricted from this environment. Using CoinGecko for
  // 24h volume and BTC dominance — both are real, sourced from aggregated exchange data.
  // BTC perp futures price is unavailable without an accessible exchange API.
  if (asset === "BTC") {
    const [coinbaseRes, geckoGlobalRes, geckoBtcRes] =
      await Promise.allSettled([
        fetch("https://api.coinbase.com/v2/prices/BTC-USD/spot", {
          headers: { "Accept": "application/json" },
          signal: AbortSignal.timeout(5000),
        }),
        fetch("https://api.coingecko.com/api/v3/global", {
          headers: { "Accept": "application/json" },
          signal: AbortSignal.timeout(8000),
        }),
        fetch("https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false", {
          headers: { "Accept": "application/json" },
          signal: AbortSignal.timeout(8000),
        }),
      ]);

    const latencyMs = Date.now() - t0;

    // Coinbase spot (primary mandatory source)
    let spot: number | null = null;
    if (coinbaseRes.status === "fulfilled" && coinbaseRes.value.ok) {
      try {
        const data = await coinbaseRes.value.json() as { data: { amount: string } };
        spot = parseFloat(data.data.amount);
        if (isNaN(spot)) spot = null;
      } catch { /* spot stays null */ }
    }

    // CoinGecko global — BTC dominance
    let btcDominance: number | null = null;
    if (geckoGlobalRes.status === "fulfilled" && geckoGlobalRes.value.ok) {
      try {
        const g = await geckoGlobalRes.value.json() as CoinGeckoGlobal;
        btcDominance = g.data?.market_cap_percentage?.btc ?? null;
      } catch { /* stays null */ }
    }

    // CoinGecko coins/bitcoin — 24h volume (aggregated across all exchanges)
    let volume: number | null = null;
    if (geckoBtcRes.status === "fulfilled" && geckoBtcRes.value.ok) {
      try {
        const g = await geckoBtcRes.value.json() as CoinGeckoBitcoin;
        volume = g.market_data?.total_volume?.usd ?? null;
      } catch { /* stays null */ }
    }

    // Spot is mandatory — if unavailable, refuse to serve fabricated data
    if (spot === null) {
      res.json({
        success: false,
        error: "Coinbase spot feed unavailable — no data served",
        source: "unavailable",
      });
      return;
    }

    res.json({
      success: true,
      coinbaseSpotPrice: spot.toFixed(2),
      cmeFuturePrice: spot.toFixed(2),  // futures unavailable — showing spot as reference
      btcDominance,
      volume,
      spreadSpot:       null,  // requires exchange WebSocket — unavailable via REST
      spreadFutures:    null,
      depthBidsSpot:    null,  // requires exchange order book — unavailable via REST
      depthAsksSpot:    null,
      depthBidsFutures: null,
      depthAsksFutures: null,
      openInterest:     null,  // requires CME/exchange subscription
      futuresBasis:     0,     // futures price unavailable — basis cannot be computed
      timestampA: ts,
      timestampB: ts,
      latencyA_ms: latencyMs,
      latencyB_ms: latencyMs,
      pingMs: latencyMs,
      source: "Coinbase (spot) / CoinGecko (volume, dominance)",
      dataQuality: {
        spot:      "live",
        futures:   "unavailable",  // Binance geo-restricted; CME requires subscription
        volume:    volume        !== null ? "live" : "unavailable",
        oi:        "unavailable",  // requires CME subscription or exchange API
        dominance: btcDominance  !== null ? "live" : "unavailable",
        depth:     "unavailable",  // requires exchange WebSocket or order book API
      },
    });
    return;
  }

  // ── Non-BTC: Yahoo Finance spot + futures ───────────────────────────────────
  const spotSymbol    = SPOT_SYMBOLS[asset];
  const futuresSymbol = FUTURES_SYMBOLS[asset];
  const source        = ASSET_SOURCES[asset] ?? "Yahoo Finance";

  if (!spotSymbol || !futuresSymbol) {
    res.status(400).json({ success: false, error: `Unknown asset: ${asset}` });
    return;
  }

  const [spotResult, futuresResult] = await Promise.allSettled([
    fetchYFTicker(spotSymbol),
    fetchYFTicker(futuresSymbol),
  ]);

  const latencyMs = Date.now() - t0;

  const spotData    = spotResult.status    === "fulfilled" ? spotResult.value    : null;
  const futuresData = futuresResult.status === "fulfilled" ? futuresResult.value : null;

  // Both feeds down — refuse to fabricate
  if (spotData === null && futuresData === null) {
    res.json({
      success: false,
      error: `Yahoo Finance feeds unavailable for ${asset} — no data served`,
      source: "unavailable",
    });
    return;
  }

  const spotPrice    = spotData?.price    ?? null;
  const futuresPrice = futuresData?.price ?? null;

  // Need at least spot or futures to have a reference price
  const refPrice = spotPrice ?? futuresPrice!;
  const dp = refPrice < 100 ? 3 : 2;

  const futuresBasis = (spotPrice !== null && futuresPrice !== null)
    ? (futuresPrice - spotPrice) / spotPrice
    : 0;

  // Compute USD notional volume from contract count × multiplier × reference price.
  // Yahoo Finance regularMarketVolume is in contracts, not USD.
  const futuresMultiplier = CONTRACT_MULTIPLIERS[futuresSymbol] ?? null;
  const rawContractVolume = futuresData?.volume ?? null;
  const usdNotionalVolume = (rawContractVolume !== null && futuresMultiplier !== null)
    ? rawContractVolume * futuresMultiplier * refPrice
    : null;

  res.json({
    success: true,
    coinbaseSpotPrice: (spotPrice ?? futuresPrice!).toFixed(dp),
    cmeFuturePrice:    (futuresPrice ?? spotPrice!).toFixed(dp),
    btcDominance: null,
    volume:           usdNotionalVolume,
    spreadSpot:       null,
    spreadFutures:    null,
    depthBidsSpot:    null,
    depthAsksSpot:    null,
    depthBidsFutures: null,
    depthAsksFutures: null,
    openInterest:     null,
    futuresBasis,
    timestampA: ts,
    timestampB: ts,
    latencyA_ms: latencyMs,
    latencyB_ms: latencyMs,
    pingMs: latencyMs,
    source,
    dataQuality: {
      spot:      spotData    !== null ? "live" : "unavailable",
      futures:   futuresData !== null ? "live" : "unavailable",
      volume:    (futuresData?.volume ?? null) !== null ? "live" : "unavailable",
      oi:        "unavailable",
      dominance: "unavailable",
      depth:     "unavailable",
    },
  });
});

// ── Sovereign audits ──────────────────────────────────────────────────────────

router.get("/sovereign/audits", async (req, res) => {
  try {
    const audits = await db
      .select()
      .from(sovereignAudits)
      .orderBy(desc(sovereignAudits.createdAt))
      .limit(50);
    res.json({ success: true, audits });
  } catch (err: any) {
    req.log.error(err, "Failed to fetch sovereign audits");
    res.status(500).json({ success: false, error: "Failed to fetch audits" });
  }
});

router.post("/sovereign/audits", async (req, res) => {
  try {
    const {
      id: reqId, authority, asset, price, packetId, operatorEmail, logs, signature,
      verified, operatorDecision, divergenceState, divergenceDelta
    } = req.body;

    const id = reqId || `AUDIT-${randomUUID().substring(0, 8).toUpperCase()}`;
    const createdAt = new Date().toISOString();

    await db.insert(sovereignAudits).values({
      id,
      authority: authority ?? "TradingView",
      asset: asset ?? "BTCUSD",
      price: price ?? "0.00",
      packetId: packetId ?? "PKT-AUTH-001",
      operatorEmail: operatorEmail ?? "operator@pathfinder",
      logs: Array.isArray(logs) ? logs : [],
      signature: signature ?? `SIG-${Date.now()}`,
      createdAt,
      verified: verified ?? false,
      operatorDecision: operatorDecision ?? "PENDING",
      divergenceState: divergenceState ?? "ALIGNED",
      divergenceDelta: divergenceDelta ?? 0,
    });

    res.json({ success: true, id, createdAt });
  } catch (err: any) {
    req.log.error(err, "Failed to insert sovereign audit");
    res.status(500).json({ success: false, error: "Failed to record audit" });
  }
});

// ── Language authorities ──────────────────────────────────────────────────────

router.get("/language/authorities", async (req, res) => {
  try {
    const records = await db
      .select()
      .from(languageAuthorities)
      .orderBy(desc(languageAuthorities.createdAt))
      .limit(100);

    const mapped = records.map((r) => ({
      id: r.id,
      authority_name: r.authorityName,
      jurisdiction: r.jurisdiction,
      domain: r.domain,
      language_layer: r.languageLayer,
      source_type: r.sourceType,
      definition_url: r.definitionUrl,
      structured_code_system: r.structuredCodeSystem,
      operator_approved: r.operatorApproved,
      createdAt: r.createdAt,
      defined_term: r.definedTerm,
      meaning: r.meaning,
    }));

    res.json({ success: true, records: mapped });
  } catch (err: any) {
    req.log.error(err, "Failed to fetch language authorities");
    res.status(500).json({ success: false, error: "Failed to fetch records" });
  }
});

router.post("/language/authorities", async (req, res) => {
  try {
    const {
      authority_name, jurisdiction, domain, language_layer, source_type,
      definition_url, structured_code_system, operator_approved, defined_term, meaning
    } = req.body;

    const id = randomUUID();
    const createdAt = new Date().toISOString();

    await db.insert(languageAuthorities).values({
      id,
      authorityName: authority_name,
      jurisdiction: jurisdiction ?? "Global",
      domain: domain ?? "legal_context",
      languageLayer: language_layer ?? "plain_patient",
      sourceType: source_type ?? "Operator Manual Admission",
      definitionUrl: definition_url ?? "https://",
      structuredCodeSystem: structured_code_system ?? "Custom",
      operatorApproved: operator_approved ?? true,
      createdAt,
      definedTerm: defined_term,
      meaning,
    });

    res.json({ success: true, id, createdAt });
  } catch (err: any) {
    req.log.error(err, "Failed to insert language authority");
    res.status(500).json({ success: false, error: "Failed to record authority" });
  }
});

router.delete("/language/authorities/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(languageAuthorities).where(eq(languageAuthorities.id, id));
    res.json({ success: true });
  } catch (err: any) {
    req.log.error(err, "Failed to delete language authority");
    res.status(500).json({ success: false, error: "Failed to delete record" });
  }
});

export default router;

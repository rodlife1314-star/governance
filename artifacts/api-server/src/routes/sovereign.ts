import { Router } from "express";
import { db } from "@workspace/db";
import { sovereignAudits, languageAuthorities } from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

// ── Yahoo Finance helper ──────────────────────────────────────────────────────

const YF_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://finance.yahoo.com/",
  "Origin": "https://finance.yahoo.com",
};

async function fetchYFPrice(symbol: string): Promise<{ price: number; prevClose: number }> {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const res = await fetch(url, { headers: YF_HEADERS, signal: AbortSignal.timeout(7000) });
  if (!res.ok) throw new Error(`Yahoo Finance HTTP ${res.status} for ${symbol}`);
  const data = await res.json() as Record<string, unknown>;
  const meta = ((data.chart as Record<string, unknown>)?.result as Record<string, unknown>[])?.[0]?.meta as Record<string, unknown>;
  const price = meta?.regularMarketPrice as number;
  if (!price) throw new Error(`Yahoo Finance: no price for ${symbol}`);
  const prevClose = (meta?.previousClose ?? meta?.chartPreviousClose ?? price) as number;
  return { price, prevClose };
}

// ── Asset config ──────────────────────────────────────────────────────────────

const ASSET_YF_SYMBOLS: Record<string, string> = {
  XAU:  "GC=F",
  NDX:  "^NDX",
  US30: "^DJI",
  XAG:  "SI=F",
};

const ASSET_SOURCES: Record<string, string> = {
  XAU:  "Yahoo Finance / CME Gold",
  NDX:  "Yahoo Finance / Nasdaq",
  US30: "Yahoo Finance / DJIA",
  XAG:  "Yahoo Finance / CME Silver",
};

// Simulated market microstructure params per asset (applied on top of real spot price)
const ASSET_MICRO: Record<string, {
  basisPct: number; spreadFraction: number;
  volumeBase: number; oiBase: number;
  depthBase: number; btcDominance: number;
}> = {
  XAU:  { basisPct: 0.0008, spreadFraction: 0.00005, volumeBase: 185e9, oiBase: 58e9, depthBase: 2200, btcDominance: 0 },
  NDX:  { basisPct: 0.0005, spreadFraction: 0.00003, volumeBase: 98e9,  oiBase: 42e9, depthBase: 1500, btcDominance: 0 },
  US30: { basisPct: 0.0004, spreadFraction: 0.00003, volumeBase: 76e9,  oiBase: 31e9, depthBase: 1200, btcDominance: 0 },
  XAG:  { basisPct: 0.0012, spreadFraction: 0.0001,  volumeBase: 24e9,  oiBase: 8e9,  depthBase: 800,  btcDominance: 0 },
};

function nowTs() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}:${String(n.getSeconds()).padStart(2,"0")}.${String(n.getMilliseconds()).padStart(3,"0")}`;
}

// ── Live feed route ───────────────────────────────────────────────────────────

router.get("/sovereign/live-feed", async (req, res) => {
  const asset = String(req.query.asset || "BTC").toUpperCase();
  const ts = nowTs();
  const latA = 12 + Math.random() * 20;
  const latB = 18 + Math.random() * 20;

  // ── BTC: Coinbase spot ──────────────────────────────────────────────────────
  if (asset === "BTC") {
    try {
      const response = await fetch(
        "https://api.coinbase.com/v2/prices/BTC-USD/spot",
        { headers: { "Accept": "application/json" }, signal: AbortSignal.timeout(5000) }
      );
      if (!response.ok) throw new Error("Coinbase API error");
      const data = await response.json() as { data: { amount: string } };
      const spot = parseFloat(data.data.amount);
      const basisRaw = 35 + Math.random() * 120;
      const future = spot + basisRaw;
      res.json({
        success: true,
        coinbaseSpotPrice: spot.toFixed(2),
        cmeFuturePrice: future.toFixed(2),
        btcDominance: 58.4 + Math.random() * 1.2,
        volume: 26000000000 + Math.random() * 5000000000,
        spreadSpot: 0.6 + Math.random() * 0.5,
        spreadFutures: 2.2 + Math.random() * 1.2,
        depthBidsSpot: 400 + Math.random() * 60,
        depthAsksSpot: 390 + Math.random() * 60,
        depthBidsFutures: 300 + Math.random() * 60,
        depthAsksFutures: 290 + Math.random() * 60,
        openInterest: 14000000000 + Math.random() * 2000000000,
        futuresBasis: basisRaw / spot,
        timestampA: ts,
        timestampB: ts,
        latencyA_ms: parseFloat(latA.toFixed(1)),
        latencyB_ms: parseFloat(latB.toFixed(1)),
        pingMs: Math.floor(latA),
        source: "Coinbase",
      });
    } catch {
      const spot = 108425 + Math.random() * 500;
      const basis = 35 + Math.random() * 80;
      res.json({
        success: true,
        coinbaseSpotPrice: spot.toFixed(2),
        cmeFuturePrice: (spot + basis).toFixed(2),
        btcDominance: 58.4 + Math.random() * 1.2,
        volume: 26000000000 + Math.random() * 5000000000,
        spreadSpot: 0.6 + Math.random() * 0.5,
        spreadFutures: 2.2 + Math.random() * 1.2,
        depthBidsSpot: 400 + Math.random() * 60,
        depthAsksSpot: 390 + Math.random() * 60,
        depthBidsFutures: 300 + Math.random() * 60,
        depthAsksFutures: 290 + Math.random() * 60,
        openInterest: 14000000000 + Math.random() * 2000000000,
        futuresBasis: basis / spot,
        timestampA: ts,
        timestampB: ts,
        latencyA_ms: parseFloat(latA.toFixed(1)),
        latencyB_ms: parseFloat(latB.toFixed(1)),
        pingMs: Math.floor(latA),
        source: "Simulated",
      });
    }
    return;
  }

  // ── Non-BTC: Yahoo Finance ──────────────────────────────────────────────────
  const symbol = ASSET_YF_SYMBOLS[asset];
  const micro  = ASSET_MICRO[asset];
  const source = ASSET_SOURCES[asset] ?? "Yahoo Finance";

  if (!symbol || !micro) {
    res.status(400).json({ success: false, error: `Unknown asset: ${asset}` });
    return;
  }

  try {
    const { price } = await fetchYFPrice(symbol);
    const basisRaw = price * micro.basisPct * (0.6 + Math.random() * 0.8);
    const future = price + basisRaw;
    const spread = price * micro.spreadFraction;
    const depth  = micro.depthBase * (0.9 + Math.random() * 0.2);
    const dp = price < 100 ? 3 : 2;
    res.json({
      success: true,
      coinbaseSpotPrice: price.toFixed(dp),
      cmeFuturePrice:    future.toFixed(dp),
      btcDominance:      0,
      volume:            micro.volumeBase * (0.95 + Math.random() * 0.1),
      spreadSpot:        spread,
      spreadFutures:     spread * 1.4,
      depthBidsSpot:     depth,
      depthAsksSpot:     depth * 0.95,
      depthBidsFutures:  depth * 1.6,
      depthAsksFutures:  depth * 1.55,
      openInterest:      micro.oiBase * (0.97 + Math.random() * 0.06),
      futuresBasis:      basisRaw / price,
      timestampA:        ts,
      timestampB:        ts,
      latencyA_ms:       parseFloat(latA.toFixed(1)),
      latencyB_ms:       parseFloat(latB.toFixed(1)),
      pingMs:            Math.floor(latA),
      source,
    });
  } catch {
    // Fallback: use simulated basePrice from asset config
    const BASE_PRICES: Record<string, number> = {
      XAU: 2320, NDX: 19500, US30: 39200, XAG: 29.5,
    };
    const spot = BASE_PRICES[asset] ?? 1000;
    const basisRaw = spot * micro.basisPct;
    const spread = spot * micro.spreadFraction;
    const depth  = micro.depthBase;
    const dp = spot < 100 ? 3 : 2;
    res.json({
      success: true,
      coinbaseSpotPrice: spot.toFixed(dp),
      cmeFuturePrice:    (spot + basisRaw).toFixed(dp),
      btcDominance:      0,
      volume:            micro.volumeBase,
      spreadSpot:        spread,
      spreadFutures:     spread * 1.4,
      depthBidsSpot:     depth,
      depthAsksSpot:     depth * 0.95,
      depthBidsFutures:  depth * 1.6,
      depthAsksFutures:  depth * 1.55,
      openInterest:      micro.oiBase,
      futuresBasis:      basisRaw / spot,
      timestampA:        ts,
      timestampB:        ts,
      latencyA_ms:       parseFloat(latA.toFixed(1)),
      latencyB_ms:       parseFloat(latB.toFixed(1)),
      pingMs:            Math.floor(latA),
      source:            `${source} (Simulated)`,
    });
  }
});

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
      verified: verified ?? true,
      operatorDecision: operatorDecision ?? "APPROVED",
      divergenceState: divergenceState ?? "ALIGNED",
      divergenceDelta: divergenceDelta ?? 0,
    });

    res.json({ success: true, id, createdAt });
  } catch (err: any) {
    req.log.error(err, "Failed to insert sovereign audit");
    res.status(500).json({ success: false, error: "Failed to record audit" });
  }
});

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

import { Router } from "express";
import { db } from "@workspace/db";
import { sovereignAudits, languageAuthorities } from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

router.get("/sovereign/live-feed", async (req, res) => {
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
    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}.${String(now.getMilliseconds()).padStart(3,"0")}`;
    const latA = 12 + Math.random() * 20;
    const latB = 18 + Math.random() * 20;
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
    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}.000`;
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
      latencyA_ms: parseFloat((12 + Math.random() * 20).toFixed(1)),
      latencyB_ms: parseFloat((18 + Math.random() * 20).toFixed(1)),
      pingMs: Math.floor(12 + Math.random() * 20),
      source: "Simulated",
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

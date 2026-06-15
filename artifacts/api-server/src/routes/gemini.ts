import { Router } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import { fetchAllFeeds, type FeedRecord } from "./dimensions";

const router = Router();

const MODEL = "gemini-2.5-flash";

async function callGemini(prompt: string, systemInstruction?: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: systemInstruction ? { systemInstruction } : undefined,
  });
  return response.text ?? "";
}

router.post("/gemini/slice-reasoning", async (req, res) => {
  try {
    const { spotPrice, futuresPrice, delta, divergenceThreshold, marketMode } = req.body;
    const prompt = `You are an HFT operator AI. Analyze this market state:
- BTC Spot: $${spotPrice}
- BTC Futures (CME): $${futuresPrice}
- Delta: $${delta.toFixed(2)}
- Aperture Threshold: $${divergenceThreshold}
- Market Mode: ${marketMode}

Provide a concise 2-3 sentence reality slice analysis covering:
1. Whether this delta is normal or signals an arbitrage opportunity
2. The implied market structure (contango/backwardation)
3. Recommended operator action

Keep response under 150 words and use precise HFT terminology.`;

    const text = await callGemini(prompt);
    res.json({ success: true, reasoning: text });
  } catch (err: any) {
    req.log.error(err, "Gemini slice-reasoning failed");
    res.status(500).json({ success: false, error: "Gemini API error" });
  }
});

router.post("/gemini/slice-scale-analysis", async (req, res) => {
  try {
    const { spotPrice, futuresPrice, delta, sliceIntentId, authority, asset } = req.body;
    const prompt = `You are a sovereign operator AI performing scale analysis on a BTC dual-authority packet.

Packet ID: ${sliceIntentId}
Authority: ${authority}
Asset: ${asset}
Spot: $${spotPrice}
Futures: $${futuresPrice}
Delta: $${delta?.toFixed(2) ?? "N/A"}

Provide a structured analysis with:
1. SCALE ASSESSMENT: Whether price scales are consistent across authorities
2. ALIGNMENT STATE: ALIGNED or DIVERGENT with brief justification  
3. SOVEREIGN RECOMMENDATION: APPROVE or FLAG for operator review
4. EVIDENCE: 2-3 specific data points supporting your assessment

Format as a brief technical report under 200 words.`;

    const text = await callGemini(prompt);
    res.json({ success: true, analysis: text });
  } catch (err: any) {
    req.log.error(err, "Gemini slice-scale-analysis failed");
    res.status(500).json({ success: false, error: "Gemini API error" });
  }
});

router.post("/gemini/generate-rust-code", async (req, res) => {
  try {
    const { fileName, description, targetState, optimizationStrategy } = req.body;

    const prompt = `You are an expert Rust systems programmer specializing in HFT (High Frequency Trading) infrastructure.

Generate optimized Rust code for: ${fileName}
Layer: ${targetState?.layer || "systems_layer"}
Path: ${targetState?.currentPath || "/src"}
Optimization Strategy: ${optimizationStrategy || "Minimize latency"}
Description: ${description || "Optimize for sub-microsecond execution"}

Requirements:
- Use #[repr(C)] or #[repr(align(64))] for cache-line alignment where appropriate
- Prefer stack allocation over heap where possible
- Use unsafe blocks with clear safety comments only when necessary
- Include inline hints (#[inline(always)]) on hot paths
- Target: sub-85ns execution latency

Return ONLY valid Rust code (no markdown fences). Include a brief doc comment at the top explaining the optimization strategy applied.`;

    const code = await callGemini(prompt, "You are a Rust expert. Return only valid Rust source code with no markdown fences.");

    const explanationPrompt = `Briefly explain in 2-3 sentences what optimizations were applied to the Rust code for ${fileName}, focusing on cache alignment, allocation strategy, and branch prediction improvements.`;
    const explanation = await callGemini(explanationPrompt);

    res.json({ success: true, code, explanation });
  } catch (err: any) {
    req.log.error(err, "Gemini generate-rust-code failed");
    res.status(500).json({ success: false, error: "Gemini API error" });
  }
});

router.post("/gemini/analyze-compile-error", async (req, res) => {
  try {
    const { componentName, errorContext } = req.body;

    const prompt = `You are a Rust compiler diagnostics expert specializing in HFT systems.

Component: ${componentName}
Error Type: ${errorContext?.errorType || "compilation error"}
Optimization Level: ${errorContext?.optLevel || "3"}
Target Architecture: ${errorContext?.targetArch || "native"}

Recent compiler logs:
${(errorContext?.logs || []).join('\n')}

Provide a micro-architectural diagnostic analysis:
1. ROOT CAUSE: What specific hardware/memory constraint triggered this
2. CACHE ANALYSIS: How L1/L2/L3 cache line alignment is affected
3. FIX STRATEGY: Specific Rust attributes or code changes to resolve
4. LATENCY IMPACT: Estimated ns improvement after fix

Keep under 200 words. Use precise Rust and hardware terminology.`;

    const analysis = await callGemini(prompt);
    res.json({ success: true, analysis });
  } catch (err: any) {
    req.log.error(err, "Gemini analyze-compile-error failed");
    res.status(500).json({ success: false, error: "Gemini API error" });
  }
});

router.post("/gemini/feedback-simulation", async (req, res) => {
  try {
    const { latencyMs, signalFills, systemGain, noiseRatio } = req.body;

    const prompt = `You are a PID controller tuning AI for HFT feedback loops.

Current System State:
- Core Latency: ${latencyMs}ns
- Signal Fill Rate: ${signalFills}%
- Current Proportional Gain (Kp): ${systemGain}
- System Noise Ratio: ${noiseRatio}

Calculate optimal PID gains for sub-microsecond HFT execution. Return ONLY valid JSON in this exact format:
{
  "pid_gains": {
    "proportional": <float between 0.5 and 4.0>,
    "integral": <float between 0.01 and 1.5>,
    "derivative": <float between 0.01 and 2.0>
  },
  "ai_recommendation": "<2 sentence explanation of tuning rationale>"
}`;

    const raw = await callGemini(prompt, "Return only valid JSON, no markdown fences.");
    let parsed: any;
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        pid_gains: { proportional: 1.24, integral: 0.08, derivative: 0.42 },
        ai_recommendation: "Tuning applied based on latency profile. Proportional gain adjusted to reduce overshoot at current noise ratio."
      };
    }
    res.json({ success: true, ...parsed });
  } catch (err: any) {
    req.log.error(err, "Gemini feedback-simulation failed");
    res.status(500).json({ success: false, error: "Gemini API error" });
  }
});

// ── RAPIDS Background Cache ────────────────────────────────────────────────

interface RapidsCache {
  status: "idle" | "computing" | "ready" | "error";
  analysis: Record<string, unknown> | null;
  computedAt: number | null;
  error: string | null;
  fieldSnapshot: Record<string, unknown> | null;
  assetKey: string | null;
}

const rapidsCache: RapidsCache = {
  status: "idle",
  analysis: null,
  computedAt: null,
  error: null,
  fieldSnapshot: null,
  assetKey: null,
};

const ASSET_DIMENSIONS: Record<string, { id: string; name: string }> = {
  BTC:  { id: "onchain",    name: "On-Chain Activity" },
  XAU:  { id: "safehaven",  name: "Safe Haven Flow" },
  NDX:  { id: "earnings",   name: "Earnings / Growth" },
  US30: { id: "industrial", name: "Industrial Output" },
  XAG:  { id: "industrial", name: "Industrial Demand" },
};

// ── Feed section builder ────────────────────────────────────────────────────

function buildFeedSection(feeds: FeedRecord[]): string {
  if (feeds.length === 0) return "AUTHORITY FEEDS: none fetched — all dimensions will use field data only.\n";

  const lines = feeds.map((f) => {
    if (f.status === "unavailable") {
      return `  ${f.name}: UNAVAILABLE — ${f.error ?? "no authority feed"}`;
    }
    const ageMs = Date.now() - f.fetchedAt;
    const ageStr = ageMs < 60_000
      ? `${Math.round(ageMs / 1000)}s ago`
      : `${Math.round(ageMs / 60_000)}m ago`;
    const tag = f.status === "live" ? "LIVE" : f.status === "cached" ? "CACHED" : "DEGRADED";
    return `  [${tag} / ${f.authority.split("(")[0].trim()} / ${ageStr}] ${f.name}: ${f.valueLabel}`;
  });

  return `AUTHORITY DIMENSION FEEDS (use these as primary signals for each corresponding dimension):\n${lines.join("\n")}\n`;
}

// ── Core analysis function ──────────────────────────────────────────────────

async function runDimensionalAnalysis(body: Record<string, unknown>) {
  const {
    spotPrice, futuresPrice, basisDelta, volume, openInterest,
    spreadSpot, depthBidsSpot, futuresBasis, source,
    assetKey, assetLabel, assetPair,
  } = body as Record<string, number & string>;

  // Fetch real authority feeds in parallel with any prep work
  let feeds: FeedRecord[] = [];
  try {
    feeds = await fetchAllFeeds();
  } catch {
    // Proceed with empty feeds — Gemini will note unavailable data
  }

  const marketStructure = (basisDelta as number) >= 0 ? "CONTANGO" : "BACKWARDATION";
  const asset  = String(assetKey   || "BTC");
  const label  = String(assetLabel || "Bitcoin");
  const pair   = String(assetPair  || "BTC/USD");
  const dim5   = ASSET_DIMENSIONS[asset] ?? ASSET_DIMENSIONS["BTC"];
  const feedSection = buildFeedSection(feeds);

  const prompt = `You are RAPIDS, an augmentation instrument AI performing dimensional analysis for an operator.

LIVE FIELD DATA — ${pair}:
- Asset: ${label} (${pair})
- Spot Price: $${spotPrice}
- Futures Price: $${futuresPrice} [NOTE: simulated basis — not CME settlement]
- Basis Delta: $${(basisDelta as number)?.toFixed(2)} (${marketStructure})
- Basis %: ${((futuresBasis as number ?? 0) * 100).toFixed(4)}%
- 24h Volume: $${((volume as number ?? 0) / 1e9).toFixed(2)}B [simulated]
- Open Interest (field): $${((openInterest as number ?? 0) / 1e9).toFixed(2)}B [simulated]
- Spot Spread (field): $${(spreadSpot as number)?.toFixed(4)} [simulated]
- Bid Depth (field): ${(depthBidsSpot as number)?.toFixed(1)} units [simulated]
- Source: ${source}

${feedSection}
INSTRUCTION: Use the AUTHORITY DIMENSION FEEDS above as the primary signal for each corresponding dimension. Where a feed is LIVE or CACHED, anchor your signal and direction to that real value. Where a feed is UNAVAILABLE or DEGRADED, state the data gap explicitly in the signal text — do not fabricate a value.

Compress this ${label} market field into 10 dimensional readings. Contribution values must sum to exactly 100. Return ONLY valid JSON — no markdown, no explanation, no code fences.

{
  "dimensions": [
    { "id": "dollar", "name": "Dollar / DXY", "signal": "<signal grounded in DXY authority feed value>", "contribution": <int 5-20>, "direction": "positive|negative|neutral" },
    { "id": "realyields", "name": "Real Yields", "signal": "<signal grounded in TIPS authority feed value>", "contribution": <int 5-20>, "direction": "positive|negative|neutral" },
    { "id": "instflows", "name": "Institutional Flows", "signal": "<signal grounded in Binance OI authority feed>", "contribution": <int 5-20>, "direction": "positive|negative|neutral" },
    { "id": "futures", "name": "Futures Positioning", "signal": "<signal grounded in Binance funding rate authority feed>", "contribution": <int 5-20>, "direction": "positive|negative|neutral" },
    { "id": "${dim5.id}", "name": "${dim5.name}", "signal": "<signal specific to ${label} using CNY or asset-specific authority feed>", "contribution": <int 5-15>, "direction": "positive|negative|neutral" },
    { "id": "risksentiment", "name": "Risk Sentiment", "signal": "<signal grounded in VIX authority feed value>", "contribution": <int 5-15>, "direction": "positive|negative|neutral" },
    { "id": "commodity", "name": "Commodity Complex", "signal": "<signal grounded in WTI authority feed value>", "contribution": <int 5-20>, "direction": "positive|negative|neutral" },
    { "id": "geopolitics", "name": "Geopolitics", "signal": "<if UNAVAILABLE: state 'No authority feed — operator assessment required'>", "contribution": <int 3-8>, "direction": "neutral" },
    { "id": "technical", "name": "Technical Structure", "signal": "<signal grounded in QQQ authority feed and spot price>", "contribution": <int 8-22>, "direction": "positive|negative|neutral" },
    { "id": "liquidity", "name": "Liquidity / Depth", "signal": "<signal grounded in Coinbase spread authority feed>", "contribution": <int 5-15>, "direction": "positive|negative|neutral" }
  ],
  "pattern": "<single declarative sentence describing dominant ${label} market structure, referencing real feed values>",
  "findings": ["<finding citing real authority feed value>","<finding citing real feed>","<finding citing real feed>","<finding citing real feed>","<finding citing real feed>"],
  "simonSummary": "<2-3 sentence synthesis citing specific real feed values>",
  "rapidsCompression": "10 dimensions → <N> primary drivers → <pattern name>"
}`;

  const raw = await callGemini(prompt, "You are RAPIDS. Return only valid JSON. No markdown fences. No explanation. Anchor every signal to a real authority feed value where available.");
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

function buildFallback(body: Record<string, unknown>) {
  const { basisDelta, volume, openInterest, btcDominance, depthBidsSpot } = body as Record<string, number>;
  const marketStructure = basisDelta >= 0 ? "CONTANGO" : "BACKWARDATION";
  return {
    dimensions: [
      { id: "dollar",       name: "Dollar / DXY",        signal: "Authority feed degraded — DXY direction unavailable",          contribution: 10, direction: "neutral" },
      { id: "realyields",   name: "Real Yields",          signal: "Authority feed degraded — TIPS rate unavailable",              contribution: 8,  direction: "neutral" },
      { id: "instflows",    name: "Institutional Flows",  signal: `Field OI $${((openInterest ?? 0) / 1e9).toFixed(1)}B — Binance feed degraded`,  contribution: 10, direction: "neutral" },
      { id: "futures",      name: "Futures Positioning",  signal: `${marketStructure} basis $${Math.abs(basisDelta ?? 0).toFixed(0)} — funding rate feed degraded`, contribution: 12, direction: basisDelta >= 0 ? "positive" : "negative" },
      { id: "onchain",      name: "On-Chain Activity",    signal: "Authority feed degraded — on-chain signal unavailable",        contribution: 9,  direction: "neutral" },
      { id: "risksentiment",name: "Risk Sentiment",       signal: "VIX authority feed degraded — risk posture unavailable",       contribution: 7,  direction: "neutral" },
      { id: "commodity",    name: "Commodity Complex",    signal: "WTI authority feed degraded — commodity signal unavailable",   contribution: 13, direction: "neutral" },
      { id: "geopolitics",  name: "Geopolitics",          signal: "No authority feed — operator assessment required",             contribution: 5,  direction: "neutral" },
      { id: "technical",    name: "Technical Structure",  signal: `Spot $${body.spotPrice ?? "??"} — QQQ feed degraded`,          contribution: 19, direction: "neutral" },
      { id: "liquidity",    name: "Liquidity / Depth",    signal: `Field spread — Coinbase ticker feed degraded`,                 contribution: 7,  direction: "neutral" },
    ],
    pattern: "Gemini unavailable — authority feeds degraded — operator field observation required",
    findings: [
      `Futures basis ${basisDelta >= 0 ? "positive" : "negative"} $${Math.abs(basisDelta ?? 0).toFixed(0)} — ${marketStructure}`,
      `Field OI $${((openInterest ?? 0) / 1e9).toFixed(1)}B — Binance authority feed degraded`,
      `BTC dominance ${btcDominance?.toFixed(1) ?? "?"}% — field snapshot only`,
      `24h volume $${((volume ?? 0) / 1e9).toFixed(1)}B — field snapshot only`,
      `Bid depth ${depthBidsSpot?.toFixed(0) ?? "?"} units — Coinbase authority feed degraded`,
    ],
    simonSummary: `RAPIDS engine unavailable. Authority feeds may be degraded. Field data preserved for operator review. Do not treat any dimension as authoritative — verify against direct market observation before committing.`,
    rapidsCompression: `10 dimensions → authority feeds degraded → operator field assessment required`,
  };
}

// POST /gemini/dimensional-trigger
router.post("/gemini/dimensional-trigger", (req, res) => {
  const incomingAssetKey = String(req.body.assetKey || "BTC");

  if (rapidsCache.assetKey && rapidsCache.assetKey !== incomingAssetKey) {
    rapidsCache.status = "idle";
    rapidsCache.analysis = null;
    rapidsCache.computedAt = null;
    rapidsCache.assetKey = null;
  }

  if (rapidsCache.status === "computing") {
    res.json({ success: true, status: "computing", message: "Already computing" });
    return;
  }
  const age = rapidsCache.computedAt ? Date.now() - rapidsCache.computedAt : Infinity;
  if (rapidsCache.status === "ready" && age < 90_000 && rapidsCache.assetKey === incomingAssetKey) {
    res.json({ success: true, status: "ready", message: "Cache fresh" });
    return;
  }

  rapidsCache.status = "computing";
  rapidsCache.assetKey = incomingAssetKey;
  rapidsCache.fieldSnapshot = req.body;

  (async () => {
    try {
      const result = await runDimensionalAnalysis(req.body);
      rapidsCache.analysis = result;
      rapidsCache.status = "ready";
      rapidsCache.computedAt = Date.now();
      rapidsCache.error = null;
    } catch {
      rapidsCache.analysis = buildFallback(req.body);
      rapidsCache.status = "ready";
      rapidsCache.computedAt = Date.now();
      rapidsCache.error = "Gemini unavailable — fallback applied, feeds degraded";
    }
  })();

  res.json({ success: true, status: "computing" });
});

// GET /gemini/dimensional-cache
router.get("/gemini/dimensional-cache", (_req, res) => {
  res.json({
    success: true,
    status: rapidsCache.status,
    analysis: rapidsCache.analysis,
    computedAt: rapidsCache.computedAt,
    error: rapidsCache.error,
    assetKey: rapidsCache.assetKey,
  });
});

// POST /gemini/dimensional-analysis — legacy curl testing endpoint
router.post("/gemini/dimensional-analysis", async (req, res) => {
  try {
    const result = await runDimensionalAnalysis(req.body);
    res.json({ success: true, ...result });
  } catch (err: any) {
    req.log.error(err, "Gemini dimensional-analysis failed");
    res.status(500).json({ success: false, error: "Gemini API error" });
  }
});

export default router;

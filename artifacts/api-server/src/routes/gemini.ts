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

// dim5 name overrides per asset — id is always "onchain" to match the feed ID
const ASSET_DIMENSIONS: Record<string, { id: string; name: string }> = {
  BTC:  { id: "onchain", name: "On-Chain Activity" },
  XAU:  { id: "onchain", name: "Precious Metals Ratio" },
  NDX:  { id: "onchain", name: "Growth Appetite" },
  US30: { id: "onchain", name: "Long Bond Signal" },
  XAG:  { id: "onchain", name: "Gold / Silver Ratio" },
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
  // Declare asset variables first — used in fetchAllFeeds
  const asset  = String(body.assetKey   || "BTC");
  const label  = String(body.assetLabel || "Bitcoin");
  const pair   = String(body.assetPair  || "BTC/USD");

  const spotPrice    = body.spotPrice    as number | null | undefined;
  const futuresPrice = body.futuresPrice as number | null | undefined;
  const basisDelta   = body.basisDelta   as number | null | undefined;
  const futuresBasis = body.futuresBasis as number | null | undefined;
  const volume       = body.volume       as number | null | undefined;
  const openInterest = body.openInterest as number | null | undefined;
  const spreadSpot   = body.spreadSpot   as number | null | undefined;
  const depthBidsSpot = body.depthBidsSpot as number | null | undefined;
  const source       = String(body.source || "unknown");

  // Fetch real authority feeds for this specific asset
  let feeds: FeedRecord[] = [];
  try {
    feeds = await fetchAllFeeds(asset);
  } catch {
    // Proceed with empty feeds — Gemini will note unavailable data
  }

  const marketStructure = (basisDelta ?? 0) >= 0 ? "CONTANGO" : "BACKWARDATION";
  const dim5   = ASSET_DIMENSIONS[asset] ?? ASSET_DIMENSIONS["BTC"];
  const feedSection = buildFeedSection(feeds);

  // Asset-specific feed names for dynamic prompt slots
  const instflowsFeed = feeds.find((f) => f.id === "instflows");
  const futuresFeed   = feeds.find((f) => f.id === "futures");
  const onchainFeed   = feeds.find((f) => f.id === "onchain");
  const liquidityFeed = feeds.find((f) => f.id === "liquidity");

  const instflowsName = instflowsFeed?.name ?? "Institutional Flows";
  const futuresName   = futuresFeed?.name   ?? "Futures Positioning";
  const onchainName   = onchainFeed?.name   ?? dim5.name;
  const liquidityName = liquidityFeed?.name ?? "Liquidity / Depth";

  // Build field data lines — only include fields that have real values
  const fieldLines: string[] = [
    `- Asset: ${label} (${pair})`,
    `- Spot Price: $${spotPrice ?? "unavailable"} [${spotPrice != null ? `${source} / live snapshot` : "feed unavailable"}]`,
    `- Futures Price: $${futuresPrice ?? "unavailable"} [${futuresPrice != null ? `${source} / live snapshot` : "feed unavailable"}]`,
    `- Basis Delta: ${basisDelta != null ? `$${basisDelta.toFixed(2)} (${marketStructure})` : "unavailable — futures or spot feed down"}`,
    `- Basis %: ${futuresBasis != null ? `${(futuresBasis * 100).toFixed(4)}%` : "unavailable"}`,
    `- 24h Volume: ${volume != null ? `$${(volume / 1e9).toFixed(2)}B [${source} / live]` : "unavailable — no live volume feed"}`,
    `- Open Interest: ${openInterest != null ? `$${(openInterest / 1e9).toFixed(2)}B [${source} / live]` : "unavailable — OI not available from REST snapshot"}`,
    `- Spot Spread: ${spreadSpot != null ? `$${spreadSpot.toFixed(4)} [${source} / live bid-ask]` : "unavailable — spread not available for this instrument"}`,
    `- Best Bid Qty: ${depthBidsSpot != null ? `${depthBidsSpot.toFixed(4)} units [${source} / book ticker]` : "unavailable — order book not available"}`,
    `- Source: ${source}`,
  ];

  const prompt = `You are RAPIDS, an augmentation instrument AI performing dimensional analysis for an operator.

CRITICAL — DATA INTEGRITY RULE: Do not fabricate, estimate, or substitute any quantitative value. Where a field above is marked "unavailable", state it is unavailable in your signal text — never guess or use a typical value. Silence is preferable to fabrication.

LIVE FIELD DATA — ${pair}:
${fieldLines.join("\n")}

${feedSection}
INSTRUCTION: Use the AUTHORITY DIMENSION FEEDS above as the primary signal for each corresponding dimension. Where a feed is LIVE or CACHED, anchor your signal and direction to that real value. Where a feed is UNAVAILABLE or DEGRADED, state the data gap explicitly in the signal text — do not fabricate a value. All signals must be relevant to ${label} — do not reference BTC-specific metrics when analyzing other assets.

Compress this ${label} market field into 10 dimensional readings. Contribution values must sum to exactly 100. Return ONLY valid JSON — no markdown, no explanation, no code fences.

{
  "dimensions": [
    { "id": "dollar", "name": "Dollar / DXY", "signal": "<signal grounded in DXY authority feed value — impact on ${label}>", "contribution": <int 5-20>, "direction": "positive|negative|neutral" },
    { "id": "realyields", "name": "Real Yields", "signal": "<signal grounded in 10Y Treasury authority feed value — impact on ${label}>", "contribution": <int 5-20>, "direction": "positive|negative|neutral" },
    { "id": "instflows", "name": "${instflowsName}", "signal": "<signal grounded in ${instflowsName} authority feed value>", "contribution": <int 5-20>, "direction": "positive|negative|neutral" },
    { "id": "futures", "name": "${futuresName}", "signal": "<signal grounded in ${futuresName} authority feed value>", "contribution": <int 5-20>, "direction": "positive|negative|neutral" },
    { "id": "onchain", "name": "${onchainName}", "signal": "<signal grounded in ${onchainName} authority feed value — specific to ${label}>", "contribution": <int 5-15>, "direction": "positive|negative|neutral" },
    { "id": "risksentiment", "name": "Risk Sentiment / VIX", "signal": "<signal grounded in VIX authority feed value — impact on ${label}>", "contribution": <int 5-15>, "direction": "positive|negative|neutral" },
    { "id": "commodity", "name": "Commodity Complex / WTI", "signal": "<signal grounded in WTI authority feed value>", "contribution": <int 5-20>, "direction": "positive|negative|neutral" },
    { "id": "geopolitics", "name": "Geopolitics", "signal": "<if UNAVAILABLE: state 'No authority feed — operator assessment required'>", "contribution": <int 3-8>, "direction": "neutral" },
    { "id": "technical", "name": "Technical Structure / QQQ", "signal": "<signal grounded in QQQ authority feed and ${label} spot price>", "contribution": <int 8-22>, "direction": "positive|negative|neutral" },
    { "id": "liquidity", "name": "${liquidityName}", "signal": "<signal grounded in ${liquidityName} authority feed value>", "contribution": <int 5-15>, "direction": "positive|negative|neutral" }
  ],
  "pattern": "<single declarative sentence describing dominant ${label} market structure, referencing real feed values>",
  "findings": [
    { "dimensionId": "<one of: dollar|realyields|instflows|futures|onchain|risksentiment|commodity|geopolitics|technical|liquidity>", "text": "<finding anchored to that dimension's authority feed value — ${label}-specific>" },
    { "dimensionId": "<dimension id>", "text": "<finding anchored to that dimension's authority feed value>" },
    { "dimensionId": "<dimension id>", "text": "<finding anchored to that dimension's authority feed value>" },
    { "dimensionId": "<dimension id>", "text": "<finding anchored to that dimension's authority feed value>" },
    { "dimensionId": "<dimension id>", "text": "<finding anchored to that dimension's authority feed value>" }
  ],
  "simonSummary": "<2-3 sentence synthesis citing specific real feed values — all analysis must be ${label}-specific>",
  "rapidsCompression": "10 dimensions → <N> primary drivers → <pattern name>"
}`;

  const raw = await callGemini(prompt, [
    "You are RAPIDS. Return only valid JSON. No markdown fences. No explanation.",
    "Anchor every signal to a real authority feed value where available.",
    "CRITICAL — DATA INTEGRITY: Do not fabricate, estimate, or substitute any quantitative value.",
    "Where a field is marked 'unavailable', state it is unavailable — never guess or use a typical value.",
    "Reality comes first. Silence is preferable to fabrication.",
  ].join(" "));
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

function buildFallback(body: Record<string, unknown>) {
  const spotPrice = body.spotPrice as number | undefined;
  return {
    dimensions: [
      { id: "dollar",        name: "Dollar / DXY",        signal: "Authority feed degraded — DXY direction unavailable",          contribution: null, direction: "unknown" },
      { id: "realyields",    name: "Real Yields",          signal: "Authority feed degraded — TIPS rate unavailable",              contribution: null, direction: "unknown" },
      { id: "instflows",     name: "Institutional Flows",  signal: "Authority feed degraded — institutional flow signal unavailable", contribution: null, direction: "unknown" },
      { id: "futures",       name: "Futures Positioning",  signal: "Authority feed degraded — futures positioning unavailable",    contribution: null, direction: "unknown" },
      { id: "onchain",       name: "On-Chain Activity",    signal: "Authority feed degraded — on-chain signal unavailable",        contribution: null, direction: "unknown" },
      { id: "risksentiment", name: "Risk Sentiment",       signal: "Authority feed degraded — VIX risk posture unavailable",       contribution: null, direction: "unknown" },
      { id: "commodity",     name: "Commodity Complex",    signal: "Authority feed degraded — WTI commodity signal unavailable",   contribution: null, direction: "unknown" },
      { id: "geopolitics",   name: "Geopolitics",          signal: "No authority feed — operator assessment required",             contribution: null, direction: "unknown" },
      { id: "technical",     name: "Technical Structure",  signal: `Spot $${spotPrice ?? "unavailable"} — QQQ authority feed degraded, technical read unavailable`, contribution: null, direction: "unknown" },
      { id: "liquidity",     name: "Liquidity / Depth",    signal: "Authority feed degraded — liquidity signal unavailable",       contribution: null, direction: "unknown" },
    ],
    pattern: "RAPIDS engine unavailable — all authority feeds degraded — operator field observation required",
    findings: [
      { dimensionId: "dollar",       text: "DXY authority feed degraded — dollar direction cannot be determined" },
      { dimensionId: "realyields",   text: "TIPS rate feed degraded — real yield posture unavailable" },
      { dimensionId: "technical",    text: `Spot $${spotPrice ?? "unavailable"} — QQQ feed degraded, no technical read` },
      { dimensionId: "risksentiment",text: "VIX authority feed degraded — risk sentiment cannot be assessed" },
      { dimensionId: "liquidity",    text: "Liquidity authority feed degraded — depth and spread unavailable" },
    ],
    simonSummary: `RAPIDS engine unavailable — authority feeds degraded. No dimensional weights are authoritative. Do not use these readings to inform operator decisions — verify all dimensions against direct market observation before committing.`,
    rapidsCompression: `10 dimensions → all feeds degraded → operator field assessment required`,
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
      rapidsCache.status = "error";
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

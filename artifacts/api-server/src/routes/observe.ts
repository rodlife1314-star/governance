import { Router } from "express";
import { ai } from "@workspace/integrations-gemini-ai";

const router = Router();
const MODEL = "gemini-2.5-flash";

async function callGemini(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction: "You are RAPIDS. Return only valid JSON. No markdown fences. No explanation outside the JSON.",
    },
  });
  return response.text ?? "";
}

function buildObservationPrompt(observation: string): string {
  return `You are RAPIDS, a dimensional augmentation instrument. An operator has made a raw observation. Your role is to reveal what the operator cannot see without augmentation.

RAW OBSERVATION: "${observation}"

Instructions:
1. Read this observation without pre-classifying it
2. Infer the domain and sub-domain from the content
3. Discover 10 analytical dimensions that are genuinely relevant to THIS observation — not generic categories, but real analytical lenses that could reveal something new
4. Score each dimension's contribution to the overall picture (contributions must sum to exactly 100)
5. Assign a direction: positive (amplifying/bullish/supportive), negative (suppressing/bearish/contrary), or neutral
6. Identify the dominant pattern — one precise declarative sentence
7. Generate exactly 5 findings, each anchored to a different dimension
8. Suggest 3-5 operator actions specific to this observation (not generic)

Dimension discovery rules by domain:
- Finance/Markets: currency, yields, institutional flows, futures positioning, sentiment, commodity, geopolitics, technicals, liquidity, on-chain/sector-specific
- Medicine/Clinical: onset chronology, vital signs, laboratory markers, imaging findings, medication history, differential diagnosis, risk factors, evidence base, guideline alignment, contraindication flags
- Law/Legal: case precedent, applicable statute, jurisdictional scope, burden of proof, evidence weight, timeline, damages exposure, appeal pathway, regulatory compliance, contract terms
- Technology/Systems: architectural integrity, security posture, performance metrics, scalability, technical debt, dependency risk, code coverage, observability, data flow, failure modes
- Science/Research: evidence quality, methodology soundness, data integrity, replication status, peer review, statistical significance, confounding variables, publication bias, instrument calibration, hypothesis specificity
- Astrophysics/Space: photometric data, spectral analysis, orbital mechanics, temporal variation, energy flux, spatial coordinates, instrument calibration, catalog comparison, cosmological context, prediction confidence
- Food/Culinary: ingredient cost, margin, labour intensity, shelf life, seasonality, allergen profile, preparation complexity, waste factor, staff training, guest experience
- General: if none of the above — choose the 10 lenses most likely to reveal something the operator cannot see unaided

Return ONLY valid JSON in this exact structure (no markdown, no fences):
{
  "inferredDomain": "<primary domain name, e.g. Finance>",
  "inferredDomainFull": "<domain / sub-domain, e.g. Finance / Precious Metals>",
  "confidence": <integer 0-100>,
  "dimensions": [
    { "id": "<short_snake_case_id>", "name": "<Dimension Name>", "signal": "<specific signal relevant to the observation — not a generic description>", "contribution": <integer 5-22>, "direction": "positive|negative|neutral" },
    ... exactly 10 dimensions, contributions sum to exactly 100
  ],
  "pattern": "<single declarative sentence — the dominant structural pattern in this observation>",
  "findings": [
    { "dimensionId": "<id matching one of the 10 above>", "text": "<finding: what this dimension reveals about the operator's observation>" },
    { "dimensionId": "<id>", "text": "<finding>" },
    { "dimensionId": "<id>", "text": "<finding>" },
    { "dimensionId": "<id>", "text": "<finding>" },
    { "dimensionId": "<id>", "text": "<finding>" }
  ],
  "simonSummary": "<2-3 sentence synthesis — what is actually happening, compressed from all 10 dimensions>",
  "rapidsCompression": "10 dimensions → <N> primary drivers → <pattern name>",
  "suggestedActions": [
    "<specific action 1>",
    "<specific action 2>",
    "<specific action 3>"
  ]
}`;
}

function buildFallback(observation: string) {
  return {
    inferredDomain: "Unknown",
    inferredDomainFull: "Domain inference unavailable",
    confidence: 0,
    dimensions: [
      { id: "signal_1",  name: "Primary Signal",      signal: "RAPIDS unavailable — observation recorded", contribution: 12, direction: "neutral" },
      { id: "signal_2",  name: "Secondary Signal",     signal: "RAPIDS unavailable — manual review required", contribution: 10, direction: "neutral" },
      { id: "context",   name: "Context",              signal: "Authority feeds degraded", contribution: 10, direction: "neutral" },
      { id: "temporal",  name: "Temporal",             signal: "Timing signals unavailable", contribution: 10, direction: "neutral" },
      { id: "scale",     name: "Scale",                signal: "Scale assessment degraded", contribution: 10, direction: "neutral" },
      { id: "causality", name: "Causality",            signal: "Causal chain unclear — feeds offline", contribution: 10, direction: "neutral" },
      { id: "precedent", name: "Precedent",            signal: "Historical comparison unavailable", contribution: 10, direction: "neutral" },
      { id: "risk",      name: "Risk",                 signal: "Risk assessment degraded", contribution: 10, direction: "neutral" },
      { id: "action",    name: "Action Horizon",       signal: "Action signals unavailable", contribution: 10, direction: "neutral" },
      { id: "unknown",   name: "Unknown Factors",      signal: "RAPIDS engine offline", contribution: 8,  direction: "neutral" },
    ],
    pattern: "RAPIDS engine unavailable — operator field judgment required",
    findings: [
      { dimensionId: "signal_1",  text: "RAPIDS offline — primary signal not computed" },
      { dimensionId: "context",   text: "Context analysis degraded — retry when engine available" },
      { dimensionId: "risk",      text: "Risk posture unclear — do not commit without independent verification" },
      { dimensionId: "temporal",  text: "Timing unknown — observation recorded for manual review" },
      { dimensionId: "unknown",   text: "Unknown factors may be significant — operator judgment takes precedent" },
    ],
    simonSummary: `RAPIDS engine unavailable. Observation "${observation.slice(0, 80)}${observation.length > 80 ? "…" : ""}" has been recorded. Retry analysis when the engine is available. Do not treat any dimension as authoritative — proceed with operator judgment only.`,
    rapidsCompression: "10 dimensions → RAPIDS engine unavailable → operator assessment required",
    suggestedActions: [
      "Record observation manually",
      "Retry analysis in 60 seconds",
      "Proceed with independent operator judgment",
    ],
  };
}

router.post("/observe", async (req, res) => {
  const { observation } = req.body;

  if (!observation || typeof observation !== "string" || observation.trim().length === 0) {
    res.status(400).json({ success: false, error: "observation is required" });
    return;
  }

  const trimmed = observation.trim();

  try {
    const prompt = buildObservationPrompt(trimmed);
    const raw = await callGemini(prompt);
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    res.json({
      success: true,
      rawObservation: trimmed,
      ...parsed,
    });
  } catch (err: any) {
    req.log.error(err, "observe analysis failed");
    res.json({
      success: true,
      rawObservation: trimmed,
      ...buildFallback(trimmed),
    });
  }
});

export default router;

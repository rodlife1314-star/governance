import { Router } from "express";
import { ai } from "@workspace/integrations-gemini-ai";

const router = Router();
const MODEL = "gemini-2.5-flash";

async function callGemini(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction: [
        "You are AETHER, the first cognitive layer of the RAPIDS engine.",
        "Return only valid JSON. No markdown fences. No explanation outside the JSON.",
        "Your role is to map uncertainty — not to answer questions.",
        "You identify what is unknown, what evidence would resolve it, and which authorities govern that evidence.",
        "CRITICAL: Never fabricate data, measurements, or facts. If something is unknown, name the uncertainty explicitly.",
        "Blocked authority rules: if the observation is about solar system bodies (asteroids, comets, TNOs, minor planets, active asteroids), mark SIMBAD and NED as blocked because they index only stellar and galactic objects, not solar system bodies.",
      ].join(" "),
    },
  });
  return response.text ?? "";
}

function buildAetherPrompt(observation: string, domainHint?: string): string {
  const domainLine = domainHint
    ? `OPERATOR DOMAIN CLASSIFICATION: ${domainHint}\nAnchor your analysis to this domain unless the observation text clearly contradicts it.\n\n`
    : "";

  return `${domainLine}RAW OBSERVATION: "${observation}"

You are AETHER — the first cognitive layer. Your task is NOT to analyze this observation. Your task is to map its uncertainty and produce a retrieval requirement packet that RAPIDS and HERMES can consume.

Instructions:
1. Identify the precise domain and sub-domain of this observation
2. Name the core uncertainty class — what specifically is unknown or ambiguous?
3. Write one sentence: what is uncertain and why it matters
4. List 3–6 evidence items that would resolve the uncertainty (specific, not generic)
5. Identify the ordered authority chain — which bodies govern this evidence and why
6. Identify authorities that CANNOT help and why (blocked authorities)

Blocked authority rules:
- Solar system bodies (asteroids, comets, TNOs, minor planets, active asteroids): block SIMBAD (only stellar/galactic) and NED (only extragalactic)
- Financial assets: block NICE, NHS, GMC (medical authorities)
- Medical cases: block SEC, CME, FCA (financial authorities)
- Jurisdiction-specific legal: block authorities from other jurisdictions

Return ONLY valid JSON in this exact structure:
{
  "domain": "<primary domain, e.g. Astrophysics>",
  "subDomain": "<specific sub-domain, e.g. Small-Body Astrophysics / Active Asteroids>",
  "uncertaintyClass": "<one precise label for the core uncertainty, e.g. Active Asteroid Classification>",
  "uncertaintyStatement": "<one sentence: what exactly is uncertain and why it matters>",
  "neededEvidence": [
    { "id": "ev_1", "label": "<short label>", "description": "<what evidence is needed and why>", "evidenceType": "observation|record|measurement|model|catalog" }
  ],
  "authorityChain": [
    { "shortName": "<e.g. IAU MPC>", "name": "<full name>", "url": "<https://...>", "tier": "primary|reference|standard", "reason": "<one sentence: why this authority governs this evidence>" }
  ],
  "blockedAuthorities": [
    { "shortName": "<e.g. SIMBAD>", "name": "<full name>", "url": "<https://...>", "reason": "<one sentence: why this authority cannot resolve this observation>" }
  ],
  "retrievalStatus": "READY_FOR_RAPIDS"
}`;
}

function buildFallback(observation: string) {
  return {
    domain: "Unknown",
    subDomain: "Domain classification unavailable",
    uncertaintyClass: "Classification Failure",
    uncertaintyStatement: `AETHER engine unavailable — observation recorded but uncertainty map could not be generated.`,
    neededEvidence: [
      {
        id: "ev_1",
        label: "Manual classification",
        description: "Human operator must classify this observation manually before RAPIDS can proceed",
        evidenceType: "observation" as const,
      },
    ],
    authorityChain: [] as Array<{ shortName: string; name: string; url: string; tier: string; reason: string }>,
    blockedAuthorities: [] as Array<{ shortName: string; name: string; url: string; reason: string }>,
    retrievalStatus: "DEGRADED" as const,
  };
}

router.post("/observe/aether", async (req, res) => {
  const { observation, domain: domainHint } = req.body as { observation?: string; domain?: string };

  if (!observation || typeof observation !== "string" || observation.trim().length === 0) {
    res.status(400).json({ success: false, error: "observation is required" });
    return;
  }

  const trimmed = observation.trim();

  try {
    const prompt = buildAetherPrompt(trimmed, domainHint);
    const raw = await callGemini(prompt);
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    res.json({ success: true, rawObservation: trimmed, ...parsed });
  } catch (err: any) {
    req.log.error(err, "aether packet generation failed");
    res.json({ success: true, rawObservation: trimmed, ...buildFallback(trimmed) });
  }
});

export default router;

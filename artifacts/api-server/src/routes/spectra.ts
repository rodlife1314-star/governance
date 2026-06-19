import { Router } from "express";
import { ai } from "@workspace/integrations-gemini-ai";

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

// ── Domain-aware system prompts ───────────────────────────────────────────────

function buildAnalysisSystemPrompt(domain: string): string {
  const domainGuide: Record<string, string> = {
    ASTROPHYSICS: "You are SPECTRA-7, an astrophysical analysis engine. Reference real physics: orbital mechanics, radiation environments, propulsion theory, spectroscopy, mission architecture. Be technically precise.",
    FINANCE:      "You are SPECTRA-7, a financial investigation engine. Reference real market mechanisms: price discovery, liquidity dynamics, macro drivers, instrument structure. Be analytically precise.",
    MEDICINE:     "You are SPECTRA-7, a biomedical investigation engine. Reference real clinical mechanisms, diagnostic criteria, pathophysiology, and evidence-based protocols. Be medically precise.",
    LAW:          "You are SPECTRA-7, a legal investigation engine. Reference real legal doctrine, statutes, precedent, and jurisdictional considerations. Be legally precise.",
    IT:           "You are SPECTRA-7, a systems investigation engine. Reference real technical mechanisms, protocols, architecture patterns, and failure modes. Be technically precise.",
  };
  const base = domainGuide[domain.toUpperCase()] ?? "You are SPECTRA-7, a rigorous investigation engine. Apply domain expertise precisely.";
  return `${base}

Analysis style:
- Dense, expert prose — no bullet points
- Name the discriminating observations or measurements
- Be decisive but acknowledge what additional data would confirm
- ~200 words — precise, not padded`;
}

const VERDICT_SYSTEM = `You are a senior expert giving a brief operator verdict. Based on the analysis, give a 2-3 sentence conclusion: whether this hypothesis should be the primary classification, the single most discriminating follow-up observation or measurement, and your confidence level (0-100%). Direct. No bullet points.`;

// ── /spectra/generate — domain-driven hypothesis generation ──────────────────

router.post("/spectra/generate", async (req, res) => {
  const { observation, domain, subDomain } = req.body as {
    observation?: string;
    domain?: string;
    subDomain?: string;
  };

  if (!observation || !domain) {
    res.status(400).json({ success: false, error: "observation and domain required" });
    return;
  }

  const now = new Date();
  const caseIdSuffix = now.toISOString().replace(/[-:T.Z]/g, "").slice(0, 12);

  const generatePrompt = `You are SPECTRA-7, a deep investigation classification engine. Given an operator observation and its classified domain, generate a structured investigation case with exactly 4 competing hypotheses.

Operator Observation: "${observation}"
Domain: ${domain}${subDomain ? ` / ${subDomain}` : ""}
Case Date: ${now.toISOString().slice(0, 10)}

Generate 4 distinct, expert-level competing hypotheses that a domain authority would genuinely consider for this observation. Each hypothesis should represent a different interpretive lens or causal mechanism.

Return ONLY valid JSON — no markdown, no surrounding text:
{
  "caseId": "SA-${caseIdSuffix}",
  "caseTitle": "<concise case title — the core question or anomaly under investigation>",
  "caseSubtitle": "<one sentence: what is being investigated and why it is uncertain>",
  "contextSummary": "<2-3 sentences: what the observation reveals, what is ambiguous, what investigative context matters>",
  "hypotheses": [
    {
      "id": "HYP-A",
      "name": "<hypothesis name — the classification, mechanism, or interpretation being proposed>",
      "desc": "<3-4 sentences: precisely why this hypothesis fits the observation, what mechanism it invokes, what evidence supports it, and what would discriminate it from alternatives>",
      "prob": <integer 1-99>
    },
    {
      "id": "HYP-B",
      "name": "...",
      "desc": "...",
      "prob": <integer>
    },
    {
      "id": "HYP-C",
      "name": "...",
      "desc": "...",
      "prob": <integer>
    },
    {
      "id": "HYP-D",
      "name": "...",
      "desc": "...",
      "prob": <integer>
    }
  ]
}

The four prob values should sum to approximately 100. The hypotheses must be genuinely distinct — not variations of the same idea.`;

  try {
    const raw = await callGemini(
      generatePrompt,
      "Return only valid JSON. No markdown fences. No explanation outside the JSON object."
    );
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(cleaned);
    res.json({ success: true, ...result });
  } catch (err: any) {
    req.log.error(err, "Spectra generate failed");
    res.status(500).json({ success: false, error: "Case generation failed" });
  }
});

// ── /spectra/analyse — dynamic + legacy hypothesis analysis ──────────────────

router.post("/spectra/analyse", async (req, res) => {
  const {
    observation, domain, caseTitle, caseContext,
    hypName, hypDesc,
  } = req.body as {
    observation?: string;
    domain?: string;
    caseTitle?: string;
    caseContext?: string;
    hypName?: string;
    hypDesc?: string;
  };

  if (!observation || !hypName || !hypDesc) {
    res.status(400).json({ success: false, error: "observation, hypName and hypDesc are required" });
    return;
  }

  const effectiveDomain = domain ?? "GENERAL";
  const systemPrompt    = buildAnalysisSystemPrompt(effectiveDomain);

  const analysisPrompt = `Domain: ${effectiveDomain}
${caseTitle ? `Case: ${caseTitle}` : ""}
${caseContext ? `Context: ${caseContext}` : ""}
Operator Observation: "${observation}"

Hypothesis Under Investigation: "${hypName}"
${hypDesc}

Analyse whether this hypothesis fits the observation. What mechanism does it invoke? What is the strongest evidence for and against it? What single follow-up observation or measurement would confirm or refute it decisively?`;

  const title = `${hypName.toUpperCase()} — ANALYSIS`;

  try {
    const analysis = await callGemini(analysisPrompt, systemPrompt);

    const verdictPrompt = `${analysisPrompt}

Previous analysis:
${analysis}

Now give your operator verdict: primary classification status, the ONE follow-up action or measurement that would be definitive, and your confidence level (0-100%).`;

    const verdict = await callGemini(verdictPrompt, VERDICT_SYSTEM);

    res.json({ success: true, analysis, verdict, title });
  } catch (err: any) {
    req.log.error(err, "Spectra analyse failed");
    res.status(500).json({ success: false, error: "Analysis engine error" });
  }
});

export default router;

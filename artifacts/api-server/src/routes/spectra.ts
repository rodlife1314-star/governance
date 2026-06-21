import { Router } from "express";
import { getSpectraAdapter } from "../lib/inferenceAdapter.js";

const router = Router();

function buildDomainSystemPrompt(domain: string): string {
  const guide: Record<string, string> = {
    ASTROPHYSICS: "You are SPECTRA-7, an astrophysical analysis engine. Reference real physics: orbital mechanics, radiation environments, propulsion theory, spectroscopy, mission architecture. Be technically precise.",
    FINANCE:      "You are SPECTRA-7, a financial investigation engine. Reference real market mechanisms: price discovery, liquidity dynamics, macro drivers, instrument structure. Be analytically precise.",
    MEDICINE:     "You are SPECTRA-7, a biomedical investigation engine. Reference real clinical mechanisms, diagnostic criteria, pathophysiology, and evidence-based protocols. Be medically precise.",
    LAW:          "You are SPECTRA-7, a legal investigation engine. Reference real legal doctrine, statutes, precedent, and jurisdictional considerations. Be legally precise.",
    IT:           "You are SPECTRA-7, a systems investigation engine. Reference real technical mechanisms, protocols, architecture patterns, and failure modes. Be technically precise.",
  };
  return guide[domain.toUpperCase()] ?? "You are SPECTRA-7, a rigorous investigation engine. Apply domain expertise precisely.";
}

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

  const prompt = `You are SPECTRA-7, a deep investigation classification engine. Given an operator observation and its classified domain, generate a structured investigation case with exactly 4 competing hypotheses.

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
    { "id": "HYP-A", "name": "<hypothesis name>", "desc": "<3-4 sentences: precisely why this hypothesis fits, what mechanism it invokes, what evidence supports it, what discriminates it from alternatives>", "prob": <integer 1-99> },
    { "id": "HYP-B", "name": "...", "desc": "...", "prob": <integer> },
    { "id": "HYP-C", "name": "...", "desc": "...", "prob": <integer> },
    { "id": "HYP-D", "name": "...", "desc": "...", "prob": <integer> }
  ]
}

The four prob values should sum to approximately 100. Hypotheses must be genuinely distinct.`;

  const systemInstruction = "Return only valid JSON. No markdown fences. No explanation outside the JSON object.";

  try {
    const adapter = getSpectraAdapter();
    const result = await adapter.invoke(prompt, systemInstruction);
    const cleaned = result.content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    res.json({ success: true, engine: adapter.name, ...parsed });
  } catch (err: unknown) {
    req.log.error(err, "Spectra generate failed");
    res.status(500).json({ success: false, error: "Case generation failed" });
  }
});

router.post("/spectra/analyse", async (req, res) => {
  const { observation, domain, caseTitle, caseContext, hypName, hypDesc } = req.body as {
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
  const systemPrompt = buildDomainSystemPrompt(effectiveDomain) + `

Analysis style:
- Dense, expert prose — no bullet points
- Name the discriminating observations or measurements
- Be decisive but acknowledge what additional data would confirm
- analysis field: ~200 words — precise, not padded
- verdict field: 2-3 sentences — primary classification status, the ONE definitive follow-up, confidence (0-100%)

Return ONLY valid JSON — no markdown, no fences:
{ "analysis": "<expert prose analysis>", "verdict": "<operator verdict>" }`;

  const prompt = `Domain: ${effectiveDomain}
${caseTitle ? `Case: ${caseTitle}` : ""}
${caseContext ? `Context: ${caseContext}` : ""}
Operator Observation: "${observation}"

Hypothesis Under Investigation: "${hypName}"
${hypDesc}

Analyse whether this hypothesis fits the observation. What mechanism does it invoke? What is the strongest evidence for and against it? What single follow-up observation or measurement would confirm or refute it decisively? Then give your operator verdict.`;

  const title = `${hypName.toUpperCase()} — ANALYSIS`;

  try {
    const adapter = getSpectraAdapter();
    const result = await adapter.invoke(prompt, systemPrompt);

    let analysis = "";
    let verdict = "";

    const cleaned = result.content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    try {
      const parsed = JSON.parse(cleaned) as { analysis?: string; verdict?: string };
      analysis = parsed.analysis ?? cleaned;
      verdict = parsed.verdict ?? "";
    } catch {
      analysis = cleaned;
      verdict = "";
    }

    res.json({
      success:      true,
      analysis,
      verdict,
      title,
      thinkingTrace: result.thinkingTrace ?? null,
      engine:        adapter.name,
    });
  } catch (err: unknown) {
    req.log.error(err, "Spectra analyse failed");
    res.status(500).json({ success: false, error: "Analysis engine error" });
  }
});

export default router;

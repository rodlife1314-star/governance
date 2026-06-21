import { Router } from "express";
import { db, domainAuthorities, dataSources } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { getRapidsAdapter } from "../lib/inferenceAdapter.js";

const router = Router();

const RAPIDS_SYSTEM = [
  "You are RAPIDS. Return only valid JSON. No markdown fences. No explanation outside the JSON.",
  "CRITICAL — DATA INTEGRITY RULE: Do not fabricate, estimate, infer, or substitute any quantitative value (prices, percentages, statistics, rates, measurements, counts).",
  "If the operator's observation references a quantity, analyze it exactly as stated — never correct, adjust, or embellish it.",
  "If data would be needed to complete an analysis but is not present in the observation, note the gap explicitly in the signal text rather than guessing.",
  "Reality comes first. Silence is preferable to fabrication.",
].join(" ");

function buildObservationPrompt(observation: string, domainHint?: string): string {
  const domainAnchor = domainHint
    ? `\nOPERATOR DOMAIN CLASSIFICATION: "${domainHint}"\nYou MUST anchor your dimensional analysis to this domain. Apply ${domainHint}-specific analytical lenses. Only override this classification if the observation text explicitly and unambiguously belongs to a completely different domain.\n`
    : "";

  return `You are RAPIDS, a dimensional augmentation instrument. An operator has made a raw observation. Your role is to reveal what the operator cannot see without augmentation.
${domainAnchor}
RAW OBSERVATION: "${observation}"

Instructions:
1. Read this observation carefully${domainHint ? ` — domain is operator-classified as ${domainHint}` : " without pre-classifying it"}
2. ${domainHint ? `Use "${domainHint}" as the domain unless the text strongly contradicts it` : "Infer the domain and sub-domain from the content"}
3. Discover 10 analytical dimensions genuinely relevant to THIS observation — not generic categories, but real analytical lenses that could reveal something new
4. Score each dimension's contribution to the overall picture (contributions must sum to exactly 100)
5. Assign a direction: positive (amplifying/bullish/supportive), negative (suppressing/bearish/contrary), or neutral
6. Identify the dominant pattern — one precise declarative sentence
7. Generate exactly 5 findings, each anchored to a different dimension
8. Suggest 3-5 operator actions specific to this observation (not generic)
9. Cite 2-4 authoritative bodies most relevant to this observation's domain — use the authority registry below

Dimension discovery rules by domain:
- Finance/Markets: currency, yields, institutional flows, futures positioning, sentiment, commodity, geopolitics, technicals, liquidity, on-chain/sector-specific
- Medicine/Clinical: onset chronology, vital signs, laboratory markers, imaging findings, medication history, differential diagnosis, risk factors, evidence base, guideline alignment, contraindication flags
- Law/Legal: case precedent, applicable statute, jurisdictional scope, burden of proof, evidence weight, timeline, damages exposure, appeal pathway, regulatory compliance, contract terms
- Technology/Systems: architectural integrity, security posture, performance metrics, scalability, technical debt, dependency risk, code coverage, observability, data flow, failure modes
- Astrophysics/Space/Solar System: photometric data, spectral analysis, orbital mechanics, temporal variation, energy flux, spatial coordinates, instrument calibration, catalog comparison, cosmological context, prediction confidence
- Small-Body/Active Asteroid: Tisserand parameter (T_J), orbital classification, dust/coma activity, multi-epoch photometry, cometary element comparison, perihelion passage timing, non-gravitational forces, MPC designation, taxonomy, activity mechanism
- Food/Culinary: ingredient cost, margin, labour intensity, shelf life, seasonality, allergen profile, preparation complexity, waste factor, staff training, guest experience
- General: if none of the above — choose the 10 lenses most likely to reveal something the operator cannot see unaided

Authority registry (cite the most relevant 2-4 for this observation's domain):
Finance: CME Group (cmegroup.com), FCA (fca.org.uk), SEC (sec.gov), LSE Rules (londonstockexchange.com), LSEG (lseg.com), Coinbase (coinbase.com), Binance (binance.com)
Medicine/UK: NHS (nhs.uk), NICE (nice.org.uk), GMC (gmc-uk.org), MHRA (gov.uk/mhra), WHO (who.int), SNOMED CT (snomed.org), MeSH/NLM (nlm.nih.gov/mesh)
Medicine/US: FDA (fda.gov), CDC (cdc.gov), NIH MedlinePlus (medlineplus.gov), WHO (who.int)
Law/UK: MoJ Courts Glossary (gov.uk), Law Society (lawsociety.org.uk), Cornell LII (law.cornell.edu)
Law/US: Cornell LII (law.cornell.edu), Black's Law (thelawdictionary.org), SEC (sec.gov)
Astrophysics: IAU (iau.org), IAU MPC (minorplanetcenter.net), NASA (nasa.gov), JPL SBDB (ssd.jpl.nasa.gov), ESA (esa.int), ESO (eso.org), NASA ADS (adsabs.harvard.edu)
Technology/Computing: IEEE (ieee.org), IETF (ietf.org), W3C (w3.org), ACM (acm.org), NIST (nist.gov)
Engineering: NIST (nist.gov), ISO (iso.org), IEEE (ieee.org), ASME (asme.org)
Standards (cross-domain): ISO (iso.org), BSI (bsigroup.com), NIST (nist.gov)
Earth/Climate: USGS (usgs.gov), Met Office (metoffice.gov.uk), IPCC (ipcc.ch)

Return ONLY valid JSON in this exact structure (no markdown, no fences):
{
  "inferredDomain": "<primary domain name, e.g. Astrophysics>",
  "inferredDomainFull": "<domain / sub-domain, e.g. Astrophysics / Small-Body / Active Asteroids>",
  "confidence": <integer 0-100>,
  "dimensions": [
    { "id": "<short_snake_case_id>", "name": "<Dimension Name>", "signal": "<specific signal relevant to the observation — if a quantity is needed but unavailable, state that explicitly>", "contribution": <integer 5-22>, "direction": "positive|negative|neutral" },
    ... exactly 10 dimensions, contributions sum to exactly 100
  ],
  "pattern": "<single declarative sentence — the dominant structural pattern in this observation>",
  "findings": [
    { "dimensionId": "<id matching one of the 10 above>", "text": "<finding: what this dimension reveals about the observation>" },
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
  ],
  "citedAuthorities": [
    { "shortName": "<e.g. IAU MPC>", "name": "<full name>", "url": "<https://...>", "tier": "primary|regulatory|reference|standard|glossary", "relevance": "<one sentence: why this authority governs this observation>" },
    ... 2-4 entries
  ]
}`;
}

function buildFallback(observation: string) {
  return {
    inferredDomain: "Unknown",
    inferredDomainFull: "Domain inference unavailable",
    confidence: 0,
    dimensions: [
      { id: "signal_1",  name: "Primary Signal",   signal: "RAPIDS unavailable — observation recorded", contribution: 12, direction: "neutral" },
      { id: "signal_2",  name: "Secondary Signal",  signal: "RAPIDS unavailable — manual review required", contribution: 10, direction: "neutral" },
      { id: "context",   name: "Context",           signal: "Authority feeds degraded", contribution: 10, direction: "neutral" },
      { id: "temporal",  name: "Temporal",          signal: "Timing signals unavailable", contribution: 10, direction: "neutral" },
      { id: "scale",     name: "Scale",             signal: "Scale assessment degraded", contribution: 10, direction: "neutral" },
      { id: "causality", name: "Causality",         signal: "Causal chain unclear — feeds offline", contribution: 10, direction: "neutral" },
      { id: "precedent", name: "Precedent",         signal: "Historical comparison unavailable", contribution: 10, direction: "neutral" },
      { id: "risk",      name: "Risk",              signal: "Risk assessment degraded", contribution: 10, direction: "neutral" },
      { id: "action",    name: "Action Horizon",    signal: "Action signals unavailable", contribution: 10, direction: "neutral" },
      { id: "unknown",   name: "Unknown Factors",   signal: "RAPIDS engine offline", contribution: 8,  direction: "neutral" },
    ],
    pattern: "RAPIDS engine unavailable — operator field judgment required",
    findings: [
      { dimensionId: "signal_1",  text: "RAPIDS offline — primary signal not computed" },
      { dimensionId: "context",   text: "Context analysis degraded — retry when engine available" },
      { dimensionId: "risk",      text: "Risk posture unclear — do not commit without independent verification" },
      { dimensionId: "temporal",  text: "Timing unknown — observation recorded for manual review" },
      { dimensionId: "unknown",   text: "Unknown factors may be significant — operator judgment takes precedent" },
    ],
    simonSummary: `RAPIDS engine unavailable. Observation "${observation.slice(0, 80)}${observation.length > 80 ? "…" : ""}" has been recorded. Retry analysis when the engine is available.`,
    rapidsCompression: "10 dimensions → RAPIDS engine unavailable → operator assessment required",
    suggestedActions: [
      "Record observation manually",
      "Retry analysis in 60 seconds",
      "Proceed with independent operator judgment",
    ],
    citedAuthorities: [] as Array<{ shortName: string; name: string; url: string; tier: string; relevance: string }>,
  };
}

// ── Domain keyword scorer ──────────────────────────────────────────────────

const DOMAIN_SIGNALS: Record<string, { primary: string[]; secondary: string[] }> = {
  Finance: {
    primary: ["price", "btc", "bitcoin", "gold", "silver", "xau", "xag", "futures", "basis", "contango", "backwardation", "yield", "spread", "dollar", "dxy", "equity", "crypto", "inflation", "fed", "fomc", "nasdaq", "lme", "cme", "etf"],
    secondary: ["market", "rate", "fund", "trade", "exchange", "vol", "volatility", "bond", "index", "asset", "hedge", "short", "long", "options", "commodit"],
  },
  Medicine: {
    primary: ["patient", "symptom", "diagnosis", "clinical", "drug", "dose", "therapy", "disease", "syndrome", "fever", "pain", "cardiac", "neuro", "pulmonary", "oncolog", "patholog", "presenting", "anemia", "hypertension", "diabetes", "pupil", "dilation", "troponin", "ecg", "spo2", "saturation"],
    secondary: ["health", "medical", "treatment", "blood", "tissue", "cell", "test", "scan", "hospital", "biopsy", "imaging", "mri", "ct", "lab"],
  },
  Law: {
    primary: ["contract", "clause", "court", "statute", "jurisdiction", "liability", "damages", "plaintiff", "defendant", "arbitration", "appeal", "breach", "notice", "counterparty", "indemnit", "limitation period", "force majeure"],
    secondary: ["legal", "compliance", "agreement", "filing", "evidence", "precedent", "counsel", "regulatory", "tort", "injunction", "settlement"],
  },
  Technology: {
    primary: ["latency", "server", "database", "api", "cpu", "memory", "cache", "deployment", "vulnerability", "dependency", "microservice", "garbage collection", "throughput", "uptime", "cve", "kubernetes", "heap", "certificate", "http", "503", "timeout"],
    secondary: ["system", "software", "hardware", "network", "code", "architecture", "performance", "security", "service", "container", "spike"],
  },
  Astrophysics: {
    primary: [
      "spectral", "wavelength", "nm", "flux", "photometric", "magnitude", "orbit", "parsec",
      "stellar", "galactic", "emission", "absorption", "hydrogen", "spectrograph", "photometry",
      "light curve", "asteroid", "comet", "perihelion", "aphelion", "tisserand", "t_j",
      "dust tail", "active asteroid", "minor planet", "orbital period", "heliocentric",
      "solar system", "small body", "coma", "albedo", "mpc", "sbdb", "2005 qn",
      "active comet", "recurrent", "non-gravitational", "yarkovsky",
    ],
    secondary: [
      "telescope", "star", "galaxy", "cosmic", "space", "astronomical", "nebula",
      "quasar", "redshift", "supernova", "pulsar", "spectra", "orbital", "dust",
      "passage", "detection", "km", "au ", "planetary", "solar", "designation",
    ],
  },
};

function detectDomain(text: string): { domain: string; confidence: number } {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};
  for (const [domain, signals] of Object.entries(DOMAIN_SIGNALS)) {
    let score = 0;
    for (const kw of signals.primary) if (lower.includes(kw)) score += 3;
    for (const kw of signals.secondary) if (lower.includes(kw)) score += 1;
    scores[domain] = score;
  }
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topDomain, topScore] = sorted[0];
  if (topScore === 0) return { domain: "General", confidence: 30 };
  const confidence = Math.min(95, Math.round(42 + (topScore / 15) * 53));
  return { domain: topDomain, confidence };
}

// ── Coverage check ─────────────────────────────────────────────────────────

router.post("/observe/coverage", async (req, res) => {
  const {
    observation,
    domain: domainOverride,
    aetherAuthorityChain,
    aetherBlockedAuthorities,
  } = req.body as {
    observation?: string;
    domain?: string;
    aetherAuthorityChain?: Array<{ shortName: string; name: string; url: string; tier: string; reason: string }>;
    aetherBlockedAuthorities?: Array<{ shortName: string; name: string; url: string; reason: string }>;
  };

  if (!observation || typeof observation !== "string" || observation.trim().length === 0) {
    res.status(400).json({ success: false, error: "observation is required" });
    return;
  }
  const trimmed = observation.trim();
  const hasPacket = Array.isArray(aetherAuthorityChain) && aetherAuthorityChain.length > 0;

  try {
    const detected = domainOverride
      ? { domain: domainOverride, confidence: 95 }
      : detectDomain(trimmed);
    const { domain, confidence } = detected;

    const [allAuthRows, sourceRows] = await Promise.all([
      domain === "General"
        ? db.select().from(domainAuthorities)
            .where(eq(domainAuthorities.active, true))
            .orderBy(asc(domainAuthorities.sortOrder))
            .limit(6)
        : db.select().from(domainAuthorities)
            .where(eq(domainAuthorities.domain, domain))
            .orderBy(asc(domainAuthorities.sortOrder)),
      domain === "General"
        ? Promise.resolve([] as typeof dataSources.$inferSelect[])
        : db.select().from(dataSources)
            .where(eq(dataSources.domain, domain)),
    ]);

    const live  = sourceRows.filter(s => !s.authRequired);
    const gated = sourceRows.filter(s =>  s.authRequired);
    const coveragePct = sourceRows.length === 0 ? 0 : Math.round((live.length / sourceRows.length) * 100);
    const byTier = (tier: string) => allAuthRows.filter(a => a.tier === tier);

    // ── PACKET-DRIVEN mode: AETHER chain becomes RAPIDS search criteria ─────
    let packetDrivenAuthorities: Array<{
      shortName: string; name: string; url: string; tier: string;
      aetherReason: string; inRegistry: boolean; registryId?: string;
    }> | undefined;

    if (hasPacket) {
      // Registry lookup map by shortName (lowercase for fuzzy match)
      const registryMap = new Map(allAuthRows.map(a => [a.shortName.toLowerCase(), a]));
      const blockedSet  = new Set((aetherBlockedAuthorities ?? []).map(b => b.shortName.toLowerCase()));

      packetDrivenAuthorities = (aetherAuthorityChain ?? [])
        .filter(a => !blockedSet.has(a.shortName.toLowerCase()))
        .map(a => {
          const registered = registryMap.get(a.shortName.toLowerCase());
          return {
            shortName:   a.shortName,
            name:        a.name,
            url:         a.url,
            tier:        a.tier,
            aetherReason: a.reason,
            inRegistry:  !!registered,
            registryId:  registered?.id,
          };
        });
    }

    res.json({
      success:    true,
      domain,
      domainFull: domain === "General" ? "General — awaiting classification" : domain,
      confidence,
      packetDrivenAuthorities,
      authorities: {
        primary:    byTier("primary"),
        regulatory: byTier("regulatory"),
        reference:  byTier("reference"),
        standard:   byTier("standard"),
        glossary:   byTier("glossary"),
      },
      dataSources: sourceRows,
      coverage: {
        totalSources: sourceRows.length,
        liveSources:  live.length,
        gatedSources: gated.length,
        coveragePct,
        gaps: gated.map(s => `${s.shortName} — authentication required`),
      },
    });
  } catch (err: any) {
    req.log.error(err, "coverage check failed");
    res.status(500).json({ success: false, error: "coverage check failed" });
  }
});

// ── SIMON full analysis ────────────────────────────────────────────────────

router.post("/observe", async (req, res) => {
  const { observation, domain: domainOverride } = req.body as { observation?: string; domain?: string };

  if (!observation || typeof observation !== "string" || observation.trim().length === 0) {
    res.status(400).json({ success: false, error: "observation is required" });
    return;
  }

  const trimmed = observation.trim();

  try {
    const prompt = buildObservationPrompt(trimmed, domainOverride);
    const adapter = getRapidsAdapter();
    const result = await adapter.invoke(prompt, RAPIDS_SYSTEM);
    const cleaned = result.content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    res.json({ success: true, rawObservation: trimmed, engine: adapter.name, ...parsed });
  } catch (err: any) {
    req.log.error(err, "observe analysis failed");
    res.json({ success: true, rawObservation: trimmed, ...buildFallback(trimmed) });
  }
});

export default router;

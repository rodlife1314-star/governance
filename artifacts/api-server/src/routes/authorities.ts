import { Router } from "express";
import { db, domainAuthorities, dataSources } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { ai } from "@workspace/integrations-gemini-ai";

const GEMINI_MODEL = "gemini-2.5-flash";

async function callGeminiLocate(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { systemInstruction: "Return only valid JSON. No markdown fences. No explanation outside the JSON." },
  });
  return response.text ?? "";
}

const router = Router();

router.get("/authorities", async (req, res) => {
  const domain = req.query.domain as string | undefined;
  try {
    const rows = domain
      ? await db.select().from(domainAuthorities)
          .where(eq(domainAuthorities.domain, domain))
          .orderBy(asc(domainAuthorities.sortOrder))
      : await db.select().from(domainAuthorities)
          .orderBy(asc(domainAuthorities.domain), asc(domainAuthorities.sortOrder));
    res.json({ success: true, authorities: rows });
  } catch (err: any) {
    req.log.error(err, "Failed to fetch authorities");
    res.status(500).json({ success: false, error: "Failed to fetch authorities" });
  }
});

router.post("/authorities", async (req, res) => {
  try {
    const {
      domain, subDomain, name, shortName, jurisdiction, url,
      tier, sourceType, description, sortOrder,
    } = req.body;

    if (!domain || !name || !shortName || !url) {
      res.status(400).json({ success: false, error: "domain, name, shortName, url are required" });
      return;
    }

    const id = randomUUID();
    await db.insert(domainAuthorities).values({
      id,
      domain,
      subDomain:   subDomain ?? null,
      name,
      shortName,
      jurisdiction: jurisdiction ?? "International",
      url,
      tier:         tier ?? "reference",
      sourceType:   sourceType ?? "reference",
      description:  description ?? "",
      active:       true,
      sortOrder:    sortOrder ?? 99,
    });

    res.json({ success: true, id });
  } catch (err: any) {
    req.log.error(err, "Failed to insert authority");
    res.status(500).json({ success: false, error: "Failed to insert authority" });
  }
});

router.get("/data-sources", async (req, res) => {
  const domain = req.query.domain as string | undefined;
  try {
    const rows = domain
      ? await db.select().from(dataSources).where(eq(dataSources.domain, domain))
      : await db.select().from(dataSources);
    res.json({ success: true, sources: rows });
  } catch (err: any) {
    req.log.error(err, "Failed to fetch data sources");
    res.status(500).json({ success: false, error: "Failed to fetch data sources" });
  }
});

router.post("/data-sources", async (req, res) => {
  try {
    const {
      domain, name, shortName, endpointUrl,
      updateFrequency, authRequired, dataType, description, notes,
    } = req.body;

    if (!domain || !name || !endpointUrl) {
      res.status(400).json({ success: false, error: "domain, name, endpointUrl are required" });
      return;
    }

    const id = randomUUID();
    await db.insert(dataSources).values({
      id,
      domain,
      name,
      shortName:       shortName ?? name,
      endpointUrl,
      updateFrequency: updateFrequency ?? "unknown",
      authRequired:    authRequired ?? false,
      dataType:        dataType ?? "general",
      description:     description ?? "",
      active:          true,
      notes:           notes ?? null,
    });

    res.json({ success: true, id });
  } catch (err: any) {
    req.log.error(err, "Failed to insert data source");
    res.status(500).json({ success: false, error: "Failed to insert data source" });
  }
});

// ── Automatic source location ──────────────────────────────────────────────
// Given a dimension variable with no observation feed, locate the best
// public authority and specific API endpoint using Gemini + the authority registry.

router.post("/authorities/locate-source", async (req, res) => {
  const { dimensionId, dimensionName, asset, assetLabel, domain } = req.body as {
    dimensionId?: string;
    dimensionName: string;
    asset?: string;
    assetLabel?: string;
    domain?: string;
  };

  if (!dimensionName) {
    res.status(400).json({ success: false, error: "dimensionName required" });
    return;
  }

  const effectiveDomain = (domain ?? "GENERAL").toUpperCase();

  // Pull registered authorities for the correct domain (not always FINANCE)
  let authorityList = "(none loaded)";
  try {
    const rows = await db.select().from(domainAuthorities)
      .where(eq(domainAuthorities.domain, effectiveDomain))
      .orderBy(asc(domainAuthorities.sortOrder));
    if (rows.length > 0) {
      authorityList = rows.map((a) => `- ${a.shortName}: ${a.name} (${a.url})`).join("\n");
    } else {
      // Fall back to all domains if none registered for this domain yet
      const all = await db.select().from(domainAuthorities).orderBy(asc(domainAuthorities.sortOrder));
      if (all.length > 0) authorityList = all.map((a) => `- ${a.shortName}: ${a.name} [${a.domain}] (${a.url})`).join("\n");
    }
  } catch { /* proceed without registry — Gemini will suggest from its knowledge */ }

  // Domain-specific context for the prompt
  const DOMAIN_CONTEXT: Record<string, string> = {
    ASTROPHYSICS: "astrophysics, space science, and space-mission operations system",
    FINANCE:      "financial markets and trading intelligence system",
    MEDICINE:     "clinical and biomedical research system",
    LAW:          "legal and regulatory compliance system",
    IT:           "information technology and cybersecurity system",
    GENERAL:      "multi-domain knowledge system",
  };
  const DOMAIN_ASSET_CONTEXT: Record<string, string> = {
    ASTROPHYSICS: "space mission, astronomical object, or astrophysical phenomenon",
    FINANCE:      "financial instrument or market",
    MEDICINE:     "clinical subject or biomedical phenomenon",
    LAW:          "legal matter or regulatory subject",
    IT:           "technical system or service",
    GENERAL:      "observable subject",
  };

  const domainCtx     = DOMAIN_CONTEXT[effectiveDomain]     ?? DOMAIN_CONTEXT.GENERAL;
  const assetCtxLabel = DOMAIN_ASSET_CONTEXT[effectiveDomain] ?? DOMAIN_ASSET_CONTEXT.GENERAL;

  const prompt = `You are an authority source locator for a ${domainCtx} (Pathfinder Operator System).

TASK: Identify the single best external public authority and specific API endpoint for this observable variable.

Variable: "${dimensionName}"
Dimension ID: "${dimensionId ?? "unknown"}"
Subject context: ${assetLabel ?? assetCtxLabel} (${asset ?? "unknown"})
Domain: ${effectiveDomain}

Registered authorities already in the system:
${authorityList}

RULES:
1. Point OUTWARD at real external authoritative sources (e.g. for ASTROPHYSICS: NASA, ESA, JPL, NOAA SWPC, IAU, ESO, STScI; for FINANCE: CBOE, CME, Federal Reserve, BIS; etc).
2. Prefer a registered authority from the list if it genuinely owns this variable.
3. Cite only real endpoints you know to exist — do not fabricate URLs.
4. Prefer free/public endpoints (no auth). If auth is unavoidable, state it clearly.
5. Be specific: provide the full endpoint URL or path pattern, not just a homepage.
6. State the actual data refresh cycle (real-time, daily, weekly, monthly, etc).
7. "usesRegisteredAuthority" must be true only if the authority short name appears verbatim in the list above.
8. NEVER suggest internal system endpoints or generic web searches — only real external authoritative sources.

Return only valid JSON — no markdown, no surrounding text:
{
  "usesRegisteredAuthority": <true|false>,
  "authorityShortName": "<short name>",
  "authorityName": "<full official name>",
  "authorityUrl": "<authority homepage URL>",
  "endpointDescription": "<one sentence: what this endpoint provides>",
  "endpointUrl": "<specific API endpoint URL or path pattern>",
  "refreshCycle": "<real-time|daily|weekly|monthly|on-demand|annual>",
  "authRequired": <true|false>,
  "confidence": "<high|medium|low>",
  "notes": "<any caveats: geo-restrictions, rate limits, login wall, paid tier, etc — or 'None' if clean>"
}`;

  try {
    const raw = await callGeminiLocate(prompt);
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(cleaned);
    res.json({ success: true, ...result });
  } catch (err: any) {
    req.log.error(err, "locate-source failed");
    res.status(500).json({ success: false, error: "Source location failed — Gemini unavailable" });
  }
});

export default router;

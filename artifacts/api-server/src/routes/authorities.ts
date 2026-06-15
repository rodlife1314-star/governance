import { Router } from "express";
import { db, domainAuthorities, dataSources } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { randomUUID } from "crypto";

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

export default router;

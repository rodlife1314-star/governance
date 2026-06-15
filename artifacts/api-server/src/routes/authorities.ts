import { Router } from "express";
import { db, domainAuthorities, dataSources } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

const router = Router();

router.get("/authorities", async (req, res) => {
  const domain = req.query.domain as string | undefined;
  try {
    const query = db
      .select()
      .from(domainAuthorities)
      .orderBy(asc(domainAuthorities.domain), asc(domainAuthorities.sortOrder));

    const rows = domain
      ? await db.select().from(domainAuthorities)
          .where(eq(domainAuthorities.domain, domain))
          .orderBy(asc(domainAuthorities.sortOrder))
      : await query;

    res.json({ success: true, authorities: rows });
  } catch (err: any) {
    req.log.error(err, "Failed to fetch authorities");
    res.status(500).json({ success: false, error: "Failed to fetch authorities" });
  }
});

router.get("/data-sources", async (req, res) => {
  const domain = req.query.domain as string | undefined;
  try {
    const rows = domain
      ? await db.select().from(dataSources)
          .where(eq(dataSources.domain, domain))
      : await db.select().from(dataSources);

    res.json({ success: true, sources: rows });
  } catch (err: any) {
    req.log.error(err, "Failed to fetch data sources");
    res.status(500).json({ success: false, error: "Failed to fetch data sources" });
  }
});

export default router;

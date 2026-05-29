import { Router, type IRouter } from "express";
import { eq, ilike, sql } from "drizzle-orm";
import { db, memoryEntriesTable } from "@workspace/db";
import {
  ListMemoryEntriesQueryParams,
  ListMemoryEntriesResponse,
  CreateMemoryEntryBody,
  GetMemoryEntryParams,
  GetMemoryEntryResponse,
  UpdateMemoryEntryParams,
  UpdateMemoryEntryBody,
  UpdateMemoryEntryResponse,
  DeleteMemoryEntryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/memory", async (req, res): Promise<void> => {
  const query = ListMemoryEntriesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let entries = await db.select().from(memoryEntriesTable).orderBy(memoryEntriesTable.createdAt);

  if (query.data.search) {
    const term = query.data.search.toLowerCase();
    entries = entries.filter(
      (e) =>
        e.title.toLowerCase().includes(term) ||
        e.content.toLowerCase().includes(term)
    );
  }

  if (query.data.tag) {
    const tag = query.data.tag;
    entries = entries.filter((e) => e.tags.includes(tag));
  }

  res.json(ListMemoryEntriesResponse.parse(entries));
});

router.post("/memory", async (req, res): Promise<void> => {
  const parsed = CreateMemoryEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [entry] = await db
    .insert(memoryEntriesTable)
    .values({
      title: parsed.data.title,
      content: parsed.data.content,
      tags: parsed.data.tags ?? [],
    })
    .returning();

  res.status(201).json(GetMemoryEntryResponse.parse(entry));
});

router.get("/memory/:id", async (req, res): Promise<void> => {
  const params = GetMemoryEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [entry] = await db
    .select()
    .from(memoryEntriesTable)
    .where(eq(memoryEntriesTable.id, params.data.id));

  if (!entry) {
    res.status(404).json({ error: "Memory entry not found" });
    return;
  }

  res.json(GetMemoryEntryResponse.parse(entry));
});

router.patch("/memory/:id", async (req, res): Promise<void> => {
  const params = UpdateMemoryEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateMemoryEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.content !== undefined) updates.content = parsed.data.content;
  if (parsed.data.tags !== undefined) updates.tags = parsed.data.tags;

  const [entry] = await db
    .update(memoryEntriesTable)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(memoryEntriesTable.id, params.data.id))
    .returning();

  if (!entry) {
    res.status(404).json({ error: "Memory entry not found" });
    return;
  }

  res.json(UpdateMemoryEntryResponse.parse(entry));
});

router.delete("/memory/:id", async (req, res): Promise<void> => {
  const params = DeleteMemoryEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [entry] = await db
    .delete(memoryEntriesTable)
    .where(eq(memoryEntriesTable.id, params.data.id))
    .returning();

  if (!entry) {
    res.status(404).json({ error: "Memory entry not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;

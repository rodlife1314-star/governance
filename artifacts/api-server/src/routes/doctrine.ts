import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, doctrineRulesTable } from "@workspace/db";
import {
  ListDoctrineRulesResponse,
  CreateDoctrineRuleBody,
  UpdateDoctrineRuleParams,
  UpdateDoctrineRuleBody,
  UpdateDoctrineRuleResponse,
  DeleteDoctrineRuleParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/doctrine", async (_req, res): Promise<void> => {
  const rules = await db
    .select()
    .from(doctrineRulesTable)
    .orderBy(doctrineRulesTable.priority);

  res.json(ListDoctrineRulesResponse.parse(rules));
});

router.post("/doctrine", async (req, res): Promise<void> => {
  const parsed = CreateDoctrineRuleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [rule] = await db
    .insert(doctrineRulesTable)
    .values({
      name: parsed.data.name,
      description: parsed.data.description,
      priority: parsed.data.priority,
      scope: parsed.data.scope,
      action: parsed.data.action,
      conditions: parsed.data.conditions ?? null,
      active: parsed.data.active ?? true,
    })
    .returning();

  res.status(201).json(UpdateDoctrineRuleResponse.parse(rule));
});

router.patch("/doctrine/:id", async (req, res): Promise<void> => {
  const params = UpdateDoctrineRuleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateDoctrineRuleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.priority !== undefined) updates.priority = parsed.data.priority;
  if (parsed.data.scope !== undefined) updates.scope = parsed.data.scope;
  if (parsed.data.action !== undefined) updates.action = parsed.data.action;
  if (parsed.data.conditions !== undefined) updates.conditions = parsed.data.conditions;
  if (parsed.data.active !== undefined) updates.active = parsed.data.active;

  const [rule] = await db
    .update(doctrineRulesTable)
    .set(updates)
    .where(eq(doctrineRulesTable.id, params.data.id))
    .returning();

  if (!rule) {
    res.status(404).json({ error: "Doctrine rule not found" });
    return;
  }

  res.json(UpdateDoctrineRuleResponse.parse(rule));
});

router.delete("/doctrine/:id", async (req, res): Promise<void> => {
  const params = DeleteDoctrineRuleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [rule] = await db
    .delete(doctrineRulesTable)
    .where(eq(doctrineRulesTable.id, params.data.id))
    .returning();

  if (!rule) {
    res.status(404).json({ error: "Doctrine rule not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;

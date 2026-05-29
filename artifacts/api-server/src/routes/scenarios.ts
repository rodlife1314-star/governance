import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, scenariosTable } from "@workspace/db";
import {
  ListScenariosResponse,
  CreateScenarioBody,
  GetScenarioParams,
  GetScenarioResponse,
  UpdateScenarioParams,
  UpdateScenarioBody,
  UpdateScenarioResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/scenarios", async (_req, res): Promise<void> => {
  const scenarios = await db
    .select()
    .from(scenariosTable)
    .orderBy(scenariosTable.createdAt);

  res.json(ListScenariosResponse.parse(scenarios));
});

router.post("/scenarios", async (req, res): Promise<void> => {
  const parsed = CreateScenarioBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [scenario] = await db
    .insert(scenariosTable)
    .values({
      name: parsed.data.name,
      description: parsed.data.description,
      steps: parsed.data.steps ?? [],
      tags: parsed.data.tags ?? [],
      status: "draft",
    })
    .returning();

  res.status(201).json(GetScenarioResponse.parse(scenario));
});

router.get("/scenarios/:id", async (req, res): Promise<void> => {
  const params = GetScenarioParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [scenario] = await db
    .select()
    .from(scenariosTable)
    .where(eq(scenariosTable.id, params.data.id));

  if (!scenario) {
    res.status(404).json({ error: "Scenario not found" });
    return;
  }

  res.json(GetScenarioResponse.parse(scenario));
});

router.patch("/scenarios/:id", async (req, res): Promise<void> => {
  const params = UpdateScenarioParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateScenarioBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.steps !== undefined) updates.steps = parsed.data.steps;
  if (parsed.data.tags !== undefined) updates.tags = parsed.data.tags;

  const [scenario] = await db
    .update(scenariosTable)
    .set(updates)
    .where(eq(scenariosTable.id, params.data.id))
    .returning();

  if (!scenario) {
    res.status(404).json({ error: "Scenario not found" });
    return;
  }

  res.json(UpdateScenarioResponse.parse(scenario));
});

export default router;

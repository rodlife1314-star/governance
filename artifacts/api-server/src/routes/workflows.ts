import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, workflowsTable, workflowStepsTable } from "@workspace/db";
import {
  ListWorkflowsQueryParams,
  ListWorkflowsResponse,
  CreateWorkflowBody,
  GetWorkflowParams,
  GetWorkflowResponse,
  UpdateWorkflowParams,
  UpdateWorkflowBody,
  UpdateWorkflowResponse,
  DeleteWorkflowParams,
  AddWorkflowStepParams,
  AddWorkflowStepBody,
  UpdateWorkflowStepParams,
  UpdateWorkflowStepBody,
  UpdateWorkflowStepResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/workflows", async (req, res): Promise<void> => {
  const query = ListWorkflowsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const workflows = await db.select().from(workflowsTable).orderBy(workflowsTable.createdAt);
  const steps = await db.select().from(workflowStepsTable);

  const result = workflows
    .filter((w) => !query.data.status || w.status === query.data.status)
    .map((w) => {
      const wSteps = steps.filter((s) => s.workflowId === w.id);
      return {
        ...w,
        stepCount: wSteps.length,
        completedSteps: wSteps.filter((s) => s.status === "completed").length,
      };
    });

  res.json(ListWorkflowsResponse.parse(result));
});

router.post("/workflows", async (req, res): Promise<void> => {
  const parsed = CreateWorkflowBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [workflow] = await db
    .insert(workflowsTable)
    .values({
      name: parsed.data.name,
      description: parsed.data.description,
      tags: parsed.data.tags ?? [],
      status: "pending",
    })
    .returning();

  res.status(201).json(UpdateWorkflowResponse.parse({ ...workflow, stepCount: 0, completedSteps: 0 }));
});

router.get("/workflows/:id", async (req, res): Promise<void> => {
  const params = GetWorkflowParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [workflow] = await db
    .select()
    .from(workflowsTable)
    .where(eq(workflowsTable.id, params.data.id));

  if (!workflow) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }

  const steps = await db
    .select()
    .from(workflowStepsTable)
    .where(eq(workflowStepsTable.workflowId, params.data.id))
    .orderBy(workflowStepsTable.order);

  res.json(GetWorkflowResponse.parse({ ...workflow, steps }));
});

router.patch("/workflows/:id", async (req, res): Promise<void> => {
  const params = UpdateWorkflowParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateWorkflowBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.tags !== undefined) updates.tags = parsed.data.tags;

  const [workflow] = await db
    .update(workflowsTable)
    .set(updates)
    .where(eq(workflowsTable.id, params.data.id))
    .returning();

  if (!workflow) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }

  const steps = await db
    .select()
    .from(workflowStepsTable)
    .where(eq(workflowStepsTable.workflowId, params.data.id));

  res.json(UpdateWorkflowResponse.parse({
    ...workflow,
    stepCount: steps.length,
    completedSteps: steps.filter((s) => s.status === "completed").length,
  }));
});

router.delete("/workflows/:id", async (req, res): Promise<void> => {
  const params = DeleteWorkflowParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [workflow] = await db
    .delete(workflowsTable)
    .where(eq(workflowsTable.id, params.data.id))
    .returning();

  if (!workflow) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/workflows/:id/steps", async (req, res): Promise<void> => {
  const params = AddWorkflowStepParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AddWorkflowStepBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [workflow] = await db
    .select()
    .from(workflowsTable)
    .where(eq(workflowsTable.id, params.data.id));

  if (!workflow) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }

  const [step] = await db
    .insert(workflowStepsTable)
    .values({
      workflowId: params.data.id,
      action: parsed.data.action,
      description: parsed.data.description ?? null,
      order: parsed.data.order,
      executionMode: parsed.data.executionMode ?? "local",
      status: "pending",
    })
    .returning();

  res.status(201).json(step);
});

router.patch("/workflows/:id/steps/:stepId", async (req, res): Promise<void> => {
  const params = UpdateWorkflowStepParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateWorkflowStepBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.result !== undefined) updates.result = parsed.data.result;
  if (parsed.data.executionMode !== undefined) updates.executionMode = parsed.data.executionMode;

  const [step] = await db
    .update(workflowStepsTable)
    .set(updates)
    .where(
      and(
        eq(workflowStepsTable.id, params.data.stepId),
        eq(workflowStepsTable.workflowId, params.data.id)
      )
    )
    .returning();

  if (!step) {
    res.status(404).json({ error: "Workflow step not found" });
    return;
  }

  res.json(UpdateWorkflowStepResponse.parse(step));
});

export default router;

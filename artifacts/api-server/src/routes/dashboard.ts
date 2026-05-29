import { Router, type IRouter } from "express";
import { db, memoryEntriesTable, doctrineRulesTable, workflowsTable, workflowStepsTable, routingDecisionsTable, scenariosTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  GetDashboardSummaryResponse,
  GetRecentActivityResponse,
  GetRoutingStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [memCount] = await db.select({ count: sql<number>`count(*)` }).from(memoryEntriesTable);
  const [docCount] = await db.select({ count: sql<number>`count(*)` }).from(doctrineRulesTable);
  const workflows = await db.select().from(workflowsTable);
  const [routingCount] = await db.select({ count: sql<number>`count(*)` }).from(routingDecisionsTable);
  const routingDecisions = await db.select().from(routingDecisionsTable);
  const scenarios = await db.select().from(scenariosTable);

  const summary = {
    totalMemoryEntries: Number(memCount?.count ?? 0),
    totalDoctrineRules: Number(docCount?.count ?? 0),
    totalWorkflows: workflows.length,
    activeWorkflows: workflows.filter((w) => w.status === "active").length,
    completedWorkflows: workflows.filter((w) => w.status === "completed").length,
    totalRoutingDecisions: Number(routingCount?.count ?? 0),
    localDecisions: routingDecisions.filter((r) => r.decision === "local").length,
    cloudDecisions: routingDecisions.filter((r) => r.decision === "cloud").length,
    hybridDecisions: routingDecisions.filter((r) => r.decision === "hybrid").length,
    totalScenarios: scenarios.length,
    readyScenarios: scenarios.filter((s) => s.status === "ready").length,
  };

  res.json(GetDashboardSummaryResponse.parse(summary));
});

router.get("/dashboard/activity", async (_req, res): Promise<void> => {
  const [memories, doctrine, workflows, routing, scenarios] = await Promise.all([
    db.select().from(memoryEntriesTable).orderBy(memoryEntriesTable.createdAt).limit(5),
    db.select().from(doctrineRulesTable).orderBy(doctrineRulesTable.createdAt).limit(5),
    db.select().from(workflowsTable).orderBy(workflowsTable.createdAt).limit(5),
    db.select().from(routingDecisionsTable).orderBy(routingDecisionsTable.createdAt).limit(5),
    db.select().from(scenariosTable).orderBy(scenariosTable.createdAt).limit(5),
  ]);

  const items = [
    ...memories.map((m) => ({
      id: `memory-${m.id}`,
      type: "memory" as const,
      title: `Memory: ${m.title}`,
      description: m.content.substring(0, 100),
      createdAt: m.createdAt.toISOString(),
    })),
    ...doctrine.map((d) => ({
      id: `doctrine-${d.id}`,
      type: "doctrine" as const,
      title: `Doctrine: ${d.name}`,
      description: d.description.substring(0, 100),
      createdAt: d.createdAt.toISOString(),
    })),
    ...workflows.map((w) => ({
      id: `workflow-${w.id}`,
      type: "workflow" as const,
      title: `Workflow: ${w.name}`,
      description: `Status: ${w.status}`,
      createdAt: w.createdAt.toISOString(),
    })),
    ...routing.map((r) => ({
      id: `routing-${r.id}`,
      type: "routing" as const,
      title: `Routing: ${r.decision.toUpperCase()}`,
      description: r.query.substring(0, 100),
      createdAt: r.createdAt.toISOString(),
    })),
    ...scenarios.map((s) => ({
      id: `scenario-${s.id}`,
      type: "scenario" as const,
      title: `Scenario: ${s.name}`,
      description: s.description.substring(0, 100),
      createdAt: s.createdAt.toISOString(),
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

  res.json(GetRecentActivityResponse.parse(items));
});

router.get("/dashboard/routing-stats", async (_req, res): Promise<void> => {
  const decisions = await db.select().from(routingDecisionsTable);

  const local = decisions.filter((d) => d.decision === "local").length;
  const cloud = decisions.filter((d) => d.decision === "cloud").length;
  const hybrid = decisions.filter((d) => d.decision === "hybrid").length;
  const total = decisions.length;

  const stats = {
    local,
    cloud,
    hybrid,
    total,
    localPct: total > 0 ? Math.round((local / total) * 100) / 100 : 0,
    cloudPct: total > 0 ? Math.round((cloud / total) * 100) / 100 : 0,
    hybridPct: total > 0 ? Math.round((hybrid / total) * 100) / 100 : 0,
  };

  res.json(GetRoutingStatsResponse.parse(stats));
});

export default router;

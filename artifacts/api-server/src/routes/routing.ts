import { Router, type IRouter } from "express";
import { db, routingDecisionsTable } from "@workspace/db";
import {
  ListRoutingDecisionsResponse,
  EvaluateRoutingBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function evaluateQuery(query: string, context?: string): {
  decision: "local" | "cloud" | "hybrid";
  localScore: number;
  cloudScore: number;
  reasoning: string;
  latencyMs: number;
} {
  const start = Date.now();
  const text = (query + " " + (context ?? "")).toLowerCase();

  let localScore = 0.5;
  let cloudScore = 0.5;

  const localSignals = [
    "local", "private", "offline", "sovereign", "doctrine", "memory",
    "workflow", "file", "personal", "confidential", "secret", "internal",
    "config", "settings", "rules", "governance",
  ];
  const cloudSignals = [
    "cloud", "internet", "search", "web", "latest", "realtime", "api",
    "external", "public", "news", "weather", "translate", "complex reasoning",
    "long context", "multimodal", "image", "vision",
  ];

  for (const signal of localSignals) {
    if (text.includes(signal)) localScore += 0.08;
  }
  for (const signal of cloudSignals) {
    if (text.includes(signal)) cloudScore += 0.08;
  }

  if (query.length < 50) localScore += 0.1;
  if (query.length > 200) cloudScore += 0.1;

  localScore = Math.min(localScore, 1.0);
  cloudScore = Math.min(cloudScore, 1.0);

  const total = localScore + cloudScore;
  localScore = Math.round((localScore / total) * 100) / 100;
  cloudScore = Math.round((cloudScore / total) * 100) / 100;

  let decision: "local" | "cloud" | "hybrid";
  let reasoning: string;

  if (localScore >= 0.65) {
    decision = "local";
    reasoning = `Query matches local-first doctrine patterns (score: ${localScore}). No external compute required — Ollama inference and local memory retrieval are sufficient.`;
  } else if (cloudScore >= 0.65) {
    decision = "cloud";
    reasoning = `Query requires cloud compute (score: ${cloudScore}). Complexity or external data requirements exceed local inference capabilities.`;
  } else {
    decision = "hybrid";
    reasoning = `Balanced routing (local: ${localScore}, cloud: ${cloudScore}). Query benefits from local context retrieval combined with cloud inference for final synthesis.`;
  }

  return {
    decision,
    localScore,
    cloudScore,
    reasoning,
    latencyMs: Date.now() - start,
  };
}

router.get("/routing", async (_req, res): Promise<void> => {
  const decisions = await db
    .select()
    .from(routingDecisionsTable)
    .orderBy(routingDecisionsTable.createdAt);

  res.json(ListRoutingDecisionsResponse.parse(decisions));
});

router.post("/routing", async (req, res): Promise<void> => {
  const parsed = EvaluateRoutingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const evaluation = evaluateQuery(parsed.data.query, parsed.data.context);

  const [decision] = await db
    .insert(routingDecisionsTable)
    .values({
      query: parsed.data.query,
      decision: evaluation.decision,
      localScore: evaluation.localScore,
      cloudScore: evaluation.cloudScore,
      reasoning: evaluation.reasoning,
      latencyMs: evaluation.latencyMs,
    })
    .returning();

  res.status(201).json(decision);
});

export default router;

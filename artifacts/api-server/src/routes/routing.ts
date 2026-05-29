import { Router, type IRouter } from "express";
import { db, routingDecisionsTable } from "@workspace/db";
import {
  ListRoutingDecisionsResponse,
  EvaluateRoutingBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Governance JSON — mirrors Rod's actual prototypes/governance.json
const GOVERNANCE = {
  default_mode: "local" as const,
  escalation_rules: {
    external_information: "cloud",
    heavy_compute: "cloud",
    operator_request: "cloud",
    memory_lookup: "local",
    competition_planning: "local",
    web_search: "cloud",
    document_analysis: "local",
  } as Record<string, string>,
  fallback: "local" as const,
};

// Named-category signals that map directly to governance.json task types
const GOVERNANCE_SIGNALS: Array<{ patterns: string[]; category: keyof typeof GOVERNANCE.escalation_rules }> = [
  { patterns: ["web search", "search the web", "search online", "look up online", "google"], category: "web_search" },
  { patterns: ["external", "external information", "news", "weather", "latest", "realtime", "real-time", "from the internet"], category: "external_information" },
  { patterns: ["competition planning", "competition prep", "competition strategy", "competition readiness"], category: "competition_planning" },
  { patterns: ["memory lookup", "retrieve memory", "from memory", "memory bank", "doctrine lookup", "my doctrine", "local memory"], category: "memory_lookup" },
  { patterns: ["analyse document", "analyze document", "document analysis", "read this file", "summarise this document"], category: "document_analysis" },
  { patterns: ["heavy compute", "long context", "complex reasoning", "multimodal", "vision", "image analysis", "generate long"], category: "heavy_compute" },
];

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
  const matchedCategories: string[] = [];

  // Step 1: Check named governance categories (high-confidence, direct match)
  for (const { patterns, category } of GOVERNANCE_SIGNALS) {
    if (patterns.some((p) => text.includes(p))) {
      const destination = GOVERNANCE.escalation_rules[category];
      matchedCategories.push(`${category}→${destination}`);
      if (destination === "local") localScore += 0.25;
      else if (destination === "cloud") cloudScore += 0.25;
    }
  }

  // Step 2: Keyword signal scoring (doctrine-aligned)
  const localSignals = [
    "local", "private", "offline", "sovereign", "doctrine", "memory",
    "workflow", "personal", "confidential", "internal", "governance",
    "centre", "identity", "state", "operator", "heartbeat", "kernel",
    "sandbo", "rules", "review", "forge", "ice cream", "recipe",
  ];
  const cloudSignals = [
    "cloud", "internet", "search", "web", "realtime", "api",
    "public", "news", "weather", "translate", "image", "vision",
    "research", "simulate", "pattern expansion", "remote",
  ];

  for (const signal of localSignals) {
    if (text.includes(signal)) localScore += 0.06;
  }
  for (const signal of cloudSignals) {
    if (text.includes(signal)) cloudScore += 0.06;
  }

  // Step 3: Query length heuristic
  if (query.length < 50) localScore += 0.08;
  if (query.length > 250) cloudScore += 0.08;

  localScore = Math.min(localScore, 1.0);
  cloudScore = Math.min(cloudScore, 1.0);

  const total = localScore + cloudScore;
  localScore = Math.round((localScore / total) * 100) / 100;
  cloudScore = Math.round((cloudScore / total) * 100) / 100;

  let decision: "local" | "cloud" | "hybrid";
  let reasoning: string;

  const govNote = matchedCategories.length > 0
    ? ` Governance rules matched: [${matchedCategories.join(", ")}].`
    : "";

  if (localScore >= 0.60) {
    decision = "local";
    reasoning = `LOCAL route (score: ${localScore}).${govNote} Doctrine-aligned: private context, memory retrieval, or operator-state query. Ollama local inference is sufficient — no external compute required.`;
  } else if (cloudScore >= 0.60) {
    decision = "cloud";
    reasoning = `CLOUD route (score: ${cloudScore}).${govNote} External compute authorised: external data required, heavy inference, or web search. Per External Compute Authority Law — output must return through Centre for review before becoming permanent.`;
  } else {
    decision = "hybrid";
    reasoning = `HYBRID route (local: ${localScore}, cloud: ${cloudScore}).${govNote} Balanced: local context retrieval feeds the prompt; cloud inference handles synthesis or generation. Both legs logged for audit.`;
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

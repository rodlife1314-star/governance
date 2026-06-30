#!/usr/bin/env node
/**
 * prerender.mjs — post-build static HTML generator for OCTAGON
 *
 * Reads the built dist/public/index.html and emits per-route copies, each
 * with route-specific <title>, <meta name="description">, Open Graph tags,
 * and a meaningful static body so non-JS crawlers receive real page content.
 *
 * Run automatically via the "build" npm script after `vite build`.
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, "dist/public");

let shell;
try {
  shell = readFileSync(join(distDir, "index.html"), "utf8");
} catch {
  console.error("[prerender] dist/public/index.html not found — skipping prerender. Run vite build first.");
  process.exit(0);
}

const BASE_URL = "https://governance-rodlife1314.replit.app";

const ROUTES = [
  {
    slug: "dashboard",
    title: "OCTAGON — System Dashboard",
    description:
      "Live system metrics, routing distribution charts, and real-time activity feed. Monitor local vs cloud routing decisions and module health across all OCTAGON systems.",
    ogDescription:
      "Live system metrics, routing distribution, and real-time activity feed for the OCTAGON operator assistant. Monitor local vs cloud routing decisions as they happen.",
    heading: "System Dashboard",
    intro:
      "Live system metrics and routing distribution charts give you an at-a-glance view of every local and cloud routing decision. The real-time activity feed surfaces memory writes, doctrine evaluations, and workflow state changes as they occur.",
    features: [
      "Real-time routing distribution — local vs cloud decision breakdown",
      "Live memory bank activity and recent write events",
      "Workflow status overview across all active operational workflows",
      "System health indicators for all seven OCTAGON modules",
    ],
  },
  {
    slug: "memory",
    title: "OCTAGON — Memory Bank",
    description:
      "Browse, search, tag-filter, create, and edit markdown-style memory entries. The OCTAGON memory bank is the durable knowledge store for all operator-captured context.",
    ogDescription:
      "Browse, search, and manage the OCTAGON memory bank. Create and edit markdown-style memory entries, filter by tags, and maintain a durable sovereign knowledge store.",
    heading: "Memory Bank",
    intro:
      "The Memory Bank is OCTAGON's durable knowledge store. Browse and full-text-search all memory entries, filter by tags, and create or edit entries in a markdown-style editor. Every entry is stored locally — no cloud sync required.",
    features: [
      "Full-text search across all memory entries",
      "Tag-based filtering for rapid retrieval",
      "Markdown-style editor for rich entry creation and editing",
      "Local-first storage — sovereign, no external dependency",
    ],
  },
  {
    slug: "doctrine",
    title: "OCTAGON — Doctrine",
    description:
      "Manage governance rules with priority ordering, scope control (local, cloud, hybrid), conditional triggers, and active/inactive toggle. The OCTAGON doctrine layer governs all routing decisions.",
    ogDescription:
      "Manage OCTAGON governance rules with priority ordering, scope control, and conditional triggers. The doctrine layer governs every routing decision made by the system.",
    heading: "Doctrine",
    intro:
      "Doctrine is the governance rules layer that controls how OCTAGON routes every query. Each rule carries a priority rank, a scope (local, cloud, or hybrid), optional conditions, and an active toggle. Higher-priority doctrine always wins over lower-priority rules.",
    features: [
      "Priority-ordered governance rules with drag-to-reorder",
      "Scope control — local, cloud, or hybrid per rule",
      "Conditional triggers for context-aware routing",
      "Instant active/inactive toggle without rule deletion",
    ],
  },
  {
    slug: "workflows",
    title: "OCTAGON — Workflows",
    description:
      "Operational workflow tracking with per-step execution mode (local, cloud, hybrid) and live status. Plan and execute complex multi-step operational procedures in OCTAGON.",
    ogDescription:
      "Track operational workflows with per-step execution mode control and live status updates. Plan and execute complex multi-step operational procedures inside OCTAGON.",
    heading: "Workflows",
    intro:
      "Workflows gives you structured execution tracking for complex multi-step operations. Each workflow contains ordered steps, and each step carries its own execution mode — local, cloud, or hybrid — along with a status that updates as the operation progresses.",
    features: [
      "Multi-step workflow definitions with ordered execution",
      "Per-step execution mode — local, cloud, or hybrid",
      "Live status tracking from pending through to complete",
      "Detailed workflow view with step-by-step progress",
    ],
  },
  {
    slug: "routing",
    title: "OCTAGON — Routing Evaluator",
    description:
      "Interactive routing evaluator: enter a query, see local vs cloud scores and keyword-based reasoning, and browse the full decision history. Deterministic — no LLM required.",
    ogDescription:
      "Interactive routing evaluator for OCTAGON. Enter any query to see local vs cloud scores, keyword signal reasoning, and a full decision history. Fully deterministic — no LLM required.",
    heading: "Routing Evaluator",
    intro:
      "The Routing Evaluator lets you test any query against OCTAGON's deterministic local-vs-cloud scoring engine. Enter a query and instantly see the local score, cloud score, keyword signals that drove the decision, and a full history of past routing evaluations.",
    features: [
      "Deterministic local vs cloud scoring — no external LLM call",
      "Keyword signal breakdown showing what drove each decision",
      "Query-length heuristics and context-based score adjustment",
      "Full decision history with timestamps and score breakdowns",
    ],
  },
  {
    slug: "scenarios",
    title: "OCTAGON — Scenarios",
    description:
      "Competition demo scenarios with multi-step execution and full status lifecycle management. Draft, ready, running, and completed states for every scenario in OCTAGON.",
    ogDescription:
      "Manage OCTAGON competition demo scenarios with multi-step execution and full status lifecycle. Move scenarios from draft through ready, running, and completed states.",
    heading: "Scenarios",
    intro:
      "Scenarios are structured competition demonstration scripts. Each scenario contains an ordered list of steps and moves through a defined lifecycle — draft, ready, running, and completed — so you can rehearse and execute real competition demonstrations with precision.",
    features: [
      "Multi-step scenario definitions with ordered execution steps",
      "Full status lifecycle: draft → ready → running → completed",
      "Competition-ready demonstration scripts",
      "Status management with clear state transitions",
    ],
  },
];

function buildStaticBody(route) {
  const featureItems = route.features
    .map(
      (f) =>
        `<li style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:13px;color:rgba(200,207,224,0.45);">⬡ ${f}</li>`,
    )
    .join("");

  return `<div style="background:#07080B;color:#c8d0e0;font-family:Inter,sans-serif;min-height:100vh;padding:60px 24px;box-sizing:border-box;">
  <div style="max-width:800px;margin:0 auto;">
    <nav style="margin-bottom:48px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
      <a href="/" style="font-family:'Space Mono',monospace;font-size:10px;letter-spacing:0.2em;color:rgba(79,195,247,0.8);text-decoration:none;">← OCTAGON</a>
      <span style="color:rgba(255,255,255,0.1);font-size:10px;">·</span>
      <a href="/dashboard" style="font-family:'Space Mono',monospace;font-size:9px;letter-spacing:0.14em;color:rgba(200,207,224,0.35);text-decoration:none;">DASHBOARD</a>
      <a href="/memory" style="font-family:'Space Mono',monospace;font-size:9px;letter-spacing:0.14em;color:rgba(200,207,224,0.35);text-decoration:none;">MEMORY</a>
      <a href="/doctrine" style="font-family:'Space Mono',monospace;font-size:9px;letter-spacing:0.14em;color:rgba(200,207,224,0.35);text-decoration:none;">DOCTRINE</a>
      <a href="/workflows" style="font-family:'Space Mono',monospace;font-size:9px;letter-spacing:0.14em;color:rgba(200,207,224,0.35);text-decoration:none;">WORKFLOWS</a>
      <a href="/routing" style="font-family:'Space Mono',monospace;font-size:9px;letter-spacing:0.14em;color:rgba(200,207,224,0.35);text-decoration:none;">ROUTING</a>
      <a href="/scenarios" style="font-family:'Space Mono',monospace;font-size:9px;letter-spacing:0.14em;color:rgba(200,207,224,0.35);text-decoration:none;">SCENARIOS</a>
    </nav>
    <p style="font-family:'Space Mono',monospace;font-size:9px;letter-spacing:0.22em;color:rgba(79,195,247,0.4);margin-bottom:16px;">OCTAGON · ${route.slug.toUpperCase()}</p>
    <h1 style="font-family:'Space Mono',monospace;font-size:clamp(24px,5vw,40px);font-weight:700;letter-spacing:0.12em;color:#e8ecf8;margin-bottom:24px;">${route.heading}</h1>
    <p style="font-size:15px;color:rgba(200,207,224,0.5);line-height:1.8;max-width:640px;margin-bottom:40px;">${route.intro}</p>
    <section style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:24px 28px;margin-bottom:40px;">
      <h2 style="font-family:'Space Mono',monospace;font-size:9px;letter-spacing:0.2em;color:rgba(79,195,247,0.45);margin:0 0 16px;">CAPABILITIES</h2>
      <ul style="list-style:none;padding:0;margin:0;">${featureItems}</ul>
    </section>
    <p style="font-family:'Space Mono',monospace;font-size:8px;letter-spacing:0.16em;color:rgba(79,195,247,0.2);">⬡ LOCAL-FIRST · SOVEREIGNTY-PRESERVED · DETERMINISTIC ROUTING</p>
  </div>
</div>`;
}

function patchMeta(html, route, ogImageUrl) {
  // Replace <title>
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${route.title}</title>`,
  );

  // Replace standard description
  html = html.replace(
    /(<meta name="description" content=")[^"]*(")/,
    `$1${route.description}$2`,
  );

  // Replace og:title
  html = html.replace(
    /(<meta property="og:title" content=")[^"]*(")/,
    `$1${route.title}$2`,
  );

  // Replace og:description
  html = html.replace(
    /(<meta property="og:description" content=")[^"]*(")/,
    `$1${route.ogDescription}$2`,
  );

  // Replace og:url
  html = html.replace(
    /(<meta property="og:url" content=")[^"]*(")/,
    `$1${BASE_URL}/${route.slug}/$2`,
  );

  // Replace og:image (absolute URL already set for root; patch for sub-routes too)
  html = html.replace(
    /(<meta property="og:image" content=")[^"]*(")/,
    `$1${ogImageUrl}$2`,
  );

  // Replace og:image:alt
  html = html.replace(
    /(<meta property="og:image:alt" content=")[^"]*(")/,
    `$1OCTAGON — ${route.heading}$2`,
  );

  // Replace twitter:title
  html = html.replace(
    /(<meta name="twitter:title" content=")[^"]*(")/,
    `$1${route.title}$2`,
  );

  // Replace twitter:description
  html = html.replace(
    /(<meta name="twitter:description" content=")[^"]*(")/,
    `$1${route.ogDescription}$2`,
  );

  // Replace twitter:image
  html = html.replace(
    /(<meta name="twitter:image" content=")[^"]*(")/,
    `$1${ogImageUrl}$2`,
  );

  // Replace static root content in <div id="root"> with route-specific content
  html = html.replace(
    /<div id="root">[\s\S]*?<\/div>\s*(?=<script)/,
    `<div id="root">\n      ${buildStaticBody(route)}\n    </div>\n    `,
  );

  return html;
}

let generated = 0;

for (const route of ROUTES) {
  const ogImageUrl = `${BASE_URL}/opengraph.jpg`;
  const patched = patchMeta(shell, route, ogImageUrl);

  const outDir = join(distDir, route.slug);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), patched, "utf8");
  console.log(`[prerender] /${route.slug}/ → ${route.title}`);
  generated++;
}

console.log(`[prerender] done — ${generated} routes generated.`);

import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore, FieldValue } from "firebase-admin/firestore";

// ── Singleton init ─────────────────────────────────────────────────────────────

let _app: App | null = null;
let _db: Firestore | null = null;
let _initError: string | null = null;

function parseServiceAccountKey(raw: string): Record<string, unknown> {
  // Attempt 1: plain JSON
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // not plain JSON — try base64
  }

  // Attempt 2: base64-encoded JSON (Replit stores some secrets this way)
  try {
    const decoded = Buffer.from(raw, "base64").toString("utf-8");
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    // not base64 JSON either
  }

  throw new Error(
    `FIREBASE_SERVICE_ACCOUNT_KEY is neither valid JSON nor base64-encoded JSON ` +
    `(starts with: ${raw.substring(0, 12)}...)`
  );
}

function init(): Firestore | null {
  if (_db) return _db;
  if (_initError) return null;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    _initError = "FIREBASE_SERVICE_ACCOUNT_KEY not set — Firestore writes disabled";
    console.warn("[firestore] " + _initError);
    return null;
  }

  try {
    const serviceAccount = parseServiceAccountKey(raw);
    const existing = getApps();
    _app = existing.length > 0
      ? existing[0]
      : initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]) });
    _db = getFirestore(_app);
    console.info("[firestore] Initialized — project:", serviceAccount.project_id);
    return _db;
  } catch (err: any) {
    _initError = `Firestore init failed: ${err?.message ?? err}`;
    console.error("[firestore] " + _initError);
    return null;
  }
}

// ── Dispatch shape ─────────────────────────────────────────────────────────────

export interface DispatchRecord {
  id: string;
  authority: string;
  asset: string;
  price: string;
  packetId: string;
  operatorEmail: string;
  logs: string[];
  signature: string;
  createdAt: string;
  verified: boolean;
  operatorDecision: string;
  divergenceState: string;
  divergenceDelta: number;
}

// ── Write a dispatch to Firestore (fire-and-forget safe) ───────────────────────
// Returns true on success, false if Firestore is unavailable or the write fails.
// Never throws — Postgres is the primary store; Firestore is the sovereign ledger.

export async function writeDispatch(record: DispatchRecord): Promise<boolean> {
  const db = init();
  if (!db) return false;

  try {
    await db.collection("dispatches").doc(record.id).set({
      ...record,
      // Add a server-side Firestore timestamp alongside the ISO string
      firestoreTimestamp: FieldValue.serverTimestamp(),
      origin: "crystal-bridge",
      engine: "pathfinder-sovereign",
    });
    return true;
  } catch (err: any) {
    console.error("[firestore] writeDispatch failed:", err?.message ?? err);
    return false;
  }
}

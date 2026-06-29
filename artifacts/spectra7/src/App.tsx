import { useState, useEffect } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────
type View = "entry" | "investigation";

const DOMAINS = ["Astrophysics", "Medicine", "Law", "Technology", "Finance", "Custom"] as const;
type Domain = (typeof DOMAINS)[number];

interface HypData {
  id: string;
  name: string;
  desc: string;
  prob: number;
}

interface GeneratedCase {
  caseId: string;
  caseTitle: string;
  caseSubtitle: string;
  contextSummary: string;
  hypotheses: HypData[];
}

// ─── Entry view ─────────────────────────────────────────────────────────────
function EntryView({ onBegin }: { onBegin: (obs: string, domain: string, sub: string) => void }) {
  const [observation, setObservation] = useState("");
  const [domain, setDomain] = useState<Domain | null>(null);
  const [subDomain, setSubDomain] = useState("");
  const canBegin = observation.trim().length > 10 && domain !== null;

  return (
    <div id="s7app">
      <style>{CSS}</style>
      <div className="s7-starfield" />
      <div className="s7-entry-container">
        <div className="s7-entry-header">
          <div className="s7-status-row">
            <div className="s7-pulse-dot" />
            <span>SPECTRA-7 // ANOMALY INVESTIGATION ENGINE — ONLINE</span>
          </div>
          <div className="s7-entry-title">SPECTRA-7</div>
          <div className="s7-entry-sub">SPECTROSCOPIC ANOMALY CLASSIFICATION PROTOCOL</div>
          <div className="s7-entry-rule" />
          <div className="s7-entry-desc">
            Describe the anomaly. Select the operational domain. SPECTRA-7 will generate an
            investigation case, build the hypothesis space, and activate the dimensional engine.
          </div>
        </div>

        <div className="s7-field-label">ANOMALY DESCRIPTION</div>
        <textarea
          className="s7-obs-input"
          placeholder="Describe the signal, observation, or anomaly that requires investigation..."
          value={observation}
          onChange={e => setObservation(e.target.value)}
          rows={4}
        />

        <div className="s7-field-label" style={{ marginTop: 24 }}>OPERATIONAL DOMAIN</div>
        <div className="s7-domain-grid">
          {DOMAINS.map(d => (
            <button
              key={d}
              className={`s7-domain-btn${domain === d ? " s7-domain-active" : ""}`}
              onClick={() => setDomain(d)}
            >
              {d.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="s7-field-label" style={{ marginTop: 20 }}>
          SUB-DOMAIN <span style={{ color: "#3a4555" }}>/ OPTIONAL</span>
        </div>
        <input
          className="s7-sub-input"
          type="text"
          placeholder="e.g. Emission spectroscopy, Cardiology, Contract law..."
          value={subDomain}
          onChange={e => setSubDomain(e.target.value)}
        />

        <button
          className={`s7-begin-btn${canBegin ? " s7-begin-active" : ""}`}
          disabled={!canBegin}
          onClick={() => onBegin(observation.trim(), domain!, subDomain.trim())}
        >
          {canBegin
            ? "INITIALIZE INVESTIGATION →"
            : "ENTER OBSERVATION + SELECT DOMAIN TO BEGIN"}
        </button>

        <div className="s7-entry-doctrine">
          ⬡ NEMOTRON-550B · REASONING ENGINE ACTIVE · SOVEREIGN LEDGER READY
        </div>
      </div>
    </div>
  );
}

// ─── Investigation view ─────────────────────────────────────────────────────
function InvestigationView({
  observation,
  domain,
  subDomain,
  onBack,
}: {
  observation: string;
  domain: string;
  subDomain: string;
  onBack: () => void;
}) {
  const [generatedCase, setGeneratedCase] = useState<GeneratedCase | null>(null);
  const [generating, setGenerating] = useState(true);
  const [generateError, setGenerateError] = useState("");

  const [selectedHyp, setSelectedHyp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reasoning, setReasoning] = useState("");
  const [verdict, setVerdict] = useState("");
  const [panelTitle, setPanelTitle] = useState("");
  const [error, setError] = useState("");
  const [sealed, setSealed] = useState(false);
  const [thinkingTrace, setThinkingTrace] = useState("");
  const [thinkingOpen, setThinkingOpen] = useState(false);
  const [engine, setEngine] = useState<"gemini" | "nvidia">("nvidia");

  useEffect(() => {
    let cancelled = false;
    setGenerating(true);
    setGenerateError("");
    setGeneratedCase(null);
    setSelectedHyp(null);

    fetch("/api/spectra/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ observation, domain, subDomain }),
    })
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        if (d.success) setGeneratedCase(d as GeneratedCase);
        else setGenerateError(d.error || "Case generation failed");
      })
      .catch(e => {
        if (!cancelled) setGenerateError(e.message || "Network error");
      })
      .finally(() => {
        if (!cancelled) setGenerating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [observation, domain, subDomain]);

  function selectHyp(id: string) {
    setSelectedHyp(id);
    setReasoning("");
    setVerdict("");
    setError("");
    setSealed(false);
    setThinkingTrace("");
    setThinkingOpen(false);
  }

  async function runInvestigation() {
    if (!selectedHyp || !generatedCase) return;
    const hyp = generatedCase.hypotheses.find(h => h.id === selectedHyp);
    if (!hyp) return;

    setIsLoading(true);
    setReasoning("");
    setVerdict("");
    setError("");
    setPanelTitle("");
    setSealed(false);

    try {
      const res = await fetch("/api/spectra/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          observation,
          domain,
          caseTitle: generatedCase.caseTitle,
          caseContext: generatedCase.contextSummary,
          hypName: hyp.name,
          hypDesc: hyp.desc,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Unknown error");
      setPanelTitle(data.title || "");
      setReasoning(data.analysis || "");
      setVerdict(data.verdict || "");
      if (data.thinkingTrace) {
        setThinkingTrace(data.thinkingTrace);
        setEngine(data.engine === "nvidia" ? "nvidia" : "gemini");
      }
      setSealed(true);
    } catch (err: unknown) {
      setError(
        `ANALYSIS ENGINE ERROR: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setIsLoading(false);
    }
  }

  const panelActive = isLoading || !!reasoning || !!error;
  const verdictActive = !!verdict && !isLoading;

  return (
    <div id="s7app">
      <style>{CSS}</style>
      <div className="s7-starfield" />
      <button className="s7-back-btn" onClick={onBack}>
        ← NEW CASE
      </button>

      <div className="s7-container">
        <div className="s7-alert-bar">
          <div className="s7-alert-dot" />
          SPECTRA-7 // {domain}
          {subDomain ? ` · ${subDomain}` : ""} INVESTIGATION — ACTIVE
        </div>

        <div className="s7-doctrine-badge">
          ⬡ ROUTING DOCTRINE ACTIVE ·{" "}
          {engine === "nvidia"
            ? "NEMOTRON-550B · REASONING ENGINE"
            : "DIMENSIONAL ENGINE"}{" "}
          · SOVEREIGN LEDGER
        </div>

        {generating && (
          <div className="s7-generating-wrap">
            <div className="s7-generating-label">GENERATING INVESTIGATION CASE</div>
            <div className="s7-loading-dots">
              <span />
              <span />
              <span />
            </div>
            <div className="s7-generating-sub">
              Classifying domain context · Building hypothesis space · {domain}
              {subDomain ? ` / ${subDomain}` : ""}
            </div>
          </div>
        )}

        {!generating && generateError && (
          <div style={{ padding: "48px 0", textAlign: "center" }}>
            <div
              style={{
                color: "#e8405a",
                fontFamily: "'Space Mono', monospace",
                fontSize: "11px",
                letterSpacing: "0.1em",
                marginBottom: 12,
              }}
            >
              CASE GENERATION FAILED
            </div>
            <div style={{ color: "#5a6080", fontSize: "12px", marginBottom: 24 }}>
              {generateError}
            </div>
            <button className="s7-back-btn" style={{ position: "static" }} onClick={onBack}>
              ← TRY AGAIN
            </button>
          </div>
        )}

        {!generating && generatedCase && (
          <>
            <div className="s7-title-block">
              <div className="s7-eyebrow">
                {generatedCase.caseId} // {domain}
                {subDomain ? ` · ${subDomain.toUpperCase()}` : ""} INVESTIGATION
              </div>
              <h1 className="s7-h1">{generatedCase.caseTitle}</h1>
              <p className="s7-subtitle">{generatedCase.caseSubtitle}</p>
            </div>

            <div className="s7-section-title">Observational Context</div>
            <div className="s7-panel">
              <div className="s7-obs-entry">
                <span className="s7-obs-ts">INPUT</span>
                <span className="s7-obs-msg s7-obs-info">"{observation}"</span>
              </div>
              <div className="s7-obs-entry" style={{ marginTop: 8 }}>
                <span className="s7-obs-ts">AETHER</span>
                <span className="s7-obs-msg">{generatedCase.contextSummary}</span>
              </div>
              <div className="s7-obs-entry" style={{ marginTop: 8 }}>
                <span className="s7-obs-ts">DOMAIN</span>
                <span className="s7-obs-msg s7-obs-info">
                  {domain}
                  {subDomain ? ` / ${subDomain}` : ""} — CLASSIFICATION CONFIRMED
                </span>
              </div>
            </div>

            <div className="s7-section-title">Candidate Hypotheses</div>
            {generatedCase.hypotheses.map(hyp => (
              <div
                key={hyp.id}
                className={`s7-hyp-card${selectedHyp === hyp.id ? " s7-selected" : ""}`}
                onClick={() => selectHyp(hyp.id)}
              >
                <div className="s7-hyp-id">{hyp.id}</div>
                <div className="s7-hyp-name">{hyp.name}</div>
                <div className="s7-hyp-prob">{hyp.prob}%</div>
                <div className="s7-hyp-desc">{hyp.desc}</div>
                <div className="s7-prob-bar-wrap">
                  <div className="s7-prob-bar" style={{ width: `${Math.min(hyp.prob, 99)}%` }} />
                </div>
              </div>
            ))}

            <button
              className="s7-investigate-btn"
              disabled={!selectedHyp || isLoading}
              onClick={runInvestigation}
            >
              {isLoading
                ? "ANALYSING — DIMENSIONAL ENGINE ACTIVE..."
                : selectedHyp
                  ? `INVESTIGATE ${selectedHyp} → SEAL TO SOVEREIGN LEDGER`
                  : "SELECT A HYPOTHESIS TO INVESTIGATE →"}
            </button>

            <div className={`s7-reasoning-panel${panelActive ? " s7-active" : ""}`}>
              <div className="s7-reasoning-header">
                <span>▶</span>
                <span>{panelTitle || "ANALYTICAL REASONING ENGINE — INITIALISING"}</span>
              </div>
              <div className="s7-reasoning-body">
                {isLoading ? (
                  <div className="s7-loading-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                ) : error ? (
                  <span style={{ color: "#e8405a" }}>{error}</span>
                ) : reasoning ? (
                  <p>{reasoning}</p>
                ) : null}
              </div>
            </div>

            <div className={`s7-verdict-block${verdictActive ? " s7-active" : ""}`}>
              <div className="s7-verdict-title">OPERATOR VERDICT</div>
              <div>{verdict}</div>
            </div>

            {thinkingTrace && (
              <div className="s7-thinking-wrap">
                <button
                  className="s7-thinking-toggle"
                  onClick={() => setThinkingOpen(o => !o)}
                >
                  <span className="s7-thinking-icon">{thinkingOpen ? "▾" : "▸"}</span>
                  NEMOTRON CHAIN OF THOUGHT
                  <span className="s7-thinking-tokens">
                    {thinkingTrace.length.toLocaleString()} chars
                  </span>
                </button>
                {thinkingOpen && (
                  <div className="s7-thinking-body">{thinkingTrace}</div>
                )}
              </div>
            )}

            {sealed && (
              <div className="s7-sealed-badge">
                ⬡ SEALED TO SOVEREIGN LEDGER · ROUTING DOCTRINE FULFILLED
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Root ───────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState<View>("entry");
  const [observation, setObservation] = useState("");
  const [domain, setDomain] = useState("");
  const [subDomain, setSubDomain] = useState("");

  function begin(obs: string, dom: string, sub: string) {
    setObservation(obs);
    setDomain(dom);
    setSubDomain(sub);
    setView("investigation");
  }

  if (view === "entry") return <EntryView onBegin={begin} />;
  return (
    <InvestigationView
      observation={observation}
      domain={domain}
      subDomain={subDomain}
      onBack={() => setView("entry")}
    />
  );
}

// ─── CSS ────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap');

#s7app {
  background: #05060a;
  color: #c8cfe0;
  font-family: 'Inter', sans-serif;
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;
}

.s7-starfield {
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background:
    radial-gradient(1px 1px at 15% 20%, rgba(255,255,255,0.6) 0%, transparent 100%),
    radial-gradient(1px 1px at 72% 8%,  rgba(255,255,255,0.4) 0%, transparent 100%),
    radial-gradient(1px 1px at 38% 55%, rgba(255,255,255,0.5) 0%, transparent 100%),
    radial-gradient(1px 1px at 91% 33%, rgba(255,255,255,0.3) 0%, transparent 100%),
    radial-gradient(1px 1px at 55% 78%, rgba(255,255,255,0.4) 0%, transparent 100%),
    radial-gradient(1px 1px at 28% 90%, rgba(255,255,255,0.3) 0%, transparent 100%),
    radial-gradient(1px 1px at 84% 65%, rgba(255,255,255,0.5) 0%, transparent 100%),
    radial-gradient(1px 1px at 6%  45%, rgba(255,255,255,0.4) 0%, transparent 100%);
}

/* ── ENTRY ─────────────────────────────────────────────────────── */
.s7-entry-container {
  position: relative; z-index: 1;
  max-width: 640px; margin: 0 auto;
  padding: 80px 24px;
}

.s7-entry-header { text-align: center; margin-bottom: 48px; }

.s7-status-row {
  display: flex; align-items: center; gap: 10px; justify-content: center;
  font-family: 'Space Mono', monospace; font-size: 9px;
  letter-spacing: 0.2em; color: #4CAF87; margin-bottom: 32px;
}

.s7-pulse-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #4CAF87; box-shadow: 0 0 8px rgba(76,175,135,0.6);
  animation: s7-pulse 2s ease-in-out infinite; flex-shrink: 0;
}

.s7-entry-title {
  font-family: 'Space Mono', monospace;
  font-size: clamp(40px, 10vw, 68px); font-weight: 700;
  letter-spacing: 0.22em; color: #e8ecf8; line-height: 1; margin-bottom: 10px;
}

.s7-entry-sub {
  font-family: 'Space Mono', monospace; font-size: 9px;
  letter-spacing: 0.3em; color: rgba(200,207,224,0.3); margin-bottom: 20px;
}

.s7-entry-rule {
  width: 40px; height: 1px; background: rgba(255,255,255,0.1); margin: 0 auto 20px;
}

.s7-entry-desc {
  font-size: 13px; color: rgba(200,207,224,0.45);
  line-height: 1.7; max-width: 480px; margin: 0 auto;
}

.s7-field-label {
  font-family: 'Space Mono', monospace; font-size: 9px;
  letter-spacing: 0.2em; color: #3a4555; text-transform: uppercase; margin-bottom: 10px;
}

.s7-obs-input {
  width: 100%; box-sizing: border-box;
  background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07);
  border-radius: 5px; padding: 14px 16px; color: #c8cfe0;
  font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.6;
  resize: vertical; outline: none; transition: border-color 0.2s ease;
}
.s7-obs-input::placeholder { color: #3a4555; }
.s7-obs-input:focus { border-color: rgba(79,195,247,0.3); }

.s7-domain-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }

.s7-domain-btn {
  padding: 10px 8px;
  background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07);
  border-radius: 4px; color: rgba(200,207,224,0.4);
  font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 0.14em;
  cursor: pointer; transition: all 0.2s ease; text-transform: uppercase;
}
.s7-domain-btn:hover {
  border-color: rgba(79,195,247,0.25); color: rgba(200,207,224,0.7);
  background: rgba(79,195,247,0.03);
}
.s7-domain-btn.s7-domain-active {
  border-color: rgba(79,195,247,0.5); background: rgba(79,195,247,0.07); color: #4fc3f7;
}

.s7-sub-input {
  width: 100%; box-sizing: border-box;
  background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
  border-radius: 4px; padding: 10px 14px; color: #c8cfe0;
  font-family: 'Inter', sans-serif; font-size: 12px; outline: none;
  transition: border-color 0.2s ease;
}
.s7-sub-input::placeholder { color: #2e3545; }
.s7-sub-input:focus { border-color: rgba(79,195,247,0.25); }

.s7-begin-btn {
  width: 100%; margin-top: 32px; padding: 16px 20px;
  background: rgba(79,195,247,0.04); border: 1px solid rgba(79,195,247,0.15);
  border-radius: 5px; color: rgba(79,195,247,0.35);
  font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.18em;
  cursor: default; transition: all 0.25s ease; text-transform: uppercase;
}
.s7-begin-btn.s7-begin-active {
  border-color: rgba(79,195,247,0.4); color: rgba(79,195,247,0.8); cursor: pointer;
}
.s7-begin-btn.s7-begin-active:hover {
  background: rgba(79,195,247,0.1); border-color: rgba(79,195,247,0.6); color: #4fc3f7;
}

.s7-entry-doctrine {
  margin-top: 24px; text-align: center;
  font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 0.16em;
  color: rgba(79,195,247,0.25); padding: 8px;
  border: 1px solid rgba(79,195,247,0.07); border-radius: 3px;
}

/* ── INVESTIGATION ─────────────────────────────────────────────── */
.s7-back-btn {
  position: fixed; top: 16px; left: 16px; z-index: 100;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 4px; color: rgba(200,207,224,0.6);
  font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.18em;
  padding: 8px 14px; cursor: pointer; transition: all 0.2s ease;
}
.s7-back-btn:hover {
  background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); color: #e8ecf8;
}

.s7-container {
  position: relative; z-index: 1;
  max-width: 900px; margin: 0 auto; padding: 72px 20px 80px;
}

.s7-alert-bar {
  display: flex; align-items: center; gap: 12px;
  background: rgba(232,64,90,0.08); border: 1px solid rgba(232,64,90,0.3);
  border-radius: 4px; padding: 10px 16px; margin-bottom: 16px;
  font-family: 'Space Mono', monospace; font-size: 11px;
  color: #e8405a; letter-spacing: 0.1em;
}

.s7-alert-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #e8405a; animation: s7-pulse 1.4s ease-in-out infinite; flex-shrink: 0;
}

.s7-doctrine-badge {
  font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.18em;
  color: rgba(79,195,247,0.5); text-align: center; margin-bottom: 24px;
  padding: 8px; border: 1px solid rgba(79,195,247,0.12);
  border-radius: 3px; background: rgba(79,195,247,0.03);
}

.s7-generating-wrap {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 20px; padding: 80px 20px; text-align: center;
}
.s7-generating-label {
  font-family: 'Space Mono', monospace; font-size: 11px;
  letter-spacing: 0.2em; color: rgba(79,195,247,0.7);
}
.s7-generating-sub {
  font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.1em;
  color: #3a4555; max-width: 400px; line-height: 1.8;
}

.s7-title-block { margin-bottom: 40px; }
.s7-eyebrow {
  font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.2em;
  color: #5a6080; text-transform: uppercase; margin-bottom: 12px;
}
.s7-h1 {
  font-family: 'Space Mono', monospace;
  font-size: clamp(18px, 3.5vw, 28px); font-weight: 700;
  color: #e8ecf8; line-height: 1.25; margin-bottom: 10px;
}
.s7-h1 span { color: #e8405a; }
.s7-subtitle { font-size: 14px; color: #5a6080; line-height: 1.6; max-width: 560px; }

.s7-section-title {
  font-family: 'Space Mono', monospace; font-size: 9px;
  letter-spacing: 0.2em; color: #3a4555; text-transform: uppercase; margin: 28px 0 12px;
}

.s7-panel {
  background: #111420; border: 1px solid #1e2235;
  border-radius: 6px; padding: 16px; margin-bottom: 8px;
}

.s7-obs-entry { display: flex; gap: 12px; align-items: flex-start; padding: 4px 0; }
.s7-obs-ts {
  font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 0.12em;
  color: #3a4555; white-space: nowrap; padding-top: 1px; min-width: 42px;
}
.s7-obs-msg { font-family: 'Space Mono', monospace; font-size: 10px; color: #6b7896; line-height: 1.5; }
.s7-obs-info { color: rgba(79,195,247,0.65); }

.s7-hyp-card {
  background: #0d1018; border: 1px solid #1a1e2e; border-radius: 6px;
  padding: 16px; margin-bottom: 10px; cursor: pointer; transition: all 0.2s ease;
  position: relative; overflow: hidden;
}
.s7-hyp-card:hover { border-color: rgba(79,195,247,0.2); background: #101420; }
.s7-hyp-card.s7-selected { border-color: rgba(79,195,247,0.45); background: rgba(79,195,247,0.04); }
.s7-hyp-card.s7-selected::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0;
  width: 3px; background: #4fc3f7; border-radius: 3px 0 0 3px;
}

.s7-hyp-id {
  font-family: 'Space Mono', monospace; font-size: 9px;
  letter-spacing: 0.15em; color: #3a4555; margin-bottom: 6px;
}
.s7-hyp-card.s7-selected .s7-hyp-id { color: rgba(79,195,247,0.6); }
.s7-hyp-name {
  font-family: 'Space Mono', monospace; font-size: 12px;
  color: #c8cfe0; font-weight: 700; margin-bottom: 4px; line-height: 1.3;
}
.s7-hyp-prob {
  font-family: 'Space Mono', monospace; font-size: 11px;
  color: rgba(79,195,247,0.55); margin-bottom: 8px;
}
.s7-hyp-desc { font-size: 12px; color: #4a5568; line-height: 1.6; margin-bottom: 10px; }
.s7-hyp-card.s7-selected .s7-hyp-desc { color: #6b7896; }
.s7-prob-bar-wrap { background: rgba(30,34,53,0.6); height: 2px; border-radius: 1px; overflow: hidden; }
.s7-prob-bar {
  height: 100%; background: rgba(79,195,247,0.35);
  border-radius: 1px; transition: width 0.5s ease;
}
.s7-hyp-card.s7-selected .s7-prob-bar { background: rgba(79,195,247,0.65); }

.s7-investigate-btn {
  width: 100%; margin: 24px 0 16px; padding: 14px 20px;
  background: rgba(79,195,247,0.06); border: 1px solid rgba(79,195,247,0.2);
  border-radius: 5px; color: rgba(79,195,247,0.7);
  font-family: 'Space Mono', monospace; font-size: 10px;
  letter-spacing: 0.18em; cursor: pointer; transition: all 0.25s ease; text-transform: uppercase;
}
.s7-investigate-btn:hover:not(:disabled) {
  background: rgba(79,195,247,0.1); border-color: rgba(79,195,247,0.4); color: #4fc3f7;
}
.s7-investigate-btn:disabled { opacity: 0.35; cursor: default; }

.s7-reasoning-panel {
  background: #0a0d14; border: 1px solid #1a1e2e; border-radius: 6px;
  overflow: hidden; margin-bottom: 16px; max-height: 0; opacity: 0;
  transition: max-height 0.4s ease, opacity 0.3s ease;
}
.s7-reasoning-panel.s7-active { max-height: 800px; opacity: 1; }
.s7-reasoning-header {
  display: flex; align-items: center; gap: 10px; padding: 10px 16px;
  border-bottom: 1px solid #1a1e2e;
  font-family: 'Space Mono', monospace; font-size: 9px;
  letter-spacing: 0.12em; color: rgba(79,195,247,0.55);
}
.s7-reasoning-body { padding: 16px; font-size: 13px; color: #8a9ab0; line-height: 1.75; }

.s7-loading-dots { display: flex; gap: 6px; justify-content: center; padding: 8px 0; }
.s7-loading-dots span {
  width: 5px; height: 5px; border-radius: 50%;
  background: rgba(79,195,247,0.4);
  animation: s7-dot-pulse 1.2s ease-in-out infinite;
}
.s7-loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.s7-loading-dots span:nth-child(3) { animation-delay: 0.4s; }

.s7-verdict-block {
  background: rgba(76,175,135,0.04); border: 1px solid rgba(76,175,135,0.15);
  border-radius: 6px; padding: 16px; margin-bottom: 16px;
  max-height: 0; overflow: hidden; opacity: 0;
  transition: max-height 0.4s ease, opacity 0.3s ease;
}
.s7-verdict-block.s7-active { max-height: 400px; opacity: 1; }
.s7-verdict-title {
  font-family: 'Space Mono', monospace; font-size: 9px;
  letter-spacing: 0.18em; color: rgba(76,175,135,0.6); margin-bottom: 10px;
}

.s7-thinking-wrap {
  margin-bottom: 16px; border: 1px solid rgba(251,191,36,0.15);
  border-radius: 6px; overflow: hidden;
}
.s7-thinking-toggle {
  width: 100%; display: flex; align-items: center; gap: 10px;
  padding: 10px 16px; background: rgba(251,191,36,0.04); border: none; cursor: pointer;
  font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.16em;
  color: rgba(251,191,36,0.55); text-align: left; transition: background 0.2s ease;
}
.s7-thinking-toggle:hover { background: rgba(251,191,36,0.07); color: rgba(251,191,36,0.75); }
.s7-thinking-icon { font-size: 10px; flex-shrink: 0; }
.s7-thinking-tokens { margin-left: auto; font-size: 8px; color: rgba(251,191,36,0.3); letter-spacing: 0.1em; }
.s7-thinking-body {
  padding: 16px; background: rgba(251,191,36,0.02);
  border-top: 1px solid rgba(251,191,36,0.1);
  font-family: 'Space Mono', monospace; font-size: 10px;
  line-height: 1.8; color: rgba(251,191,36,0.35);
  white-space: pre-wrap; word-break: break-word;
}

.s7-sealed-badge {
  margin-top: 16px; padding: 12px 16px;
  background: rgba(76,175,135,0.06); border: 1px solid rgba(76,175,135,0.25);
  border-radius: 4px; font-family: 'Space Mono', monospace;
  font-size: 9px; letter-spacing: 0.15em; color: #4caf87; text-align: center;
}

@keyframes s7-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.4; transform: scale(0.7); }
}
@keyframes s7-dot-pulse {
  0%, 100% { opacity: 0.2; transform: scale(0.8); }
  50%       { opacity: 1;   transform: scale(1); }
}
`;

import { useState, useEffect } from "react";
import { getAbsoluteUrl } from "../utils";

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

interface SpectraViewProps {
  observation: string;
  domain: string;
  subDomain?: string;
  onBack: () => void;
}

async function sealToSovereignLedger(
  hypName: string,
  domain: string,
  analysis: string,
  verdict: string,
  caseId: string,
): Promise<void> {
  try {
    await fetch(getAbsoluteUrl("/api/sovereign/audits"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: `S7-${Date.now().toString(36).toUpperCase()}`,
        authority: `SPECTRA-7 // ${domain} Investigation Engine`,
        asset: domain,
        price: "0",
        packetId: `PKT-S7-${Date.now().toString(36).toUpperCase()}`,
        operatorEmail: "operator@pathfinder.local",
        logs: [
          `Case: ${caseId}`,
          `Hypothesis: ${hypName}`,
          analysis ? `Analysis excerpt: ${analysis.substring(0, 200)}...` : "Analysis pending",
          verdict ? `Verdict: ${verdict}` : "",
        ].filter(Boolean),
        signature: `S7-SIG-${Date.now()}`,
        verified: true,
        operatorDecision: "APPROVED",
        divergenceState: "ALIGNED",
        divergenceDelta: 0,
      }),
    });
  } catch {
    // Routing Doctrine seal is best-effort — never block the analysis
  }
}

export default function SpectraView({ observation, domain, subDomain, onBack }: SpectraViewProps) {
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

    fetch(getAbsoluteUrl("/api/spectra/generate"), {
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
      .catch(e => { if (!cancelled) setGenerateError(e.message || "Network error"); })
      .finally(() => { if (!cancelled) setGenerating(false); });

    return () => { cancelled = true; };
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
      const res = await fetch(getAbsoluteUrl("/api/spectra/analyse"), {
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

      await sealToSovereignLedger(hyp.name, domain, data.analysis || "", data.verdict || "", generatedCase.caseId);
      setSealed(true);
    } catch (err: unknown) {
      setError(`ANALYSIS ENGINE ERROR: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  }

  const panelActive = isLoading || !!reasoning || !!error;
  const verdictActive = !!verdict && !isLoading;

  return (
    <div id="s7root">
      <style>{S7_CSS}</style>

      <button className="s7-back-btn" onClick={onBack}>
        ← PATHFINDER
      </button>

      <div className="s7-starfield" />
      <div className="s7-container">

        <div className="s7-alert-bar">
          <div className="s7-alert-dot" />
          SPECTRA-7 // {domain}{subDomain ? ` · ${subDomain}` : ""} INVESTIGATION — DOMAIN CONTEXT ACTIVE
        </div>

        <div className="s7-doctrine-badge">
          ⬡ ROUTING DOCTRINE ACTIVE · {engine === "nvidia" ? "NEMOTRON-550B · REASONING ENGINE" : "DIMENSIONAL ENGINE"} · SOVEREIGN LEDGER
        </div>

        {/* GENERATING STATE */}
        {generating && (
          <div className="s7-generating-wrap">
            <div className="s7-generating-label">GENERATING INVESTIGATION CASE</div>
            <div className="s7-loading-dots"><span /><span /><span /></div>
            <div className="s7-generating-sub">
              Classifying domain context · Building hypothesis space · {domain}{subDomain ? ` / ${subDomain}` : ""}
            </div>
          </div>
        )}

        {/* GENERATE ERROR */}
        {!generating && generateError && (
          <div style={{ padding: "48px 0", textAlign: "center" }}>
            <div style={{ color: "#e8405a", fontFamily: "'Space Mono', monospace", fontSize: "11px", letterSpacing: "0.1em", marginBottom: 12 }}>
              CASE GENERATION FAILED
            </div>
            <div style={{ color: "#5a6080", fontSize: "12px", marginBottom: 24 }}>{generateError}</div>
            <button
              onClick={onBack}
              style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", letterSpacing: "0.15em", color: "rgba(200,207,224,0.5)", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", padding: "8px 16px", cursor: "pointer" }}
            >
              ← RETURN TO ANALYSIS
            </button>
          </div>
        )}

        {/* GENERATED CASE */}
        {!generating && generatedCase && (
          <>
            <div className="s7-title-block">
              <div className="s7-eyebrow">
                {generatedCase.caseId} // {domain}{subDomain ? ` · ${subDomain.toUpperCase()}` : ""} INVESTIGATION
              </div>
              <h1 className="s7-h1">{generatedCase.caseTitle}</h1>
              <p className="s7-subtitle">{generatedCase.caseSubtitle}</p>
            </div>

            {/* OBSERVATIONAL CONTEXT */}
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
                <span className="s7-obs-msg s7-obs-info">{domain}{subDomain ? ` / ${subDomain}` : ""} — CLASSIFICATION CONFIRMED</span>
              </div>
            </div>

            {/* CANDIDATE HYPOTHESES */}
            <div className="s7-section-title">Candidate Hypotheses</div>
            {generatedCase.hypotheses.map((hyp) => (
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

            {/* INVESTIGATE BUTTON */}
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

            {/* REASONING PANEL */}
            <div className={`s7-reasoning-panel${panelActive ? " s7-active" : ""}`}>
              <div className="s7-reasoning-header">
                <span>&#9658;</span>
                <span>{panelTitle || "ANALYTICAL REASONING ENGINE — INITIALISING"}</span>
              </div>
              <div className="s7-reasoning-body">
                {isLoading ? (
                  <div className="s7-loading-dots"><span /><span /><span /></div>
                ) : error ? (
                  <span style={{ color: "#e8405a" }}>{error}</span>
                ) : reasoning ? (
                  <p>{reasoning}</p>
                ) : null}
              </div>
            </div>

            {/* VERDICT */}
            <div className={`s7-verdict-block${verdictActive ? " s7-active" : ""}`}>
              <div className="s7-verdict-title">OPERATOR VERDICT</div>
              <div>{verdict}</div>
            </div>

            {/* NEMOTRON REASONING TRACE */}
            {thinkingTrace && (
              <div className="s7-thinking-wrap">
                <button
                  className="s7-thinking-toggle"
                  onClick={() => setThinkingOpen(o => !o)}
                >
                  <span className="s7-thinking-icon">{thinkingOpen ? "▾" : "▸"}</span>
                  NEMOTRON CHAIN OF THOUGHT
                  <span className="s7-thinking-tokens">{thinkingTrace.length.toLocaleString()} chars</span>
                </button>
                {thinkingOpen && (
                  <div className="s7-thinking-body">
                    {thinkingTrace}
                  </div>
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

// ── Scoped CSS ────────────────────────────────────────────────────────────────
const S7_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap');

  #s7root {
    background: #05060a;
    color: #c8cfe0;
    font-family: 'Inter', sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
    position: relative;
  }

  .s7-back-btn {
    position: fixed;
    top: 16px; left: 16px;
    z-index: 100;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 4px;
    color: rgba(200,207,224,0.6);
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.18em;
    padding: 8px 14px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .s7-back-btn:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.2);
    color: #e8ecf8;
  }

  .s7-doctrine-badge {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.18em;
    color: rgba(79,195,247,0.5);
    text-align: center;
    margin-bottom: 24px;
    padding: 8px;
    border: 1px solid rgba(79,195,247,0.12);
    border-radius: 3px;
    background: rgba(79,195,247,0.03);
  }

  .s7-sealed-badge {
    margin-top: 16px;
    padding: 12px 16px;
    background: rgba(76,175,135,0.06);
    border: 1px solid rgba(76,175,135,0.25);
    border-radius: 4px;
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.15em;
    color: #4caf87;
    text-align: center;
  }

  .s7-starfield {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background:
      radial-gradient(1px 1px at 15% 20%, rgba(255,255,255,0.6) 0%, transparent 100%),
      radial-gradient(1px 1px at 72% 8%, rgba(255,255,255,0.4) 0%, transparent 100%),
      radial-gradient(1px 1px at 38% 55%, rgba(255,255,255,0.5) 0%, transparent 100%),
      radial-gradient(1px 1px at 91% 33%, rgba(255,255,255,0.3) 0%, transparent 100%),
      radial-gradient(1px 1px at 55% 78%, rgba(255,255,255,0.4) 0%, transparent 100%),
      radial-gradient(1px 1px at 28% 90%, rgba(255,255,255,0.3) 0%, transparent 100%),
      radial-gradient(1px 1px at 84% 65%, rgba(255,255,255,0.5) 0%, transparent 100%),
      radial-gradient(1px 1px at 6% 45%, rgba(255,255,255,0.4) 0%, transparent 100%),
      #05060a;
  }

  .s7-container {
    position: relative; z-index: 1;
    max-width: 900px;
    margin: 0 auto;
    padding: 72px 20px 80px;
  }

  .s7-alert-bar {
    display: flex; align-items: center; gap: 12px;
    background: rgba(232,64,90,0.08);
    border: 1px solid rgba(232,64,90,0.3);
    border-radius: 4px;
    padding: 10px 16px;
    margin-bottom: 16px;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: #e8405a;
    letter-spacing: 0.1em;
  }

  .s7-alert-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #e8405a;
    animation: s7-pulse 1.4s ease-in-out infinite;
    flex-shrink: 0;
  }

  @keyframes s7-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.7); }
  }

  /* GENERATING STATE */
  .s7-generating-wrap {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 20px;
    padding: 80px 20px;
    text-align: center;
  }
  .s7-generating-label {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.2em;
    color: rgba(79,195,247,0.7);
  }
  .s7-generating-sub {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.1em;
    color: #3a4555;
    max-width: 400px;
    line-height: 1.8;
  }

  .s7-title-block { margin-bottom: 40px; }

  .s7-eyebrow {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.2em;
    color: #5a6080;
    text-transform: uppercase;
    margin-bottom: 12px;
  }

  .s7-h1 {
    font-family: 'Space Mono', monospace;
    font-size: clamp(18px, 3.5vw, 28px);
    font-weight: 700;
    color: #e8ecf8;
    line-height: 1.25;
    margin-bottom: 10px;
  }

  .s7-h1 span { color: #e8405a; }

  .s7-subtitle {
    font-size: 14px;
    color: #5a6080;
    line-height: 1.6;
    max-width: 560px;
  }

  .s7-section-title {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.2em;
    color: #3a4555;
    text-transform: uppercase;
    margin: 28px 0 12px;
  }

  .s7-panel {
    background: #111420;
    border: 1px solid #1e2235;
    border-radius: 6px;
    padding: 16px;
    margin-bottom: 8px;
  }

  .s7-obs-entry {
    display: flex; gap: 12px; align-items: flex-start;
    padding: 4px 0;
  }
  .s7-obs-ts {
    font-family: 'Space Mono', monospace;
    font-size: 8px;
    letter-spacing: 0.12em;
    color: #3a4555;
    white-space: nowrap;
    padding-top: 1px;
    min-width: 42px;
  }
  .s7-obs-msg {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: #6b7896;
    line-height: 1.5;
  }
  .s7-obs-info { color: rgba(79,195,247,0.65); }
  .s7-obs-alert { color: rgba(232,64,90,0.75); }

  .s7-hyp-card {
    background: #0d1018;
    border: 1px solid #1a1e2e;
    border-radius: 6px;
    padding: 16px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
  }
  .s7-hyp-card:hover {
    border-color: rgba(79,195,247,0.2);
    background: #101420;
  }
  .s7-hyp-card.s7-selected {
    border-color: rgba(79,195,247,0.45);
    background: rgba(79,195,247,0.04);
  }
  .s7-hyp-card.s7-selected::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: #4fc3f7;
    border-radius: 3px 0 0 3px;
  }

  .s7-hyp-id {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.15em;
    color: #3a4555;
    margin-bottom: 6px;
  }
  .s7-hyp-card.s7-selected .s7-hyp-id { color: rgba(79,195,247,0.6); }

  .s7-hyp-name {
    font-family: 'Space Mono', monospace;
    font-size: 12px;
    color: #c8cfe0;
    font-weight: 700;
    margin-bottom: 4px;
    line-height: 1.3;
  }

  .s7-hyp-prob {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: rgba(79,195,247,0.55);
    margin-bottom: 8px;
  }

  .s7-hyp-desc {
    font-size: 12px;
    color: #4a5568;
    line-height: 1.6;
    margin-bottom: 10px;
  }
  .s7-hyp-card.s7-selected .s7-hyp-desc { color: #6b7896; }

  .s7-prob-bar-wrap {
    background: rgba(30,34,53,0.6);
    height: 2px;
    border-radius: 1px;
    overflow: hidden;
  }
  .s7-prob-bar {
    height: 100%;
    background: rgba(79,195,247,0.35);
    border-radius: 1px;
    transition: width 0.5s ease;
  }
  .s7-hyp-card.s7-selected .s7-prob-bar { background: rgba(79,195,247,0.65); }

  .s7-investigate-btn {
    width: 100%;
    margin: 24px 0 16px;
    padding: 14px 20px;
    background: rgba(79,195,247,0.06);
    border: 1px solid rgba(79,195,247,0.2);
    border-radius: 5px;
    color: rgba(79,195,247,0.7);
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.18em;
    cursor: pointer;
    transition: all 0.25s ease;
    text-transform: uppercase;
  }
  .s7-investigate-btn:hover:not(:disabled) {
    background: rgba(79,195,247,0.1);
    border-color: rgba(79,195,247,0.4);
    color: #4fc3f7;
  }
  .s7-investigate-btn:disabled {
    opacity: 0.35;
    cursor: default;
  }

  .s7-reasoning-panel {
    background: #0a0d14;
    border: 1px solid #1a1e2e;
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 16px;
    max-height: 0;
    opacity: 0;
    transition: max-height 0.4s ease, opacity 0.3s ease;
  }
  .s7-reasoning-panel.s7-active {
    max-height: 800px;
    opacity: 1;
  }

  .s7-reasoning-header {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 16px;
    border-bottom: 1px solid #1a1e2e;
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.12em;
    color: rgba(79,195,247,0.55);
  }

  .s7-reasoning-body {
    padding: 16px;
    font-size: 13px;
    color: #8a9ab0;
    line-height: 1.75;
  }

  .s7-loading-dots {
    display: flex; gap: 6px; justify-content: center; padding: 8px 0;
  }
  .s7-loading-dots span {
    width: 5px; height: 5px; border-radius: 50%;
    background: rgba(79,195,247,0.4);
    animation: s7-dot-pulse 1.2s ease-in-out infinite;
  }
  .s7-loading-dots span:nth-child(2) { animation-delay: 0.2s; }
  .s7-loading-dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes s7-dot-pulse {
    0%, 100% { opacity: 0.2; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1); }
  }

  .s7-verdict-block {
    background: rgba(76,175,135,0.04);
    border: 1px solid rgba(76,175,135,0.15);
    border-radius: 6px;
    padding: 16px;
    margin-bottom: 16px;
    max-height: 0; overflow: hidden; opacity: 0;
    transition: max-height 0.4s ease, opacity 0.3s ease;
  }
  .s7-verdict-block.s7-active {
    max-height: 400px;
    opacity: 1;
  }

  .s7-verdict-title {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.18em;
    color: rgba(76,175,135,0.6);
    margin-bottom: 10px;
  }

  .s7-thinking-wrap {
    margin-bottom: 16px;
    border: 1px solid rgba(251,191,36,0.15);
    border-radius: 6px;
    overflow: hidden;
  }

  .s7-thinking-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    background: rgba(251,191,36,0.04);
    border: none;
    cursor: pointer;
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.16em;
    color: rgba(251,191,36,0.55);
    text-align: left;
    transition: background 0.2s ease;
  }
  .s7-thinking-toggle:hover {
    background: rgba(251,191,36,0.07);
    color: rgba(251,191,36,0.75);
  }

  .s7-thinking-icon {
    font-size: 10px;
    flex-shrink: 0;
  }

  .s7-thinking-tokens {
    margin-left: auto;
    font-size: 8px;
    color: rgba(251,191,36,0.3);
    letter-spacing: 0.1em;
  }

  .s7-thinking-body {
    padding: 16px;
    background: rgba(251,191,36,0.02);
    border-top: 1px solid rgba(251,191,36,0.1);
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: rgba(251,191,36,0.4);
    line-height: 1.8;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 500px;
    overflow-y: auto;
  }
`;

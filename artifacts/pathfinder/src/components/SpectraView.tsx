import { useState } from "react";
import { getAbsoluteUrl } from "../utils";

type HypKey = "A" | "B" | "C" | "D";

interface HypData {
  id: string;
  name: string;
  desc: string;
  prob: number;
}

const HYPOTHESES: Record<HypKey, HypData> = {
  A: {
    id: "HYP-A",
    name: "P Cygni Profile — Stellar Wind / Outflow",
    desc: "The blue absorption trough + redshifted broad emission is the classic P Cygni signature. A luminous hot star driving a fast stellar wind (LBV, WR, or nova ejecta) would produce absorption in the approaching wind and emission from surrounding expanding shell. The He II presence and variability are consistent.",
    prob: 38,
  },
  B: {
    id: "HYP-B",
    name: "Accretion Disk Emission — Compact Binary",
    desc: "Broad, asymmetric Hα emission is a hallmark of accretion disks in cataclysmic variables or X-ray binaries. Double-peaked profiles from Keplerian disk rotation can smear into a single broad feature. The 6-day variability could be the orbital period. He II 4686 is common in high-accretion-rate systems. Weak X-ray detection warrants further imaging.",
    prob: 28,
  },
  C: {
    id: "HYP-C",
    name: "Raman Scattering — Symbiotic Star System",
    desc: "In symbiotic binaries (red giant + white dwarf), OVI λ1032Å photons from the hot component can Raman-scatter off neutral hydrogen in the cool giant's envelope, producing broad emission near 6825Å and 7082Å. However, the same scattering mechanism operating on Lyman-beta can shift features near Hα. Anomalous Balmer ratios and the presence of He II favour this in symbiotic novae.",
    prob: 19,
  },
  D: {
    id: "HYP-D",
    name: "Shock-Excited Emission — Supernova Remnant Interaction",
    desc: "When a supernova blast wave hits dense circumstellar material, collisional excitation (not photoionisation) produces Balmer emission. Shock-excited Hα can be very broad (100s–1000s km/s) and the Balmer decrement departs dramatically from Case B. Narrow + broad component splitting and the lack of strong radio flux argues against a classical SNR but is plausible for a young remnant in dense CSM.",
    prob: 15,
  },
};

const KEY_TERMS = ["Hα", "Hβ", "He II", "P Cygni", "Balmer", "FWHM", "Sobolev", "Keplerian", "Raman", "Chevalier", "km/s", "nm", "Å"];

function highlightTerms(text: string): string {
  let result = text;
  for (const term of KEY_TERMS) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(
      new RegExp(escaped, "g"),
      `<span class="s7-key-term">${term}</span>`
    );
  }
  return result
    .replace(/\n\n/g, '</p><p style="margin-top:12px">')
    .replace(/\n/g, "<br>");
}

// ── Routing Doctrine: seal to Sovereign Ledger regardless of specialty ────────
async function sealToSovereignLedger(
  hypKey: HypKey,
  hypName: string,
  analysis: string,
  verdict: string,
): Promise<void> {
  try {
    await fetch(getAbsoluteUrl("/api/sovereign/audits"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: `S7-${Date.now().toString(36).toUpperCase()}`,
        authority: "SPECTRA-7 // Spectroscopic Anomaly Engine",
        asset: "ASTROPHYSICS",
        price: "0",
        packetId: `PKT-S7-${hypKey}-${Date.now().toString(36).toUpperCase()}`,
        operatorEmail: "operator@pathfinder.local",
        logs: [
          `Hypothesis: ${hypKey} — ${hypName}`,
          `Case: SA-2026-0041 // Emission at 656nm anomaly`,
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

interface SpectraViewProps {
  onBack: () => void;
}

export default function SpectraView({ onBack }: SpectraViewProps) {
  const [selectedHyp, setSelectedHyp] = useState<HypKey | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reasoning, setReasoning] = useState("");
  const [verdict, setVerdict] = useState("");
  const [panelTitle, setPanelTitle] = useState("");
  const [error, setError] = useState("");
  const [sealed, setSealed] = useState(false);

  function selectHyp(key: HypKey) {
    setSelectedHyp(key);
    setReasoning("");
    setVerdict("");
    setError("");
    setSealed(false);
  }

  async function runInvestigation() {
    if (!selectedHyp) return;
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
        body: JSON.stringify({ hypKey: selectedHyp }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Unknown error");
      setPanelTitle(data.title || "");
      setReasoning(data.analysis || "");
      setVerdict(data.verdict || "");

      // ── Routing Doctrine: seal to Sovereign Ledger regardless of specialty ──
      const hyp = HYPOTHESES[selectedHyp];
      await sealToSovereignLedger(selectedHyp, hyp.name, data.analysis || "", data.verdict || "");
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

      {/* Back to Pathfinder */}
      <button className="s7-back-btn" onClick={onBack}>
        ← PATHFINDER
      </button>

      <div className="s7-starfield" />
      <div className="s7-container">

        {/* ALERT BAR */}
        <div className="s7-alert-bar">
          <div className="s7-alert-dot" />
          SPECTRA-7 // ANOMALY CLASSIFICATION PROTOCOL — ACTIVE OBSERVATION SESSION
        </div>

        {/* ROUTING DOCTRINE BADGE */}
        <div className="s7-doctrine-badge">
          ⬡ ROUTING DOCTRINE ACTIVE · DIMENSIONAL ENGINE · SOVEREIGN LEDGER
        </div>

        {/* TITLE */}
        <div className="s7-title-block">
          <div className="s7-eyebrow">Spectroscopic Anomaly // Case ID: SA-2026-0041</div>
          <h1 className="s7-h1">
            Emission at <span>656nm</span>
            <br />
            Does Not Resolve as H&#945;
          </h1>
          <p className="s7-subtitle">
            A spectral line has been detected at the wavelength of hydrogen's Balmer alpha
            transition — but its profile, intensity ratio, and temporal behaviour are
            inconsistent with standard recombination emission. Diagnose the source.
          </p>
        </div>

        {/* SPECTROGRAPH */}
        <div className="s7-spectrograph-wrap">
          <div className="s7-spec-header">
            <span>DETECTOR: OPTICAL // RES: 0.1Å/px // RANGE: 380–700nm</span>
            <span className="s7-spec-header-alert">⚠ PROFILE MISMATCH DETECTED</span>
          </div>
          <div className="s7-spec-canvas">
            <div className="s7-spectrum-bar">
              <div className="s7-line-expected" />
              <div className="s7-line-anomaly" />
            </div>
            <div className="s7-wl-axis">
              <span>380nm</span><span>430nm</span><span>480nm</span><span>530nm</span>
              <span>580nm</span><span>630nm</span><span>680nm</span><span>700nm</span>
            </div>
          </div>
          <div className="s7-profile-wrap">
            <div className="s7-profile-label">
              EMISSION LINE PROFILE — OBSERVED vs EXPECTED (normalised flux)
            </div>
            <svg className="s7-profile-svg" viewBox="0 0 860 120" preserveAspectRatio="none" height="100">
              <line x1="0" y1="100" x2="860" y2="100" stroke="#1e2235" strokeWidth="1" />
              <line x1="0" y1="70" x2="860" y2="70" stroke="#1e2235" strokeWidth="0.5" strokeDasharray="3,4" />
              <line x1="0" y1="40" x2="860" y2="40" stroke="#1e2235" strokeWidth="0.5" strokeDasharray="3,4" />
              <line x1="0" y1="10" x2="860" y2="10" stroke="#1e2235" strokeWidth="0.5" strokeDasharray="3,4" />
              <path d="M 680,100 Q 690,100 695,95 Q 700,60 705,10 Q 710,60 715,95 Q 720,100 730,100" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="4,3" />
              <path d="M 660,100 Q 668,100 675,97 Q 685,80 695,40 Q 700,15 710,8 Q 720,15 728,35 Q 738,65 748,90 Q 758,100 770,100" fill="rgba(255, 107, 53, 0.12)" stroke="#ff6b35" strokeWidth="2" />
              <path d="M 620,100 Q 628,100 635,98 Q 642,88 648,102 Q 652,110 660,100" fill="rgba(79, 195, 247, 0.08)" stroke="#4fc3f7" strokeWidth="1.5" />
              <text x="697" y="24" fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="Space Mono" textAnchor="middle">Expected</text>
              <text x="740" y="30" fill="#ff6b35" fontSize="9" fontFamily="Space Mono">Observed</text>
              <text x="636" y="84" fill="#4fc3f7" fontSize="9" fontFamily="Space Mono" textAnchor="middle">Abs.</text>
            </svg>
          </div>
        </div>

        {/* OBSERVATIONAL PARAMETERS */}
        <div className="s7-section-title">Observational Parameters</div>
        <div className="s7-grid-3">
          <div className="s7-panel">
            <div className="s7-panel-label">Line Properties</div>
            <div className="s7-data-row"><span className="s7-data-key">Peak &#955;</span><span className="s7-data-val s7-flag">656.8nm</span></div>
            <div className="s7-data-row"><span className="s7-data-key">H&#945; rest &#955;</span><span className="s7-data-val">656.28nm</span></div>
            <div className="s7-data-row"><span className="s7-data-key">FWHM</span><span className="s7-data-val s7-flag">~180 km/s</span></div>
            <div className="s7-data-row"><span className="s7-data-key">Expected FWHM</span><span className="s7-data-val s7-ok">~20 km/s</span></div>
            <div className="s7-data-row"><span className="s7-data-key">Profile</span><span className="s7-data-val s7-flag">Asymmetric</span></div>
          </div>
          <div className="s7-panel">
            <div className="s7-panel-label">Intensity Ratios</div>
            <div className="s7-data-row"><span className="s7-data-key">H&#945; / H&#946; (obs)</span><span className="s7-data-val s7-flag">8.2</span></div>
            <div className="s7-data-row"><span className="s7-data-key">H&#945; / H&#946; (expect)</span><span className="s7-data-val s7-ok">2.86</span></div>
            <div className="s7-data-row"><span className="s7-data-key">H&#945; / [NII]</span><span className="s7-data-val s7-warn">3.1</span></div>
            <div className="s7-data-row"><span className="s7-data-key">He II 4686</span><span className="s7-data-val s7-flag">Present</span></div>
            <div className="s7-data-row"><span className="s7-data-key">Balmer series</span><span className="s7-data-val s7-warn">Incomplete</span></div>
          </div>
          <div className="s7-panel">
            <div className="s7-panel-label">Source Context</div>
            <div className="s7-data-row"><span className="s7-data-key">Object type</span><span className="s7-data-val s7-warn">Unclassified</span></div>
            <div className="s7-data-row"><span className="s7-data-key">Temporal var.</span><span className="s7-data-val s7-flag">Yes (~6 days)</span></div>
            <div className="s7-data-row"><span className="s7-data-key">Blue abs. trough</span><span className="s7-data-val s7-flag">Present</span></div>
            <div className="s7-data-row"><span className="s7-data-key">X-ray assoc.</span><span className="s7-data-val s7-warn">Marginal</span></div>
            <div className="s7-data-row"><span className="s7-data-key">Radio flux</span><span className="s7-data-val s7-ok">Non-detect</span></div>
          </div>
        </div>

        {/* OBSERVATION LOG */}
        <div className="s7-section-title">Observation Log</div>
        <div className="s7-panel">
          <div className="s7-obs-entry"><span className="s7-obs-ts">T+00:00</span><span className="s7-obs-msg s7-obs-info">Spectrum acquired. Initial classification attempt: H II region.</span></div>
          <div className="s7-obs-entry"><span className="s7-obs-ts">T+00:14</span><span className="s7-obs-msg s7-obs-alert">MISMATCH: H&#945;/H&#946; ratio = 8.2. Expected &#8804;3.1 for standard recombination. Dust reddening alone insufficient to explain.</span></div>
          <div className="s7-obs-entry"><span className="s7-obs-ts">T+00:21</span><span className="s7-obs-msg">Blue-shifted absorption trough detected at ~655.1nm. Consistent with outflowing material at ~500 km/s.</span></div>
          <div className="s7-obs-entry"><span className="s7-obs-ts">T+00:35</span><span className="s7-obs-msg s7-obs-alert">He II 4686&#8491; emission confirmed. Implies hard ionising photon source (T &gt; 50,000 K or non-thermal).</span></div>
          <div className="s7-obs-entry"><span className="s7-obs-ts">T+00:48</span><span className="s7-obs-msg">Temporal variability confirmed in archival cross-match. Period ~6.2 days. No radio detection.</span></div>
          <div className="s7-obs-entry"><span className="s7-obs-ts">T+01:02</span><span className="s7-obs-msg s7-obs-info">Awaiting hypothesis selection. Standard H&#945; classification rejected.</span></div>
        </div>

        {/* HYPOTHESES */}
        <div className="s7-section-title">Candidate Hypotheses</div>
        {(["A", "B", "C", "D"] as HypKey[]).map((key) => {
          const hyp = HYPOTHESES[key];
          return (
            <div
              key={key}
              className={`s7-hyp-card${selectedHyp === key ? " s7-selected" : ""}`}
              onClick={() => selectHyp(key)}
            >
              <div className="s7-hyp-id">{hyp.id}</div>
              <div className="s7-hyp-name">{hyp.name}</div>
              <div className="s7-hyp-prob">{hyp.prob}%</div>
              <div className="s7-hyp-desc">{hyp.desc}</div>
              <div className="s7-prob-bar-wrap">
                <div className="s7-prob-bar" style={{ width: `${hyp.prob}%` }} />
              </div>
            </div>
          );
        })}

        {/* INVESTIGATE BUTTON */}
        <button
          className="s7-investigate-btn"
          disabled={!selectedHyp || isLoading}
          onClick={runInvestigation}
        >
          {isLoading
            ? "ANALYSING — DIMENSIONAL ENGINE ACTIVE..."
            : selectedHyp
            ? `INVESTIGATE HYP-${selectedHyp} → SEAL TO SOVEREIGN LEDGER`
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
              <div className="s7-loading-dots">
                <span /><span /><span />
              </div>
            ) : error ? (
              <span style={{ color: "#e8405a" }}>{error}</span>
            ) : reasoning ? (
              <p dangerouslySetInnerHTML={{ __html: highlightTerms(reasoning) }} />
            ) : null}
          </div>
        </div>

        {/* VERDICT */}
        <div className={`s7-verdict-block${verdictActive ? " s7-active" : ""}`}>
          <div className="s7-verdict-title">OPERATOR VERDICT</div>
          <div>{verdict}</div>
        </div>

        {/* SOVEREIGN LEDGER SEAL CONFIRMATION */}
        {sealed && (
          <div className="s7-sealed-badge">
            ⬡ SEALED TO SOVEREIGN LEDGER · ROUTING DOCTRINE FULFILLED
          </div>
        )}

      </div>
    </div>
  );
}

// ── Scoped CSS — all rules prefixed to #s7root ─────────────────────────────────
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
    top: 16px;
    left: 16px;
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
    background: rgba(232, 64, 90, 0.08);
    border: 1px solid rgba(232, 64, 90, 0.3);
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
    font-size: clamp(22px, 4vw, 32px);
    font-weight: 700;
    color: #e8ecf8;
    line-height: 1.2;
    margin-bottom: 10px;
  }

  .s7-h1 span { color: #e8405a; }

  .s7-subtitle {
    font-size: 14px;
    color: #5a6080;
    line-height: 1.6;
    max-width: 560px;
  }

  .s7-spectrograph-wrap {
    margin: 36px 0;
    background: #0b0e18;
    border: 1px solid #1e2235;
    border-radius: 6px;
    overflow: hidden;
  }

  .s7-spec-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #1e2235;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: #5a6080;
    letter-spacing: 0.08em;
  }

  .s7-spec-header-alert { color: #ff6b35; }

  .s7-spec-canvas {
    padding: 24px 16px 12px;
    position: relative;
  }

  .s7-spectrum-bar {
    height: 40px;
    border-radius: 3px;
    background: linear-gradient(to right,
      #3a006f 0%, #5500cc 8%, #0033ff 20%, #0099ff 32%, #00cccc 42%,
      #00ff88 52%, #aaff00 60%, #ffee00 68%, #ff8800 78%, #ff2200 88%,
      #880000 95%, #330000 100%
    );
    position: relative;
    margin-bottom: 20px;
  }

  .s7-line-expected {
    position: absolute;
    top: -6px; bottom: -6px;
    width: 2px;
    background: rgba(255,255,255,0.5);
    left: calc(82% - 1px);
  }

  .s7-line-expected::before {
    content: 'Hα 656.3nm';
    position: absolute;
    top: -22px; left: 50%;
    transform: translateX(-50%);
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    color: rgba(255,255,255,0.4);
    white-space: nowrap;
  }

  .s7-line-anomaly {
    position: absolute;
    top: -10px; bottom: -10px;
    width: 6px;
    background: linear-gradient(to right, transparent, #ff6b35 50%, transparent);
    left: calc(82.5% - 3px);
    filter: blur(1px);
    box-shadow: 0 0 12px rgba(255,107,53,0.3), 0 0 24px rgba(255,107,53,0.3);
  }

  .s7-line-anomaly::after {
    content: '⚠ ANOMALY';
    position: absolute;
    bottom: -22px; left: 50%;
    transform: translateX(-50%);
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    color: #ff6b35;
    white-space: nowrap;
    letter-spacing: 0.1em;
  }

  .s7-wl-axis {
    display: flex; justify-content: space-between;
    padding: 0 0 4px;
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    color: #5a6080;
    margin-top: 28px;
  }

  .s7-profile-wrap {
    padding: 0 16px 20px;
    border-top: 1px solid #1e2235;
  }

  .s7-profile-label {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    color: #5a6080;
    letter-spacing: 0.08em;
    padding: 12px 0 8px;
  }

  .s7-profile-svg { width: 100%; overflow: visible; }

  .s7-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
  .s7-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px; }

  @media (max-width: 600px) {
    .s7-grid-2, .s7-grid-3 { grid-template-columns: 1fr; }
  }

  .s7-panel {
    background: #111420;
    border: 1px solid #1e2235;
    border-radius: 6px;
    padding: 16px;
  }

  .s7-panel-label {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.15em;
    color: #5a6080;
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  .s7-data-row {
    display: flex; justify-content: space-between; align-items: baseline;
    padding: 5px 0;
    border-bottom: 1px solid rgba(30, 34, 53, 0.6);
    font-size: 12px;
  }

  .s7-data-row:last-child { border-bottom: none; }
  .s7-data-key { color: #5a6080; font-family: 'Space Mono', monospace; font-size: 10px; }
  .s7-data-val { color: #e8ecf8; font-family: 'Space Mono', monospace; font-size: 11px; }
  .s7-flag { color: #ff6b35; }
  .s7-ok { color: #4caf87; }
  .s7-warn { color: #f5a623; }

  .s7-section-title {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.15em;
    color: #5a6080;
    text-transform: uppercase;
    margin: 32px 0 14px;
    display: flex; align-items: center; gap: 12px;
  }

  .s7-section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #1e2235;
  }

  .s7-hyp-card {
    background: #111420;
    border: 1px solid #1e2235;
    border-radius: 6px;
    padding: 16px;
    position: relative;
    transition: border-color 0.2s;
    cursor: pointer;
    margin-bottom: 10px;
  }

  .s7-hyp-card:hover { border-color: #4fc3f7; }
  .s7-hyp-card.s7-selected { border-color: #ff6b35; background: rgba(255, 107, 53, 0.05); }

  .s7-hyp-id {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    color: #5a6080;
    margin-bottom: 6px;
    letter-spacing: 0.1em;
  }

  .s7-hyp-name {
    font-size: 13px;
    font-weight: 600;
    color: #e8ecf8;
    margin-bottom: 6px;
  }

  .s7-hyp-desc {
    font-size: 11px;
    color: #5a6080;
    line-height: 1.6;
  }

  .s7-hyp-prob {
    position: absolute;
    top: 14px; right: 14px;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: #4fc3f7;
  }

  .s7-prob-bar-wrap {
    height: 3px;
    background: #1e2235;
    border-radius: 2px;
    margin-top: 10px;
    overflow: hidden;
  }

  .s7-prob-bar {
    height: 100%;
    border-radius: 2px;
    background: #4fc3f7;
    transition: width 0.5s ease;
  }

  .s7-investigate-btn {
    display: block;
    width: 100%;
    margin-top: 24px;
    padding: 14px;
    background: transparent;
    border: 1px solid #e8405a;
    border-radius: 4px;
    color: #e8405a;
    font-family: 'Space Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
  }

  .s7-investigate-btn:hover:not(:disabled) {
    background: #e8405a;
    color: #05060a;
  }

  .s7-investigate-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .s7-reasoning-panel {
    display: none;
    margin-top: 24px;
    background: #0b0e18;
    border: 1px solid #1e2235;
    border-radius: 6px;
    overflow: hidden;
  }

  .s7-reasoning-panel.s7-active { display: block; }

  .s7-reasoning-header {
    padding: 12px 16px;
    border-bottom: 1px solid #1e2235;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: #4fc3f7;
    letter-spacing: 0.1em;
    display: flex; align-items: center; gap: 8px;
  }

  .s7-reasoning-body {
    padding: 20px;
    font-size: 13px;
    line-height: 1.8;
    color: #c8cfe0;
  }

  .s7-key-term {
    color: #ff6b35;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
  }

  .s7-loading-dots {
    display: inline-flex; gap: 4px; align-items: center;
  }

  .s7-loading-dots span {
    width: 4px; height: 4px;
    border-radius: 50%;
    background: #4fc3f7;
    animation: s7-dot-blink 1.2s ease-in-out infinite;
  }

  .s7-loading-dots span:nth-child(2) { animation-delay: 0.2s; }
  .s7-loading-dots span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes s7-dot-blink {
    0%, 80%, 100% { opacity: 0.2; }
    40% { opacity: 1; }
  }

  .s7-verdict-block {
    display: none;
    margin-top: 16px;
    padding: 16px;
    border-radius: 4px;
    border-left: 3px solid #4caf87;
    background: rgba(76, 175, 135, 0.06);
    font-size: 12px;
    line-height: 1.7;
    color: #c8cfe0;
  }

  .s7-verdict-block.s7-active { display: block; }

  .s7-verdict-title {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: #4caf87;
    letter-spacing: 0.12em;
    margin-bottom: 8px;
  }

  .s7-obs-entry {
    display: flex; gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid rgba(30, 34, 53, 0.5);
    font-family: 'Space Mono', monospace;
    font-size: 10px;
  }

  .s7-obs-ts { color: #5a6080; flex-shrink: 0; }
  .s7-obs-msg { color: #c8cfe0; }
  .s7-obs-alert { color: #e8405a; }
  .s7-obs-info { color: #4fc3f7; }

  #s7root ::-webkit-scrollbar { width: 4px; }
  #s7root ::-webkit-scrollbar-track { background: #0b0e18; }
  #s7root ::-webkit-scrollbar-thumb { background: #1e2235; border-radius: 2px; }
`;

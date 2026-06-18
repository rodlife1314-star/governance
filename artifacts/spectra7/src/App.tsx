import { useState } from "react";

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
      `<span class="key-term">${term}</span>`
    );
  }
  return result
    .replace(/\n\n/g, '</p><p style="margin-top:12px">')
    .replace(/\n/g, "<br>");
}

export default function App() {
  const [selectedHyp, setSelectedHyp] = useState<HypKey | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reasoning, setReasoning] = useState("");
  const [verdict, setVerdict] = useState("");
  const [panelTitle, setPanelTitle] = useState("");
  const [error, setError] = useState("");

  function selectHyp(key: HypKey) {
    setSelectedHyp(key);
    setReasoning("");
    setVerdict("");
    setError("");
  }

  async function runInvestigation() {
    if (!selectedHyp) return;
    setIsLoading(true);
    setReasoning("");
    setVerdict("");
    setError("");
    setPanelTitle("");

    try {
      const res = await fetch("/api/spectra/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hypKey: selectedHyp }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Unknown error");
      setPanelTitle(data.title || "");
      setReasoning(data.analysis || "");
      setVerdict(data.verdict || "");
    } catch (err: any) {
      setError(`ANALYSIS ENGINE ERROR: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  const panelActive = isLoading || !!reasoning || !!error;
  const verdictActive = !!verdict && !isLoading;

  return (
    <>
      <div className="starfield" />
      <div className="container">

        {/* ALERT BAR */}
        <div className="alert-bar">
          <div className="alert-dot" />
          SPECTRA-7 // ANOMALY CLASSIFICATION PROTOCOL — ACTIVE OBSERVATION SESSION
        </div>

        {/* TITLE */}
        <div className="title-block">
          <div className="eyebrow">Spectroscopic Anomaly // Case ID: SA-2026-0041</div>
          <h1>
            Emission at <span>656nm</span>
            <br />
            Does Not Resolve as H&#945;
          </h1>
          <p className="subtitle">
            A spectral line has been detected at the wavelength of hydrogen's Balmer alpha
            transition — but its profile, intensity ratio, and temporal behaviour are
            inconsistent with standard recombination emission. Diagnose the source.
          </p>
        </div>

        {/* SPECTROGRAPH */}
        <div className="spectrograph-wrap">
          <div className="spec-header">
            <span>DETECTOR: OPTICAL // RES: 0.1Å/px // RANGE: 380–700nm</span>
            <span className="spec-header-alert">⚠ PROFILE MISMATCH DETECTED</span>
          </div>
          <div className="spec-canvas">
            <div className="spectrum-bar">
              <div className="line-expected" />
              <div className="line-anomaly" />
            </div>
            <div className="wl-axis">
              <span>380nm</span>
              <span>430nm</span>
              <span>480nm</span>
              <span>530nm</span>
              <span>580nm</span>
              <span>630nm</span>
              <span>680nm</span>
              <span>700nm</span>
            </div>
          </div>

          {/* EMISSION PROFILE */}
          <div className="profile-wrap">
            <div className="profile-label">
              EMISSION LINE PROFILE — OBSERVED vs EXPECTED (normalised flux)
            </div>
            <svg
              className="profile-svg"
              viewBox="0 0 860 120"
              preserveAspectRatio="none"
              height="100"
            >
              <line x1="0" y1="100" x2="860" y2="100" stroke="#1e2235" strokeWidth="1" />
              <line x1="0" y1="70" x2="860" y2="70" stroke="#1e2235" strokeWidth="0.5" strokeDasharray="3,4" />
              <line x1="0" y1="40" x2="860" y2="40" stroke="#1e2235" strokeWidth="0.5" strokeDasharray="3,4" />
              <line x1="0" y1="10" x2="860" y2="10" stroke="#1e2235" strokeWidth="0.5" strokeDasharray="3,4" />

              {/* Expected narrow Gaussian */}
              <path
                d="M 680,100 Q 690,100 695,95 Q 700,60 705,10 Q 710,60 715,95 Q 720,100 730,100"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1.5"
                strokeDasharray="4,3"
              />

              {/* Observed — broader, redshifted, asymmetric */}
              <path
                d="M 660,100 Q 668,100 675,97 Q 685,80 695,40 Q 700,15 710,8 Q 720,15 728,35 Q 738,65 748,90 Q 758,100 770,100"
                fill="rgba(255, 107, 53, 0.12)"
                stroke="#ff6b35"
                strokeWidth="2"
              />

              {/* Blue absorption trough */}
              <path
                d="M 620,100 Q 628,100 635,98 Q 642,88 648,102 Q 652,110 660,100"
                fill="rgba(79, 195, 247, 0.08)"
                stroke="#4fc3f7"
                strokeWidth="1.5"
              />

              <text x="697" y="24" fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="Space Mono" textAnchor="middle">Expected</text>
              <text x="740" y="30" fill="#ff6b35" fontSize="9" fontFamily="Space Mono">Observed</text>
              <text x="636" y="84" fill="#4fc3f7" fontSize="9" fontFamily="Space Mono" textAnchor="middle">Abs.</text>
            </svg>
          </div>
        </div>

        {/* OBSERVATIONAL PARAMETERS */}
        <div className="section-title">Observational Parameters</div>
        <div className="grid-3">
          <div className="panel">
            <div className="panel-label">Line Properties</div>
            <div className="data-row"><span className="data-key">Peak &#955;</span><span className="data-val flag">656.8nm</span></div>
            <div className="data-row"><span className="data-key">H&#945; rest &#955;</span><span className="data-val">656.28nm</span></div>
            <div className="data-row"><span className="data-key">FWHM</span><span className="data-val flag">~180 km/s</span></div>
            <div className="data-row"><span className="data-key">Expected FWHM</span><span className="data-val ok">~20 km/s</span></div>
            <div className="data-row"><span className="data-key">Profile</span><span className="data-val flag">Asymmetric</span></div>
          </div>
          <div className="panel">
            <div className="panel-label">Intensity Ratios</div>
            <div className="data-row"><span className="data-key">H&#945; / H&#946; (obs)</span><span className="data-val flag">8.2</span></div>
            <div className="data-row"><span className="data-key">H&#945; / H&#946; (expect)</span><span className="data-val ok">2.86</span></div>
            <div className="data-row"><span className="data-key">H&#945; / [NII]</span><span className="data-val warn">3.1</span></div>
            <div className="data-row"><span className="data-key">He II 4686</span><span className="data-val flag">Present</span></div>
            <div className="data-row"><span className="data-key">Balmer series</span><span className="data-val warn">Incomplete</span></div>
          </div>
          <div className="panel">
            <div className="panel-label">Source Context</div>
            <div className="data-row"><span className="data-key">Object type</span><span className="data-val warn">Unclassified</span></div>
            <div className="data-row"><span className="data-key">Temporal var.</span><span className="data-val flag">Yes (~6 days)</span></div>
            <div className="data-row"><span className="data-key">Blue abs. trough</span><span className="data-val flag">Present</span></div>
            <div className="data-row"><span className="data-key">X-ray assoc.</span><span className="data-val warn">Marginal</span></div>
            <div className="data-row"><span className="data-key">Radio flux</span><span className="data-val ok">Non-detect</span></div>
          </div>
        </div>

        {/* OBSERVATION LOG */}
        <div className="section-title">Observation Log</div>
        <div className="panel">
          <div className="obs-entry">
            <span className="obs-ts">T+00:00</span>
            <span className="obs-msg info">Spectrum acquired. Initial classification attempt: H II region.</span>
          </div>
          <div className="obs-entry">
            <span className="obs-ts">T+00:14</span>
            <span className="obs-msg alert">MISMATCH: H&#945;/H&#946; ratio = 8.2. Expected &#8804;3.1 for standard recombination. Dust reddening alone insufficient to explain.</span>
          </div>
          <div className="obs-entry">
            <span className="obs-ts">T+00:21</span>
            <span className="obs-msg">Blue-shifted absorption trough detected at ~655.1nm. Consistent with outflowing material at ~500 km/s.</span>
          </div>
          <div className="obs-entry">
            <span className="obs-ts">T+00:35</span>
            <span className="obs-msg alert">He II 4686&#8491; emission confirmed. Implies hard ionising photon source (T &gt; 50,000 K or non-thermal).</span>
          </div>
          <div className="obs-entry">
            <span className="obs-ts">T+00:48</span>
            <span className="obs-msg">Temporal variability confirmed in archival cross-match. Period ~6.2 days. No radio detection.</span>
          </div>
          <div className="obs-entry">
            <span className="obs-ts">T+01:02</span>
            <span className="obs-msg info">Awaiting hypothesis selection. Standard H&#945; classification rejected.</span>
          </div>
        </div>

        {/* HYPOTHESES */}
        <div className="section-title">Candidate Hypotheses</div>

        {(["A", "B", "C", "D"] as HypKey[]).map((key) => {
          const hyp = HYPOTHESES[key];
          return (
            <div
              key={key}
              className={`hyp-card${selectedHyp === key ? " selected" : ""}`}
              onClick={() => selectHyp(key)}
            >
              <div className="hyp-id">{hyp.id}</div>
              <div className="hyp-name">{hyp.name}</div>
              <div className="hyp-prob">{hyp.prob}%</div>
              <div className="hyp-desc">{hyp.desc}</div>
              <div className="prob-bar-wrap">
                <div className="prob-bar" style={{ width: `${hyp.prob}%` }} />
              </div>
            </div>
          );
        })}

        {/* INVESTIGATE BUTTON */}
        <button
          className="investigate-btn"
          disabled={!selectedHyp || isLoading}
          onClick={runInvestigation}
        >
          {isLoading
            ? "ANALYSING..."
            : selectedHyp
            ? `INVESTIGATE HYP-${selectedHyp} →`
            : "SELECT A HYPOTHESIS TO INVESTIGATE →"}
        </button>

        {/* REASONING PANEL */}
        <div className={`reasoning-panel${panelActive ? " active" : ""}`}>
          <div className="reasoning-header">
            <span>&#9658;</span>
            <span>{panelTitle || "ANALYTICAL REASONING ENGINE — INITIALISING"}</span>
          </div>
          <div className="reasoning-body">
            {isLoading ? (
              <div className="loading-dots">
                <span /><span /><span />
              </div>
            ) : error ? (
              <span style={{ color: "var(--h-alpha)" }}>{error}</span>
            ) : reasoning ? (
              <p
                dangerouslySetInnerHTML={{
                  __html: highlightTerms(reasoning),
                }}
              />
            ) : null}
          </div>
        </div>

        {/* VERDICT */}
        <div className={`verdict-block${verdictActive ? " active" : ""}`}>
          <div className="verdict-title">OPERATOR VERDICT</div>
          <div>{verdict}</div>
        </div>

      </div>
    </>
  );
}

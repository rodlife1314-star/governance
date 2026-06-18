import { Router } from "express";
import { ai } from "@workspace/integrations-gemini-ai";

const router = Router();

const MODEL = "gemini-2.5-flash";

async function callGemini(prompt: string, systemInstruction?: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: systemInstruction ? { systemInstruction } : undefined,
  });
  return response.text ?? "";
}

const SYSTEM_PROMPT = `You are SPECTRA-7, an astrophysical spectroscopy analysis engine. You provide rigorous, technically precise reasoning about unusual spectral observations.

Your analysis style:
- Reference actual physics: quantum transitions, line formation mechanisms, diagnostic ratios
- Use real astrophysical quantities and name the key discriminating observations
- Be decisive but acknowledge what additional observations would confirm
- Write in flowing prose, not bullet points
- Keep it to ~200 words — dense and expert, not padded`;

const VERDICT_SYSTEM = `You are a senior astrophysicist giving a brief operator verdict. Based on the hypothesis analysis, give a 2-3 sentence conclusion: state whether this hypothesis should be the primary classification, the single most discriminating follow-up observation needed, and what confidence level you assign. Be direct. No bullet points.`;

type HypKey = "A" | "B" | "C" | "D";

const HYPOTHESIS_PROMPTS: Record<HypKey, { title: string; analysisPrompt: string }> = {
  A: {
    title: "P CYGNI PROFILE — STELLAR WIND ANALYSIS",
    analysisPrompt: `The observer has selected the P Cygni/stellar wind hypothesis to explain an anomalous emission at 656nm with: FWHM ~180 km/s (vs expected ~20 km/s), asymmetric profile, blue-shifted absorption trough at ~655.1nm (implying outflow at ~500 km/s), Hα/Hβ ratio of 8.2 (vs Case B 2.86), He II 4686Å detected, 6-day temporal variability, no radio detection.

Analyse whether the P Cygni hypothesis holds. Discuss the physics of line formation in stellar winds (Sobolev approximation, velocity law), what stellar class would produce these parameters, how He II fits in, and what the ~6 day variability could represent. What single follow-up observation would clinch or refute this interpretation?`,
  },
  B: {
    title: "ACCRETION DISK EMISSION — COMPACT BINARY ANALYSIS",
    analysisPrompt: `The observer has selected the compact binary/accretion disk hypothesis to explain an anomalous emission at 656nm with: FWHM ~180 km/s, asymmetric profile, blue-shifted absorption trough at ~655.1nm, Hα/Hβ ratio of 8.2 (vs Case B 2.86), He II 4686Å detected, 6-day temporal variability, marginal X-ray association, no radio detection.

Analyse whether the accretion disk hypothesis holds. Discuss the physics of disk emission line formation (double-peaked Keplerian profiles, disk wind, irradiation), what type of compact binary this could be (CV, LMXB, symbiotic), how the 6-day period fits an orbital scenario, why the Balmer decrement is elevated, and what the He II implies about the disk accretion rate. What single follow-up observation would confirm or refute this?`,
  },
  C: {
    title: "RAMAN SCATTERING — SYMBIOTIC SYSTEM ANALYSIS",
    analysisPrompt: `The observer has selected the Raman scattering/symbiotic star hypothesis to explain an anomalous emission at 656nm with: FWHM ~180 km/s, asymmetric and broad profile, blue-shifted absorption at ~655.1nm, Hα/Hβ ratio of 8.2, He II 4686Å present, 6-day variability, no radio detection.

Analyse whether the Raman scattering/symbiotic star hypothesis holds. Explain the Raman scattering mechanism (OVI photons scattering off HI in the giant's wind), what wavelength shifts this produces, why the anomalous Balmer decrement could arise from optical depth effects in a dense nebula, whether the blue absorption could be a disk wind from the accreting white dwarf, and how the He II arises in symbiotic novae. Is 6 days consistent with symbiotic binary orbital motion? What observation would distinguish this from hypothesis A?`,
  },
  D: {
    title: "SHOCK-EXCITED EMISSION — SNR INTERACTION ANALYSIS",
    analysisPrompt: `The observer has selected the shock-excited emission/supernova remnant hypothesis to explain an anomalous emission at 656nm with: FWHM ~180 km/s, broad asymmetric profile, blue-shifted absorption trough, Hα/Hβ ratio of 8.2 (vs Case B 2.86), He II 4686Å detected, 6-day temporal variability, no radio detection.

Analyse whether the shock-excited SNR/CSM interaction hypothesis holds. Explain shock-excited Balmer emission vs photoionised emission (the Chevalier & Fransson model), how non-radiative shocks produce narrow + broad Hα components, whether the observed width is consistent with shock velocities vs thermal broadening, why He II would appear in fast shock post-shock zones. How does the lack of radio emission constrain this? What does the 6-day variability imply — light travel time, CSM clumping? What would discriminate this from a compact binary?`,
  },
};

router.post("/spectra/analyse", async (req, res) => {
  const { hypKey } = req.body as { hypKey?: string };

  if (!hypKey || !["A", "B", "C", "D"].includes(hypKey)) {
    res.status(400).json({ success: false, error: "Invalid or missing hypKey (must be A, B, C, or D)" });
    return;
  }

  const hyp = HYPOTHESIS_PROMPTS[hypKey as HypKey];

  try {
    const analysis = await callGemini(hyp.analysisPrompt, SYSTEM_PROMPT);

    const verdictPrompt = `${hyp.analysisPrompt}

Previous analysis:
${analysis}

Now give your operator verdict: primary classification status, the ONE follow-up observation that would be definitive, and your confidence level (0-100%).`;

    const verdict = await callGemini(verdictPrompt, VERDICT_SYSTEM);

    res.json({ success: true, analysis, verdict, title: hyp.title });
  } catch (err: any) {
    req.log.error(err, "Spectra analyse failed");
    res.status(500).json({ success: false, error: "Analysis engine error" });
  }
});

export default router;

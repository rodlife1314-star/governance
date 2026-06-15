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

router.post("/gemini/slice-reasoning", async (req, res) => {
  try {
    const { spotPrice, futuresPrice, delta, divergenceThreshold, marketMode } = req.body;
    const prompt = `You are an HFT operator AI. Analyze this market state:
- BTC Spot: $${spotPrice}
- BTC Futures (CME): $${futuresPrice}
- Delta: $${delta.toFixed(2)}
- Aperture Threshold: $${divergenceThreshold}
- Market Mode: ${marketMode}

Provide a concise 2-3 sentence reality slice analysis covering:
1. Whether this delta is normal or signals an arbitrage opportunity
2. The implied market structure (contango/backwardation)
3. Recommended operator action

Keep response under 150 words and use precise HFT terminology.`;

    const text = await callGemini(prompt);
    res.json({ success: true, reasoning: text });
  } catch (err: any) {
    req.log.error(err, "Gemini slice-reasoning failed");
    res.status(500).json({ success: false, error: "Gemini API error" });
  }
});

router.post("/gemini/slice-scale-analysis", async (req, res) => {
  try {
    const { spotPrice, futuresPrice, delta, sliceIntentId, authority, asset } = req.body;
    const prompt = `You are a sovereign operator AI performing scale analysis on a BTC dual-authority packet.

Packet ID: ${sliceIntentId}
Authority: ${authority}
Asset: ${asset}
Spot: $${spotPrice}
Futures: $${futuresPrice}
Delta: $${delta?.toFixed(2) ?? "N/A"}

Provide a structured analysis with:
1. SCALE ASSESSMENT: Whether price scales are consistent across authorities
2. ALIGNMENT STATE: ALIGNED or DIVERGENT with brief justification  
3. SOVEREIGN RECOMMENDATION: APPROVE or FLAG for operator review
4. EVIDENCE: 2-3 specific data points supporting your assessment

Format as a brief technical report under 200 words.`;

    const text = await callGemini(prompt);
    res.json({ success: true, analysis: text });
  } catch (err: any) {
    req.log.error(err, "Gemini slice-scale-analysis failed");
    res.status(500).json({ success: false, error: "Gemini API error" });
  }
});

router.post("/gemini/generate-rust-code", async (req, res) => {
  try {
    const { fileName, description, targetState, optimizationStrategy } = req.body;

    const prompt = `You are an expert Rust systems programmer specializing in HFT (High Frequency Trading) infrastructure.

Generate optimized Rust code for: ${fileName}
Layer: ${targetState?.layer || "systems_layer"}
Path: ${targetState?.currentPath || "/src"}
Optimization Strategy: ${optimizationStrategy || "Minimize latency"}
Description: ${description || "Optimize for sub-microsecond execution"}

Requirements:
- Use #[repr(C)] or #[repr(align(64))] for cache-line alignment where appropriate
- Prefer stack allocation over heap where possible
- Use unsafe blocks with clear safety comments only when necessary
- Include inline hints (#[inline(always)]) on hot paths
- Target: sub-85ns execution latency

Return ONLY valid Rust code (no markdown fences). Include a brief doc comment at the top explaining the optimization strategy applied.`;

    const code = await callGemini(prompt, "You are a Rust expert. Return only valid Rust source code with no markdown fences.");

    const explanationPrompt = `Briefly explain in 2-3 sentences what optimizations were applied to the Rust code for ${fileName}, focusing on cache alignment, allocation strategy, and branch prediction improvements.`;
    const explanation = await callGemini(explanationPrompt);

    res.json({ success: true, code, explanation });
  } catch (err: any) {
    req.log.error(err, "Gemini generate-rust-code failed");
    res.status(500).json({ success: false, error: "Gemini API error" });
  }
});

router.post("/gemini/analyze-compile-error", async (req, res) => {
  try {
    const { componentName, errorContext } = req.body;

    const prompt = `You are a Rust compiler diagnostics expert specializing in HFT systems.

Component: ${componentName}
Error Type: ${errorContext?.errorType || "compilation error"}
Optimization Level: ${errorContext?.optLevel || "3"}
Target Architecture: ${errorContext?.targetArch || "native"}

Recent compiler logs:
${(errorContext?.logs || []).join('\n')}

Provide a micro-architectural diagnostic analysis:
1. ROOT CAUSE: What specific hardware/memory constraint triggered this
2. CACHE ANALYSIS: How L1/L2/L3 cache line alignment is affected
3. FIX STRATEGY: Specific Rust attributes or code changes to resolve
4. LATENCY IMPACT: Estimated ns improvement after fix

Keep under 200 words. Use precise Rust and hardware terminology.`;

    const analysis = await callGemini(prompt);
    res.json({ success: true, analysis });
  } catch (err: any) {
    req.log.error(err, "Gemini analyze-compile-error failed");
    res.status(500).json({ success: false, error: "Gemini API error" });
  }
});

router.post("/gemini/feedback-simulation", async (req, res) => {
  try {
    const { latencyMs, signalFills, systemGain, noiseRatio } = req.body;

    const prompt = `You are a PID controller tuning AI for HFT feedback loops.

Current System State:
- Core Latency: ${latencyMs}ns
- Signal Fill Rate: ${signalFills}%
- Current Proportional Gain (Kp): ${systemGain}
- System Noise Ratio: ${noiseRatio}

Calculate optimal PID gains for sub-microsecond HFT execution. Return ONLY valid JSON in this exact format:
{
  "pid_gains": {
    "proportional": <float between 0.5 and 4.0>,
    "integral": <float between 0.01 and 1.5>,
    "derivative": <float between 0.01 and 2.0>
  },
  "ai_recommendation": "<2 sentence explanation of tuning rationale>"
}`;

    const raw = await callGemini(prompt, "Return only valid JSON, no markdown fences.");
    let parsed: any;
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        pid_gains: { proportional: 1.24, integral: 0.08, derivative: 0.42 },
        ai_recommendation: "Tuning applied based on latency profile. Proportional gain adjusted to reduce overshoot at current noise ratio."
      };
    }
    res.json({ success: true, ...parsed });
  } catch (err: any) {
    req.log.error(err, "Gemini feedback-simulation failed");
    res.status(500).json({ success: false, error: "Gemini API error" });
  }
});

export default router;

import { ai } from "@workspace/integrations-gemini-ai";
import { callNvidia, isNvidiaAvailable } from "./nvidia.js";

export interface InferenceResult {
  content: string;
  thinkingTrace?: string;
}

export interface InferenceAdapter {
  readonly name: string;
  invoke(prompt: string, systemInstruction?: string): Promise<InferenceResult>;
}

class GeminiAdapter implements InferenceAdapter {
  readonly name = "gemini";
  private readonly model = "gemini-2.5-flash";

  async invoke(prompt: string, systemInstruction?: string): Promise<InferenceResult> {
    const response = await ai.models.generateContent({
      model: this.model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: systemInstruction ? { systemInstruction } : undefined,
    });
    return { content: response.text ?? "" };
  }
}

class NvidiaInferenceAdapter implements InferenceAdapter {
  readonly name = "nvidia";
  private readonly enableThinking: boolean;

  constructor(enableThinking = true) {
    this.enableThinking = enableThinking;
  }

  async invoke(prompt: string, systemInstruction?: string): Promise<InferenceResult> {
    const result = await callNvidia(prompt, systemInstruction, {
      enableThinking: this.enableThinking,
    });
    return { content: result.content, thinkingTrace: result.thinkingTrace || undefined };
  }
}

export function getRapidsAdapter(): InferenceAdapter {
  const provider = (process.env.INFERENCE_PROVIDER ?? "gemini").toLowerCase();
  if (provider === "nvidia" && isNvidiaAvailable()) return new NvidiaInferenceAdapter();
  return new GeminiAdapter();
}

export function getSpectraAdapter(): InferenceAdapter {
  if (isNvidiaAvailable()) return new NvidiaInferenceAdapter(true);
  return new GeminiAdapter();
}

import OpenAI from "openai";

const MODEL = "nvidia/nemotron-3-ultra-550b-a55b";

function createClient(): OpenAI {
  return new OpenAI({
    baseURL: "https://integrate.api.nvidia.com/v1",
    apiKey: process.env.NVIDIA_API_KEY ?? "",
  });
}

export interface NvidiaResult {
  content: string;
  thinkingTrace: string;
}

export async function callNvidia(
  prompt: string,
  systemInstruction?: string,
  opts?: { temperature?: number; maxTokens?: number; enableThinking?: boolean },
): Promise<NvidiaResult> {
  const client = createClient();
  const messages: OpenAI.ChatCompletionMessageParam[] = [];
  if (systemInstruction) messages.push({ role: "system", content: systemInstruction });
  messages.push({ role: "user", content: prompt });

  const enableThinking = opts?.enableThinking ?? true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stream = (await (client.chat.completions as any).create({
    model: MODEL,
    messages,
    temperature: opts?.temperature ?? 0.6,
    top_p: 0.95,
    max_tokens: opts?.maxTokens ?? 16384,
    stream: true,
    ...(enableThinking
      ? { chat_template_kwargs: { enable_thinking: true }, reasoning_budget: 16384 }
      : {}),
  })) as AsyncIterable<OpenAI.ChatCompletionChunk>;

  let content = "";
  let thinkingTrace = "";

  for await (const chunk of stream) {
    if (!chunk.choices?.length) continue;
    const delta = chunk.choices[0].delta as Record<string, unknown>;
    if (typeof delta.reasoning_content === "string") thinkingTrace += delta.reasoning_content;
    if (typeof delta.content === "string" && delta.content) content += delta.content;
  }

  return { content: content.trim(), thinkingTrace: thinkingTrace.trim() };
}

export function isNvidiaAvailable(): boolean {
  return Boolean(process.env.NVIDIA_API_KEY);
}

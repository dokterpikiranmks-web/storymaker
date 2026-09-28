import "server-only";
import {
  classifyFailure,
  getGeminiClient,
  getRequestTimeoutMs,
  ModelOutputError,
  runWithFailover,
  type AttemptLog,
} from "./detector";

export interface GenerateOptions {
  /** Ask Gemini for `application/json` output. */
  json?: boolean;
  /** JSON Schema forwarded as `responseJsonSchema` (dropped automatically if a model rejects it). */
  responseSchema?: Record<string, unknown>;
  temperature?: number;
  requestId?: string;
  timeoutMs?: number;
}

export interface GenerateResult<T = string> {
  data: T;
  text: string;
  model: string;
  attempts: AttemptLog[];
  latencyMs: number;
}

async function callModel(
  model: string,
  prompt: string,
  systemInstruction: string,
  options: GenerateOptions,
  withSchema: boolean,
  deadline: number,
) {
  const ai = getGeminiClient();
  // Per-attempt timeout never exceeds the remaining request budget → a hanging
  // model can't starve the next model in the cascade (serverless-safe).
  const timeout = Math.max(4_000, Math.min(options.timeoutMs ?? getRequestTimeoutMs(), deadline - Date.now() - 1_000));
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      temperature: options.temperature ?? 0.9,
      // Our own cascade handles retries → disable SDK-level retry so failover is instant.
      httpOptions: { timeout, retryOptions: { attempts: 1 } },
      ...(options.json ? { responseMimeType: "application/json" } : {}),
      ...(options.json && withSchema && options.responseSchema ? { responseJsonSchema: options.responseSchema } : {}),
    },
  });
  const text = response.text?.trim();
  if (!text) {
    const reason = response.candidates?.[0]?.finishReason ?? response.promptFeedback?.blockReason ?? "EMPTY";
    throw new ModelOutputError(`Respons kosong dari ${model} (finishReason=${String(reason)})`);
  }
  return text;
}

/**
 * Generic structured generation with transparent model failover.
 * `parse` runs INSIDE the failover loop: if a model returns malformed output
 * the next model in the cascade gets a chance.
 */
export async function generateStructured<T>(
  prompt: string,
  systemInstruction: string,
  parse: (text: string) => T,
  options: GenerateOptions = {},
): Promise<GenerateResult<T>> {
  const started = Date.now();
  const { result, model, attempts } = await runWithFailover(
    async (model, { deadline }) => {
      let text: string;
      try {
        text = await callModel(model, prompt, systemInstruction, options, true, deadline);
      } catch (err) {
        // Some model generations reject JSON-schema constrained decoding (HTTP 400) —
        // retry the SAME model once with plain JSON mode before failing over.
        const failure = classifyFailure(err);
        if (options.json && options.responseSchema && failure.kind === "bad_request" && deadline - Date.now() > 5_000) {
          text = await callModel(model, prompt, systemInstruction, options, false, deadline);
        } else {
          throw err;
        }
      }
      return { text, data: parse(text) };
    },
    { requestId: options.requestId },
  );
  return { data: result.data, text: result.text, model, attempts, latencyMs: Date.now() - started };
}

/**
 * PRD Task 1.2 — generic wrapper: `generateHypnoticContent(prompt, systemInstruction)`.
 * Returns raw text from the optimal available Gemini model.
 */
export async function generateHypnoticContent(
  prompt: string,
  systemInstruction: string,
  options: GenerateOptions = {},
): Promise<GenerateResult<string>> {
  return generateStructured(prompt, systemInstruction, (text) => text, options);
}

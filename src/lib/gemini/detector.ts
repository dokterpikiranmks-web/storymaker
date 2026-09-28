import "server-only";
import { ApiError, GoogleGenAI } from "@google/genai";
import { getTelemetrySince, recordTelemetry, sanitizeErrorMessage } from "./telemetry";

/**
 * ════════════════════════════════════════════════════════════════════════
 *  Gemini Autodetect & Quota Guard Engine (PRD §3.1 / Task 1.1)
 * ════════════════════════════════════════════════════════════════════════
 *  1. Dynamic Model Discovery — `ai.models.list()` finds every text model
 *     that supports `generateContent` for THIS api key. If listing fails the
 *     engine probes a static seed list with `ai.models.get()` (no quota cost).
 *  2. Prioritized Fallback Cascade — newest-generation Flash first
 *     ("gemini-2.5-flash atau model flash generasi terbaru"), then older
 *     Flash, then Flash-Lite. PRD legacy names (2.0-flash, 1.5-flash,
 *     2.0-flash-lite) stay in the seed list and are auto-skipped once Google
 *     reports them as shut down (404 → marked unavailable for 24h).
 *  3. Circuit Breaker + Exponential Backoff — every model has its own
 *     breaker. HTTP 429/503/5xx/timeouts open the breaker for a cooldown
 *     (429 base = 60s, honouring server `retryDelay`), doubling on every
 *     consecutive failure (half-open trial after expiry). The request is
 *     transparently handed to the next model in the cascade.
 *  4. Telemetry — every attempt is logged to `gemini_model_telemetry`; a
 *     cold serverless instance re-hydrates open breakers from that table.
 * ════════════════════════════════════════════════════════════════════════
 */

// ── Types ────────────────────────────────────────────────────────────────
export type ModelState = "ready" | "cooldown" | "unavailable";

export type FailureKind =
  | "rate_limit"
  | "daily_quota"
  | "no_free_quota"
  | "overloaded"
  | "server_error"
  | "timeout"
  | "not_found"
  | "forbidden"
  | "bad_request"
  | "bad_output"
  | "auth"
  | "unknown";

export interface ModelHealth {
  model: string;
  consecutiveFailures: number;
  cooldownUntil: number;
  unavailable: boolean;
  lastStatus: number | null;
  lastFailureKind: FailureKind | null;
  lastError: string | null;
  lastLatencyMs: number | null;
  lastSuccessAt: number | null;
  lastFailureAt: number | null;
  successCount: number;
  failureCount: number;
}

export type ModelTier = "flash" | "flash-lite" | "pro" | "other";

export interface DiscoveredModel {
  id: string;
  displayName?: string;
  version: number | null;
  tier: ModelTier;
  preview: boolean;
  alias: boolean;
  pinned: boolean;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
}

export interface DiscoveryResult {
  source: "models.list" | "env" | "probe" | "static";
  models: DiscoveredModel[];
  cascade: string[];
  discoveredAt: number;
  error?: string;
}

export interface ClassifiedFailure {
  status: number;
  kind: FailureKind;
  message: string;
  /** Cooldown BEFORE exponential escalation. 0 = do not open the breaker. */
  baseCooldownMs: number;
  /** Server supplied RetryInfo.retryDelay, when present. */
  retryAfterMs: number | null;
  /** Stop the whole cascade (e.g. invalid API key — every model would fail). */
  fatal: boolean;
  /** Mark model as not served for this key (404). */
  unavailable: boolean;
  /** Escalate cooldown exponentially on consecutive failures. */
  escalate: boolean;
}

export interface AttemptLog {
  model: string;
  status: number;
  kind: FailureKind | "ok";
  latencyMs: number;
  message?: string;
}

// ── Configuration ────────────────────────────────────────────────────────
/** Priority list exactly as written in PRD v1.0 §3.1. */
export const PRD_PRIORITY_CASCADE = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-2.0-flash-lite",
] as const;

/** Used only when models.list() is unavailable. Order = PRD order + stable aliases. */
export const STATIC_SEED: string[] = [
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-flash-lite-latest",
];

const DISCOVERY_TTL_MS = 10 * 60_000;
const MAX_CASCADE = 8;
const MAX_ESCALATED_COOLDOWN_MS = 15 * 60_000;
const DAILY_QUOTA_COOLDOWN_MS = 60 * 60_000;
const NO_FREE_QUOTA_COOLDOWN_MS = 6 * 60 * 60_000;
const NOT_FOUND_COOLDOWN_MS = 24 * 60 * 60_000;
const FORBIDDEN_COOLDOWN_MS = 6 * 60 * 60_000;
const HYDRATION_WINDOW_MS = 24 * 60 * 60_000;

/** Non-text / specialised variants that should never be used for storytelling. */
const EXCLUDE_PATTERN =
  /(image|tts|audio|live|embed|vision|aqa|computer-use|robotics|native|learnlm|imagen|veo|gemma|thinking-exp|nano|banana|dialog|transcrib|diffusion|deep-research|customtools)/i;

export function getBaseCooldownMs(): number {
  const seconds = Number(process.env.GEMINI_COOLDOWN_SECONDS);
  return (Number.isFinite(seconds) && seconds > 0 ? seconds : 60) * 1000;
}

export function getRequestTimeoutMs(): number {
  const ms = Number(process.env.GEMINI_TIMEOUT_MS);
  return Number.isFinite(ms) && ms >= 5_000 ? ms : 45_000;
}

function parseEnvPriority(): string[] {
  return (process.env.GEMINI_MODEL_PRIORITY ?? "")
    .split(",")
    .map((s) => normalizeModelId(s))
    .filter(Boolean);
}

// ── Global singleton state (per server instance, survives dev HMR) ───────
interface EngineState {
  client: GoogleGenAI | null;
  clientKey: string | null;
  health: Map<string, ModelHealth>;
  discovery: DiscoveryResult | null;
  discoveryPromise: Promise<DiscoveryResult> | null;
  hydrated: boolean;
  hydratePromise: Promise<void> | null;
}

const globalForEngine = globalThis as typeof globalThis & { __storyMakerGeminiEngine?: EngineState };

const state: EngineState =
  globalForEngine.__storyMakerGeminiEngine ??
  (globalForEngine.__storyMakerGeminiEngine = {
    client: null,
    clientKey: null,
    health: new Map(),
    discovery: null,
    discoveryPromise: null,
    hydrated: false,
    hydratePromise: null,
  });

// ── Errors ───────────────────────────────────────────────────────────────
export class GeminiNotConfiguredError extends Error {
  constructor() {
    super("GEMINI_API_KEY belum dikonfigurasi");
    this.name = "GeminiNotConfiguredError";
  }
}

export class GeminiCascadeError extends Error {
  readonly attempts: AttemptLog[];
  readonly fatal: boolean;
  constructor(message: string, attempts: AttemptLog[], fatal = false) {
    super(message);
    this.name = "GeminiCascadeError";
    this.attempts = attempts;
    this.fatal = fatal;
  }
}

/** Thrown by callers when a model answered but the output is unusable (empty / invalid JSON). */
export class ModelOutputError extends Error {
  readonly status = 422;
  constructor(message: string) {
    super(message);
    this.name = "ModelOutputError";
  }
}

// ── Client ───────────────────────────────────────────────────────────────
export function getApiKey(): string | null {
  return process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim() || null;
}

export function isGeminiConfigured(): boolean {
  return Boolean(getApiKey());
}

export function getGeminiClient(): GoogleGenAI {
  const key = getApiKey();
  if (!key) throw new GeminiNotConfiguredError();
  if (!state.client || state.clientKey !== key) {
    state.client = new GoogleGenAI({ apiKey: key });
    state.clientKey = key;
  }
  return state.client;
}

// ── Model classification & ranking ───────────────────────────────────────
export function normalizeModelId(name: string): string {
  return name.trim().replace(/^models\//, "");
}

export function classifyModel(id: string): Omit<DiscoveredModel, "displayName" | "inputTokenLimit" | "outputTokenLimit"> {
  const lower = id.toLowerCase();
  const versionMatch = lower.match(/^gemini-(\d+(?:\.\d+)?)/);
  const version = versionMatch ? Number.parseFloat(versionMatch[1]) : null;
  const tier: ModelTier = /flash-lite|flash-8b/.test(lower)
    ? "flash-lite"
    : /flash/.test(lower)
      ? "flash"
      : /pro/.test(lower)
        ? "pro"
        : "other";
  return {
    id,
    version,
    tier,
    preview: /preview|exp/.test(lower),
    alias: /latest/.test(lower),
    pinned: /-\d{3}$/.test(lower) || /-\d{2}-\d{2,4}$/.test(lower),
  };
}

const TIER_ORDER: Record<ModelTier, number> = { flash: 0, "flash-lite": 1, pro: 2, other: 3 };

/** Newest Flash first → older Flash → Flash-Lite; stable before preview; aliases & pinned snapshots last. */
export function compareModels(a: DiscoveredModel, b: DiscoveredModel): number {
  return (
    TIER_ORDER[a.tier] - TIER_ORDER[b.tier] ||
    Number(a.alias) - Number(b.alias) ||
    (b.version ?? -1) - (a.version ?? -1) ||
    Number(a.preview) - Number(b.preview) ||
    Number(a.pinned) - Number(b.pinned) ||
    a.id.length - b.id.length ||
    a.id.localeCompare(b.id)
  );
}

export function rankCascade(models: DiscoveredModel[]): string[] {
  const eligible = models
    .filter((m) => (m.tier === "flash" || m.tier === "flash-lite") && !EXCLUDE_PATTERN.test(m.id))
    .sort(compareModels);
  // One model per (tier, version) keeps the cascade diverse; reserve slots for
  // Flash-Lite because it has the most generous free-tier RPM/RPD — the ideal
  // last line of defence when every Flash quota is exhausted.
  const TIER_LIMIT: Partial<Record<ModelTier, number>> = { flash: 5, "flash-lite": 3 };
  const seenBuckets = new Set<string>();
  const perTier = new Map<ModelTier, number>();
  const cascade: string[] = [];
  for (const m of eligible) {
    const bucket = `${m.tier}:${m.version ?? "alias"}`;
    const tierCount = perTier.get(m.tier) ?? 0;
    if (seenBuckets.has(bucket) || tierCount >= (TIER_LIMIT[m.tier] ?? 0)) continue;
    seenBuckets.add(bucket);
    perTier.set(m.tier, tierCount + 1);
    cascade.push(m.id);
    if (cascade.length >= MAX_CASCADE) break;
  }
  return cascade;
}

// ── Failure classification ───────────────────────────────────────────────
function extractMessage(err: unknown): string {
  if (err instanceof Error) return err.message || err.name;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && typeof (err as { message?: unknown }).message === "string") {
    return (err as { message: string }).message;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function extractStatus(err: unknown, message: string): number {
  if (err instanceof ApiError && typeof err.status === "number") return err.status;
  const e = err as { status?: unknown; code?: unknown; name?: unknown } | null;
  if (e && typeof e.status === "number") return e.status;
  if (e && typeof e.code === "number" && e.code >= 100 && e.code < 600) return e.code;
  if (e && (e.name === "AbortError" || e.name === "TimeoutError")) return 0;
  const jsonCode = message.match(/"code"\s*:\s*(\d{3})/);
  if (jsonCode) return Number(jsonCode[1]);
  if (/RESOURCE_EXHAUSTED/.test(message)) return 429;
  if (/UNAVAILABLE|overloaded/i.test(message)) return 503;
  if (/NOT_FOUND/.test(message)) return 404;
  return 0;
}

/** Parses google.rpc.RetryInfo `"retryDelay": "37s"` (or "Please retry in 12.5s"). */
export function parseRetryDelayMs(message: string): number | null {
  const m =
    message.match(/\\?"retryDelay\\?"\s*:\s*\\?"(\d+(?:\.\d+)?)s/) ?? message.match(/retry in (\d+(?:\.\d+)?)\s*s/i);
  if (!m) return null;
  const seconds = Number.parseFloat(m[1]);
  return Number.isFinite(seconds) ? Math.ceil(seconds * 1000) : null;
}

export function classifyFailure(err: unknown): ClassifiedFailure {
  const rawMessage = extractMessage(err);
  const message = sanitizeErrorMessage(rawMessage, 500) ?? "unknown error";
  const status = extractStatus(err, rawMessage);
  const retryAfterMs = parseRetryDelayMs(rawMessage);
  const base = getBaseCooldownMs();

  const make = (partial: Partial<ClassifiedFailure> & Pick<ClassifiedFailure, "kind">): ClassifiedFailure => ({
    status,
    message,
    baseCooldownMs: 0,
    retryAfterMs,
    fatal: false,
    unavailable: false,
    escalate: false,
    ...partial,
  });

  if (err instanceof GeminiNotConfiguredError) return make({ kind: "auth", fatal: true });
  if (/API[_ ]KEY[_ ]INVALID|API key not valid|API key expired|unregistered callers|API_KEY_SERVICE_BLOCKED/i.test(rawMessage)) {
    return make({ kind: "auth", fatal: true, status: status || 401 });
  }
  if (err instanceof ModelOutputError) return make({ kind: "bad_output", status: 422 });

  switch (true) {
    case status === 429: {
      if (/limit:\s*0\b|"quotaValue"\s*:\s*"0"/i.test(rawMessage)) {
        return make({ kind: "no_free_quota", baseCooldownMs: NO_FREE_QUOTA_COOLDOWN_MS });
      }
      if (/PerDay|per_day|per day|daily/i.test(rawMessage)) {
        return make({ kind: "daily_quota", baseCooldownMs: Math.max(retryAfterMs ?? 0, DAILY_QUOTA_COOLDOWN_MS) });
      }
      return make({ kind: "rate_limit", baseCooldownMs: Math.max(retryAfterMs ?? 0, base), escalate: true });
    }
    case status === 503:
      return make({ kind: "overloaded", baseCooldownMs: Math.max(retryAfterMs ?? 0, Math.round(base / 2)), escalate: true });
    case status === 500 || status === 502 || status === 504:
      return make({ kind: "server_error", baseCooldownMs: Math.round(base / 3), escalate: true });
    case status === 404:
      return make({ kind: "not_found", baseCooldownMs: NOT_FOUND_COOLDOWN_MS, unavailable: true });
    case status === 401:
      return make({ kind: "auth", fatal: true });
    case status === 403:
      return make({ kind: "forbidden", baseCooldownMs: FORBIDDEN_COOLDOWN_MS });
    case status === 400:
      return make({ kind: "bad_request" });
    case status === 0:
      return make({ kind: "timeout", baseCooldownMs: Math.round(base / 3), escalate: true });
    default:
      return make({ kind: "unknown", baseCooldownMs: Math.round(base / 3), escalate: true });
  }
}

// ── Circuit breaker bookkeeping ──────────────────────────────────────────
function getHealth(model: string): ModelHealth {
  let h = state.health.get(model);
  if (!h) {
    h = {
      model,
      consecutiveFailures: 0,
      cooldownUntil: 0,
      unavailable: false,
      lastStatus: null,
      lastFailureKind: null,
      lastError: null,
      lastLatencyMs: null,
      lastSuccessAt: null,
      lastFailureAt: null,
      successCount: 0,
      failureCount: 0,
    };
    state.health.set(model, h);
  }
  return h;
}

export function getModelState(model: string, now = Date.now()): ModelState {
  const h = state.health.get(model);
  if (!h || h.cooldownUntil <= now) return "ready"; // closed or half-open (trial allowed)
  return h.unavailable ? "unavailable" : "cooldown";
}

export function getModelHealth(model: string): ModelHealth | undefined {
  return state.health.get(model);
}

function recordSuccess(model: string, latencyMs: number) {
  const h = getHealth(model);
  h.consecutiveFailures = 0;
  h.cooldownUntil = 0;
  h.unavailable = false;
  h.lastStatus = 200;
  h.lastFailureKind = null;
  h.lastError = null;
  h.lastLatencyMs = latencyMs;
  h.lastSuccessAt = Date.now();
  h.successCount += 1;
}

/** Opens the breaker; returns the applied cooldown in ms. */
function recordFailure(model: string, failure: ClassifiedFailure, latencyMs: number | null, at = Date.now()): number {
  const h = getHealth(model);
  let cooldown = failure.baseCooldownMs;
  if (failure.escalate && cooldown > 0) {
    cooldown = Math.min(cooldown * 2 ** h.consecutiveFailures, MAX_ESCALATED_COOLDOWN_MS);
    cooldown = Math.max(cooldown, failure.retryAfterMs ?? 0);
  }
  if (cooldown > 0) h.consecutiveFailures += 1;
  h.cooldownUntil = cooldown > 0 ? Math.max(h.cooldownUntil, at + cooldown) : h.cooldownUntil;
  h.unavailable = failure.unavailable;
  h.lastStatus = failure.status;
  h.lastFailureKind = failure.kind;
  h.lastError = failure.message;
  h.lastLatencyMs = latencyMs;
  h.lastFailureAt = at;
  h.failureCount += 1;
  return cooldown;
}

function markUnavailable(model: string, reason: string) {
  recordFailure(model, {
    status: 404,
    kind: "not_found",
    message: reason,
    baseCooldownMs: NOT_FOUND_COOLDOWN_MS,
    retryAfterMs: null,
    fatal: false,
    unavailable: true,
    escalate: false,
  }, null);
}

/** Reset breakers (used by the dashboard "reset cooldown" action). */
export function resetCircuitBreakers(): void {
  state.health.clear();
}

/**
 * Cold-start hydration: serverless instances don't share memory, so the
 * latest telemetry row per model is replayed to re-open breakers that are
 * still inside their cooldown window.
 */
async function ensureHydrated(): Promise<void> {
  if (state.hydrated) return;
  if (!state.hydratePromise) {
    state.hydratePromise = (async () => {
      try {
        const rows = await getTelemetrySince(HYDRATION_WINDOW_MS, 400);
        const seen = new Set<string>();
        const now = Date.now();
        for (const row of rows) {
          if (seen.has(row.modelName)) continue;
          seen.add(row.modelName);
          if (row.statusCode === 200) continue;
          const failure = classifyFailure({ status: row.statusCode, message: row.errorMessage ?? "" });
          if (failure.baseCooldownMs <= 0) continue;
          const at = row.timestamp.getTime();
          if (at + failure.baseCooldownMs > now) recordFailure(row.modelName, failure, row.latencyMs, at);
        }
      } catch (err) {
        console.warn("[gemini-detector] telemetry hydration skipped:", (err as Error).message);
      } finally {
        state.hydrated = true;
      }
    })();
  }
  await state.hydratePromise;
}

// ── Dynamic discovery ────────────────────────────────────────────────────
function describeModels(ids: string[]): DiscoveredModel[] {
  return ids.map((id) => classifyModel(id));
}

async function probeModels(ai: GoogleGenAI, ids: string[]): Promise<string[]> {
  const results = await Promise.all(
    ids.map(async (id) => {
      try {
        await ai.models.get({ model: id });
        return id;
      } catch (err) {
        const failure = classifyFailure(err);
        if (failure.kind === "not_found") markUnavailable(id, "models.get → 404 (model tidak tersedia / sudah dimatikan)");
        return null;
      }
    }),
  );
  return results.filter((id): id is string => Boolean(id));
}

export async function discoverModels(force = false): Promise<DiscoveryResult> {
  if (!force && state.discovery && Date.now() - state.discovery.discoveredAt < DISCOVERY_TTL_MS) {
    return state.discovery;
  }
  if (state.discoveryPromise) return state.discoveryPromise;

  const run = async (): Promise<DiscoveryResult> => {
    const ai = getGeminiClient();
    const envOrder = parseEnvPriority();
    try {
      const pager = await ai.models.list({ config: { pageSize: 200 } });
      const found: DiscoveredModel[] = [];
      for await (const m of pager) {
        const id = normalizeModelId(m.name ?? "");
        if (!id.startsWith("gemini")) continue;
        const actions = m.supportedActions ?? [];
        if (actions.length > 0 && !actions.includes("generateContent")) continue;
        found.push({
          ...classifyModel(id),
          displayName: m.displayName,
          inputTokenLimit: m.inputTokenLimit,
          outputTokenLimit: m.outputTokenLimit,
        });
      }
      if (found.length === 0) throw new Error("models.list tidak mengembalikan model teks Gemini");

      const available = new Set(found.map((f) => f.id));
      for (const legacy of PRD_PRIORITY_CASCADE) {
        if (!available.has(legacy)) markUnavailable(legacy, "Tidak terdaftar di models.list untuk API key ini (kemungkinan sudah dimatikan Google)");
      }
      found.sort(compareModels);

      if (envOrder.length > 0) {
        const filtered = envOrder.filter((id) => available.has(id));
        return { source: "env", models: found, cascade: filtered.length ? filtered : envOrder, discoveredAt: Date.now() };
      }
      const cascade = rankCascade(found);
      if (cascade.length === 0) throw new Error("Tidak ada model Flash yang cocok untuk storytelling");
      return { source: "models.list", models: found, cascade, discoveredAt: Date.now() };
    } catch (err) {
      const failure = classifyFailure(err);
      if (failure.fatal) {
        return {
          source: "static",
          models: describeModels(envOrder.length ? envOrder : STATIC_SEED),
          cascade: envOrder.length ? envOrder : STATIC_SEED,
          discoveredAt: Date.now(),
          error: failure.message,
        };
      }
      const seeds = envOrder.length ? envOrder : STATIC_SEED;
      const alive = await probeModels(ai, seeds);
      return {
        source: alive.length ? "probe" : "static",
        models: describeModels(alive.length ? alive : seeds),
        cascade: alive.length ? alive : seeds,
        discoveredAt: Date.now(),
        error: failure.message,
      };
    }
  };

  const promise = run();
  state.discoveryPromise = promise;
  try {
    const result = await promise;
    state.discovery = result;
    return result;
  } finally {
    state.discoveryPromise = null;
  }
}

export async function getModelCascade(): Promise<string[]> {
  const discovery = await discoverModels();
  return discovery.cascade.slice(0, MAX_CASCADE);
}

/**
 * PRD Task 1.1 — returns the best model that is currently usable
 * (breaker closed / half-open), or `null` if every model is cooling down.
 */
export async function getOptimalModel(): Promise<string | null> {
  await ensureHydrated();
  const cascade = await getModelCascade();
  const now = Date.now();
  return cascade.find((m) => getModelState(m, now) === "ready") ?? null;
}

function msUntilSoonestRecovery(cascade: string[], now = Date.now()): number | null {
  let soonest: number | null = null;
  for (const model of cascade) {
    const h = state.health.get(model);
    if (!h || h.cooldownUntil <= now) return 0;
    if (h.unavailable) continue;
    const wait = h.cooldownUntil - now;
    soonest = soonest === null ? wait : Math.min(soonest, wait);
  }
  return soonest;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface FailoverOptions {
  requestId?: string;
  /** Max time to wait for a cooling model when the whole cascade is open. */
  maxWaitMs?: number;
  /** Overall deadline for the request (keeps serverless functions inside their limit). */
  deadlineMs?: number;
  maxPasses?: number;
}

/**
 * Executes `task(model)` against the cascade with transparent failover.
 * Never throws for a single-model failure — only when the cascade is exhausted.
 */
export async function runWithFailover<T>(
  task: (model: string, ctx: { deadline: number }) => Promise<T>,
  options: FailoverOptions = {},
): Promise<{ result: T; model: string; attempts: AttemptLog[] }> {
  getGeminiClient(); // fail fast when the key is missing
  await ensureHydrated();
  const cascade = await getModelCascade();
  const attempts: AttemptLog[] = [];
  // Default budget leaves room for rendering inside a 60s serverless function.
  const deadline = Date.now() + (options.deadlineMs ?? 48_000);
  const maxPasses = options.maxPasses ?? 3;
  const maxWait = options.maxWaitMs ?? 12_000;

  for (let pass = 0; pass < maxPasses; pass++) {
    for (const model of cascade) {
      if (Date.now() >= deadline) break;
      if (getModelState(model) !== "ready") continue;

      if (deadline - Date.now() < 5_000) break; // not enough budget for a meaningful attempt
      const started = Date.now();
      try {
        const result = await task(model, { deadline });
        const latency = Date.now() - started;
        recordSuccess(model, latency);
        attempts.push({ model, status: 200, kind: "ok", latencyMs: latency });
        void recordTelemetry({ modelName: model, statusCode: 200, latencyMs: latency, requestId: options.requestId });
        return { result, model, attempts };
      } catch (err) {
        const latency = Date.now() - started;
        const failure = classifyFailure(err);
        const cooldown = recordFailure(model, failure, latency);
        attempts.push({ model, status: failure.status, kind: failure.kind, latencyMs: latency, message: failure.message });
        void recordTelemetry({
          modelName: model,
          statusCode: failure.status,
          latencyMs: latency,
          errorMessage: `[${failure.kind}${cooldown ? ` · cooldown ${Math.round(cooldown / 1000)}s` : ""}] ${failure.message}`,
          requestId: options.requestId,
        });
        console.warn(`[gemini-detector] ${model} → ${failure.status} ${failure.kind}; failing over`);
        if (failure.fatal) {
          throw new GeminiCascadeError(`Gemini menolak kredensial (${failure.kind}): ${failure.message}`, attempts, true);
        }
      }
    }

    // Whole cascade is cooling down → exponential backoff until the soonest breaker half-opens.
    const soonest = msUntilSoonestRecovery(cascade);
    if (soonest === null) break;
    const backoff = Math.max(soonest, 500 * 2 ** pass) + Math.floor(Math.random() * 250);
    if (backoff > maxWait || Date.now() + backoff >= deadline) break;
    await sleep(backoff);
  }

  throw new GeminiCascadeError(
    attempts.length
      ? `Semua model di cascade gagal / cooldown (${attempts.map((a) => `${a.model}:${a.status}`).join(", ")})`
      : "Semua model di cascade sedang cooldown",
    attempts,
  );
}

// ── Snapshot for the dashboard ───────────────────────────────────────────
export interface EngineSnapshot {
  configured: boolean;
  discoverySource: DiscoveryResult["source"] | null;
  discoveredAt: number | null;
  discoveredModels: string[];
  discoveryError: string | null;
  optimalModel: string | null;
  baseCooldownSeconds: number;
  prdCascade: string[];
  cascade: Array<{
    model: string;
    rank: number;
    state: ModelState;
    cooldownRemainingMs: number;
    lastStatus: number | null;
    lastFailureKind: FailureKind | null;
    lastError: string | null;
    lastLatencyMs: number | null;
    successCount: number;
    failureCount: number;
    lastSuccessAt: number | null;
  }>;
}

export async function getEngineSnapshot(options: { discover?: boolean; force?: boolean } = {}): Promise<EngineSnapshot> {
  const configured = isGeminiConfigured();
  let discoveryError: string | null = null;
  if (configured && options.discover) {
    try {
      await ensureHydrated();
      await discoverModels(options.force);
    } catch (err) {
      discoveryError = sanitizeErrorMessage(extractMessage(err));
    }
  }
  const discovery = state.discovery;
  const envOrder = parseEnvPriority();
  const cascadeIds = discovery?.cascade ?? (envOrder.length ? envOrder : STATIC_SEED);
  const now = Date.now();
  const cascade = cascadeIds.slice(0, MAX_CASCADE).map((model, i) => {
    const h = state.health.get(model);
    return {
      model,
      rank: i + 1,
      state: getModelState(model, now),
      cooldownRemainingMs: h ? Math.max(0, h.cooldownUntil - now) : 0,
      lastStatus: h?.lastStatus ?? null,
      lastFailureKind: h?.lastFailureKind ?? null,
      lastError: h?.lastError ?? null,
      lastLatencyMs: h?.lastLatencyMs ?? null,
      successCount: h?.successCount ?? 0,
      failureCount: h?.failureCount ?? 0,
      lastSuccessAt: h?.lastSuccessAt ?? null,
    };
  });
  return {
    configured,
    discoverySource: discovery?.source ?? null,
    discoveredAt: discovery?.discoveredAt ?? null,
    discoveredModels: discovery?.models.filter((m) => !EXCLUDE_PATTERN.test(m.id)).map((m) => m.id).slice(0, 24) ?? [],
    discoveryError: discoveryError ?? discovery?.error ?? null,
    optimalModel: configured ? (cascade.find((m) => m.state === "ready")?.model ?? null) : null,
    baseCooldownSeconds: Math.round(getBaseCooldownMs() / 1000),
    prdCascade: [...PRD_PRIORITY_CASCADE],
    cascade,
  };
}

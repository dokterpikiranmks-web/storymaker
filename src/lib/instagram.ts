import "server-only";

/**
 * Meta Graph API — Instagram Content Publishing for Stories (PRD Task 5.2).
 * Flow: create container (media_type=STORIES) → poll status_code → media_publish.
 * Requirements: Instagram Business/Creator account, long-lived token with
 * instagram_content_publish (or instagram_business_content_publish), and a
 * PUBLIC HTTPS JPEG image URL (Meta downloads the file itself).
 */

export interface InstagramConfig {
  userId: string;
  token: string;
  host: string;
  version: string;
}

export function getInstagramConfig(): InstagramConfig | null {
  const userId = process.env.IG_USER_ID?.trim();
  const token = process.env.IG_ACCESS_TOKEN?.trim();
  if (!userId || !token) return null;
  return {
    userId,
    token,
    host: (process.env.IG_GRAPH_HOST?.trim() || "graph.instagram.com").replace(/^https?:\/\//, "").replace(/\/+$/, ""),
    version: process.env.META_GRAPH_API_VERSION?.trim() || "v24.0",
  };
}

export function isInstagramConfigured(): boolean {
  return getInstagramConfig() !== null;
}

interface GraphResponse {
  id?: string;
  status_code?: string;
  status?: string;
  error?: { message?: string; type?: string; code?: number; error_subcode?: number; fbtrace_id?: string };
}

async function graphRequest(url: string, init: RequestInit, token: string): Promise<GraphResponse> {
  const res = await fetch(url, {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const json = (await res.json().catch(() => ({}))) as GraphResponse;
  if (!res.ok || json.error) {
    const e = json.error;
    throw new Error(
      `Meta Graph API ${res.status}${e?.code ? ` (code ${e.code}${e.error_subcode ? `/${e.error_subcode}` : ""})` : ""}: ${e?.message ?? res.statusText}`,
    );
  }
  return json;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function publishInstagramStory(imageUrl: string): Promise<{ containerId: string; mediaId: string }> {
  const cfg = getInstagramConfig();
  if (!cfg) throw new Error("Instagram belum dikonfigurasi (IG_USER_ID / IG_ACCESS_TOKEN)");
  const base = `https://${cfg.host}/${cfg.version}`;

  const created = await graphRequest(
    `${base}/${encodeURIComponent(cfg.userId)}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ image_url: imageUrl, media_type: "STORIES", access_token: cfg.token }),
    },
    cfg.token,
  );
  if (!created.id) throw new Error("Meta tidak mengembalikan container id");
  const containerId = created.id;

  for (let attempt = 0; attempt < 12; attempt++) {
    const status = await graphRequest(
      `${base}/${encodeURIComponent(containerId)}?fields=status_code,status&access_token=${encodeURIComponent(cfg.token)}`,
      { method: "GET" },
      cfg.token,
    );
    if (status.status_code === "FINISHED") break;
    if (status.status_code === "ERROR" || status.status_code === "EXPIRED") {
      throw new Error(`Container Instagram ${status.status_code}: ${status.status ?? "tanpa detail"}`);
    }
    if (attempt === 11) throw new Error("Timeout menunggu container Instagram siap");
    await sleep(1_500);
  }

  const published = await graphRequest(
    `${base}/${encodeURIComponent(cfg.userId)}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ creation_id: containerId, access_token: cfg.token }),
    },
    cfg.token,
  );
  if (!published.id) throw new Error("Meta tidak mengembalikan media id setelah publish");
  return { containerId, mediaId: published.id };
}

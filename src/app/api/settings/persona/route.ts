import { handleRouteError, jsonError, jsonOk, readJson, requireDashboard } from "@/lib/api";
import { getPersona, savePersona } from "@/lib/settings";
import { personaSchema, zodMessage } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await requireDashboard(req);
  if (denied) return denied;
  try {
    return jsonOk({ persona: await getPersona() });
  } catch (err) {
    return handleRouteError(err, "persona:get");
  }
}

export async function PUT(req: Request) {
  const denied = await requireDashboard(req);
  if (denied) return denied;
  const parsed = personaSchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError(zodMessage(parsed.error), 400);
  try {
    return jsonOk({ persona: await savePersona(parsed.data) });
  } catch (err) {
    return handleRouteError(err, "persona:put");
  }
}

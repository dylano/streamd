// Must match ADMIN_NAME in src/utils/admin.ts
const ADMIN_NAME = "doliver";

interface Env {
  DB: D1Database;
}

export async function requireAdmin(
  context: EventContext<Env, string, unknown>,
): Promise<Response | null> {
  const userId = context.request.headers.get("X-User-Id");
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await context.env.DB.prepare("SELECT name FROM users WHERE id = ?")
    .bind(userId)
    .first<{ name: string }>();

  if (!user || user.name.toLowerCase() !== ADMIN_NAME) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return null; // authorized
}

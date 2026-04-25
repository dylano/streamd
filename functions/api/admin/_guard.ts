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

  const user = await context.env.DB.prepare("SELECT is_admin FROM users WHERE id = ?")
    .bind(userId)
    .first<{ is_admin: number }>();

  if (!user || !user.is_admin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return null; // authorized
}

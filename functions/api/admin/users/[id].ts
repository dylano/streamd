import { requireAdmin } from "../_guard";

interface Env {
  DB: D1Database;
}

export const onRequestDelete: PagesFunction<Env, "id"> = async (context) => {
  const denied = await requireAdmin(context);
  if (denied) return denied;

  const targetId = Number(context.params.id);
  const requesterId = Number(context.request.headers.get("X-User-Id"));

  if (targetId === requesterId) {
    return Response.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  // CASCADE deletes handle user_shows and user_episodes
  const result = await context.env.DB.prepare("DELETE FROM users WHERE id = ?")
    .bind(targetId)
    .run();

  if (!result.meta.changes) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json({ ok: true });
};

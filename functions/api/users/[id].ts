interface Env {
  DB: D1Database;
}

interface User {
  id: number;
  name: string;
  is_admin: number;
}

// GET /api/users/:id - Validate a user ID exists
export const onRequestGet: PagesFunction<Env, "id"> = async (context) => {
  const id = String(context.params.id);

  const user = await context.env.DB.prepare("SELECT id, name, is_admin FROM users WHERE id = ?")
    .bind(id)
    .first<User>();

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json({ id: user.id, name: user.name, isAdmin: !!user.is_admin });
};

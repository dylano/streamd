interface Env {
  DB: D1Database;
}

interface User {
  id: number;
  name: string;
}

// GET /api/users/:id - Validate a user ID exists
export const onRequestGet: PagesFunction<Env, "id"> = async (context) => {
  const id = String(context.params.id);

  const user = await context.env.DB.prepare("SELECT id, name FROM users WHERE id = ?")
    .bind(id)
    .first<User>();

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json(user);
};

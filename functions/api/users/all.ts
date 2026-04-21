interface Env {
  DB: D1Database;
}

// GET /api/users/all - List all users
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const result = await context.env.DB.prepare(
      "SELECT id, name FROM users ORDER BY name COLLATE NOCASE",
    ).all<{ id: number; name: string }>();

    return Response.json(result.results);
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
};

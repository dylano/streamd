interface Env {
  DB: D1Database;
}

interface User {
  id: number;
  name: string;
  is_admin: number;
  created_at: string;
}

// GET /api/users?name=X - Look up a user by name
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const name = url.searchParams.get("name");

  if (!name) {
    return Response.json({ error: "name parameter is required" }, { status: 400 });
  }

  const user = await context.env.DB.prepare("SELECT id, name, is_admin FROM users WHERE name = ?")
    .bind(name)
    .first<User>();

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json({ id: user.id, name: user.name, isAdmin: !!user.is_admin });
};

// POST /api/users - Create a new user
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = await context.request.json<{ name: string }>();

  if (!body.name?.trim()) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  const name = body.name.trim();

  // Check if user already exists (COLLATE NOCASE handles case-insensitive matching)
  const existing = await context.env.DB.prepare("SELECT id, name FROM users WHERE name = ?")
    .bind(name)
    .first<User>();

  if (existing) {
    return Response.json({ error: "User already exists" }, { status: 409 });
  }

  await context.env.DB.prepare("INSERT INTO users (name) VALUES (?)").bind(name).run();

  const user = await context.env.DB.prepare("SELECT id, name, is_admin FROM users WHERE name = ?")
    .bind(name)
    .first<User>();

  if (!user) {
    return Response.json({ error: "Failed to create user" }, { status: 500 });
  }

  return Response.json({ id: user.id, name: user.name, isAdmin: !!user.is_admin }, { status: 201 });
};

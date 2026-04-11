interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;

  // Delete in order respecting foreign keys
  await db.prepare("DELETE FROM user_episodes").run();
  await db.prepare("DELETE FROM user_shows").run();
  await db.prepare("DELETE FROM episodes").run();
  await db.prepare("DELETE FROM shows").run();
  await db.prepare("DELETE FROM users").run();

  return Response.json({ success: true, message: "Database reset complete" });
};

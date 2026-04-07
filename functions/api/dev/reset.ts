interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;

  // Delete all episodes first (foreign key constraint)
  await db.prepare("DELETE FROM episodes").run();
  // Delete all shows
  await db.prepare("DELETE FROM shows").run();

  return Response.json({ success: true, message: "Database reset complete" });
};

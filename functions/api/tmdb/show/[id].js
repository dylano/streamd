const TMDB_BASE = "https://api.themoviedb.org/3";
// GET /api/tmdb/show/:id - Get show details from TMDB
export const onRequestGet = async (context) => {
  const id = context.params.id;
  const cacheKey = `show:${id}`;
  const cached = await context.env.DB.prepare(
    "SELECT data FROM tmdb_cache WHERE cache_key = ? AND expires_at > datetime('now')",
  )
    .bind(cacheKey)
    .first();
  if (cached) {
    return Response.json(JSON.parse(cached.data));
  }
  const tmdbUrl = `${TMDB_BASE}/tv/${id}?api_key=${context.env.TMDB_API_KEY}`;
  const res = await fetch(tmdbUrl);
  if (!res.ok) {
    if (res.status === 404) {
      return Response.json({ error: "Show not found on TMDB" }, { status: 404 });
    }
    return Response.json({ error: "TMDB request failed" }, { status: res.status });
  }
  const data = await res.json();
  // Cache for 24 hours
  await context.env.DB.prepare(
    "INSERT OR REPLACE INTO tmdb_cache (cache_key, data, expires_at) VALUES (?, ?, datetime('now', '+24 hours'))",
  )
    .bind(cacheKey, JSON.stringify(data))
    .run();
  return Response.json(data);
};

const TMDB_BASE = "https://api.themoviedb.org/3";
// GET /api/tmdb/search?query=...
export const onRequestGet = async (context) => {
  const url = new URL(context.request.url);
  const query = url.searchParams.get("query");
  if (!query) {
    return Response.json({ error: "query parameter is required" }, { status: 400 });
  }
  const cacheKey = `search:${query}`;
  const cached = await context.env.DB.prepare(
    "SELECT data FROM tmdb_cache WHERE cache_key = ? AND expires_at > datetime('now')",
  )
    .bind(cacheKey)
    .first();
  if (cached) {
    return Response.json(JSON.parse(cached.data));
  }
  const tmdbUrl = `${TMDB_BASE}/search/tv?api_key=${context.env.TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
  const res = await fetch(tmdbUrl);
  if (!res.ok) {
    return Response.json({ error: "TMDB request failed" }, { status: res.status });
  }
  const data = await res.json();
  // Cache for 1 hour
  await context.env.DB.prepare(
    "INSERT OR REPLACE INTO tmdb_cache (cache_key, data, expires_at) VALUES (?, ?, datetime('now', '+1 hour'))",
  )
    .bind(cacheKey, JSON.stringify(data))
    .run();
  return Response.json(data);
};

interface Env {
  DB: D1Database;
  TMDB_API_KEY: string;
}

const TMDB_BASE = "https://api.themoviedb.org/3";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const tmdbUrl = `${TMDB_BASE}/trending/tv/week?api_key=${context.env.TMDB_API_KEY}`;

  const response = await fetch(tmdbUrl);
  if (!response.ok) {
    return Response.json({ error: "Failed to fetch trending shows" }, { status: response.status });
  }

  const data = await response.json();
  return Response.json(data);
};

interface Env {
  DB: D1Database;
  TMDB_API_KEY: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
};

// Paths that don't require user identification
const publicPrefixes = ["/api/users", "/api/tmdb", "/api/health", "/api/dev"];

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only enforce user identification on protected API routes
  const url = new URL(context.request.url);
  const isApi = url.pathname.startsWith("/api/");
  const isPublicApi = publicPrefixes.some((prefix) => url.pathname.startsWith(prefix));

  if (isApi && !isPublicApi) {
    const userIdHeader = context.request.headers.get("X-User-Id");
    if (!userIdHeader) {
      return Response.json({ error: "User identification required" }, { status: 401 });
    }
    const userId = parseInt(userIdHeader, 10);
    if (isNaN(userId)) {
      return Response.json({ error: "Invalid user ID" }, { status: 400 });
    }
    context.data = { ...context.data, userId };
  }

  const response = await context.next();

  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
};

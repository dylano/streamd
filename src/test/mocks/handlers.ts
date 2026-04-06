import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/health", () => {
    return HttpResponse.json({
      status: "mock",
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        showCount: 0,
      },
    });
  }),
];

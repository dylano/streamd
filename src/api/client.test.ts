import { describe, it, expect } from "vite-plus/test";
import { http, HttpResponse } from "msw";
import { server } from "../test/mocks/server";
import { api, ApiError } from "./client";

describe("api client", () => {
  describe("get", () => {
    it("fetches data successfully", async () => {
      server.use(
        http.get("/api/test", () => {
          return HttpResponse.json({ message: "success" });
        }),
      );

      const result = await api.get<{ message: string }>("/test");
      expect(result.message).toBe("success");
    });

    it("throws ApiError on failure", async () => {
      server.use(
        http.get("/api/test", () => {
          return HttpResponse.json({ error: "Not found" }, { status: 404 });
        }),
      );

      await expect(api.get("/test")).rejects.toThrow(ApiError);
      await expect(api.get("/test")).rejects.toMatchObject({
        status: 404,
        message: "Not found",
      });
    });
  });

  describe("post", () => {
    it("posts data successfully", async () => {
      server.use(
        http.post("/api/items", async ({ request }) => {
          const body = (await request.json()) as { name: string };
          return HttpResponse.json({ id: 1, name: body.name }, { status: 201 });
        }),
      );

      const result = await api.post<{ id: number; name: string }>("/items", {
        name: "test",
      });
      expect(result.id).toBe(1);
      expect(result.name).toBe("test");
    });
  });

  describe("put", () => {
    it("updates data successfully", async () => {
      server.use(
        http.put("/api/items/1", async ({ request }) => {
          const body = (await request.json()) as { name: string };
          return HttpResponse.json({ id: 1, name: body.name });
        }),
      );

      const result = await api.put<{ id: number; name: string }>("/items/1", {
        name: "updated",
      });
      expect(result.name).toBe("updated");
    });
  });

  describe("delete", () => {
    it("deletes data successfully", async () => {
      server.use(
        http.delete("/api/items/1", () => {
          return HttpResponse.json({ success: true });
        }),
      );

      const result = await api.delete<{ success: boolean }>("/items/1");
      expect(result.success).toBe(true);
    });
  });
});

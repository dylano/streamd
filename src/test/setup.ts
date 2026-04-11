import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, beforeEach } from "vite-plus/test";
import { server } from "./mocks/server";
import { mockUser } from "./mocks/handlers";
import { setApiUserId } from "../api/client";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

beforeEach(() => {
  // Seed localStorage with mock user so UserProvider resolves immediately
  localStorage.setItem("streamd-user", JSON.stringify(mockUser));
  // Set the API user ID so all requests include the X-User-Id header
  setApiUserId(mockUser.id);
});

afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
  setApiUserId(null);
});

afterAll(() => server.close());

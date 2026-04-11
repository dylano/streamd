import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vite-plus/test";
import App from "./App";

describe("App", () => {
  it("renders the app after user validation", async () => {
    render(<App />);

    // UserGate validates the stored user, then renders children
    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "My Shows" })).toBeInTheDocument();
    });
  });
});

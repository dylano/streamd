import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vite-plus/test";
import App from "./App";

describe("App", () => {
  it("renders the title", () => {
    render(<App />);
    expect(screen.getByText("StreamD")).toBeInTheDocument();
  });

  it("renders navigation links", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Watchlist" })).toBeInTheDocument();
    });
  });

  it("renders TMDB attribution footer", () => {
    render(<App />);
    expect(screen.getByText(/TMDB API/)).toBeInTheDocument();
  });
});

import { describe, it, expect } from "vite-plus/test";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "../test/mocks/server";
import { UserProvider } from "../context/UserContext";
import { ShowsProvider } from "../context/ShowsContext";
import { SettingsProvider } from "../context/SettingsContext";
import { Search } from "./Search";

function renderSearch() {
  return render(
    <MemoryRouter>
      <UserProvider>
        <SettingsProvider>
          <ShowsProvider>
            <Search />
          </ShowsProvider>
        </SettingsProvider>
      </UserProvider>
    </MemoryRouter>,
  );
}

describe("Search", () => {
  it("renders search page with input", () => {
    renderSearch();

    expect(screen.getByRole("heading", { name: "Search Shows" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search for a TV show...")).toBeInTheDocument();
  });

  it("searches and displays results after typing", async () => {
    const user = userEvent.setup();
    renderSearch();

    const input = screen.getByPlaceholderText("Search for a TV show...");
    await user.type(input, "Breaking Bad");

    await waitFor(() => {
      expect(screen.getByText("Breaking Bad Show")).toBeInTheDocument();
    });
  });

  it("shows no results message", async () => {
    server.use(
      http.get("/api/tmdb/search", () => {
        return HttpResponse.json({ page: 1, results: [], total_pages: 0, total_results: 0 });
      }),
    );

    const user = userEvent.setup();
    renderSearch();

    const input = screen.getByPlaceholderText("Search for a TV show...");
    await user.type(input, "xyznotfound");

    await waitFor(() => {
      expect(screen.getByText(/No results found/)).toBeInTheDocument();
    });
  });

  it("shows error on API failure", async () => {
    server.use(
      http.get("/api/tmdb/search", () => {
        return HttpResponse.json({ error: "Search failed" }, { status: 500 });
      }),
    );

    const user = userEvent.setup();
    renderSearch();

    const input = screen.getByPlaceholderText("Search for a TV show...");
    await user.type(input, "test");

    await waitFor(() => {
      expect(screen.getByText(/Search failed|Failed/i)).toBeInTheDocument();
    });
  });
});

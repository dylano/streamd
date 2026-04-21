import { describe, it, expect } from "vite-plus/test";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "../test/mocks/server";
import { UserProvider } from "../context/UserContext";
import { ShowsProvider } from "../context/ShowsContext";
import { SettingsProvider } from "../context/SettingsContext";
import { Watchlist } from "./Watchlist";

function renderWatchlist() {
  return render(
    <MemoryRouter>
      <UserProvider>
        <SettingsProvider>
          <ShowsProvider>
            <Watchlist />
          </ShowsProvider>
        </SettingsProvider>
      </UserProvider>
    </MemoryRouter>,
  );
}

describe("Watchlist", () => {
  it("shows loading state initially", () => {
    renderWatchlist();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders shows sorted alphabetically", async () => {
    renderWatchlist();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    const showNames = screen.getAllByRole("heading").map((h) => h.textContent);
    const scrubsIdx = showNames.indexOf("Scrubs");
    const tbbtIdx = showNames.indexOf("The Big Bang Theory");
    expect(scrubsIdx).toBeLessThan(tbbtIdx);
  });

  it("shows empty message when no shows", async () => {
    server.use(
      http.get("/api/shows", () => {
        return HttpResponse.json([]);
      }),
    );

    renderWatchlist();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("No shows yet. Search above to add some!")).toBeInTheDocument();
  });

  it("links show cards to detail pages", async () => {
    renderWatchlist();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    const scrubsLink = screen.getByRole("link", { name: /Scrubs/ });
    expect(scrubsLink).toHaveAttribute("href", "/show/1");
  });

  it("renders search component", async () => {
    renderWatchlist();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it("renders social link", async () => {
    renderWatchlist();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("What's everyone else watching?")).toBeInTheDocument();
  });

  it("opens social dialog when clicking the link", async () => {
    const user = userEvent.setup();
    renderWatchlist();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    await user.click(screen.getByText("What's everyone else watching?"));

    await waitFor(() => {
      expect(screen.getByText("Browse Users")).toBeInTheDocument();
    });
  });
});

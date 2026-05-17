import { describe, it, expect, vi, afterEach } from "vite-plus/test";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "../test/mocks/server";
import { UserProvider } from "../context/UserContext";
import { ShowsProvider } from "../context/ShowsContext";
import { SettingsProvider } from "../context/SettingsContext";
import { ShowDetail } from "./ShowDetail";

afterEach(() => {
  vi.restoreAllMocks();
});

function renderShowDetail(showId = "1") {
  return render(
    <MemoryRouter initialEntries={[`/show/${showId}`]}>
      <UserProvider>
        <SettingsProvider>
          <ShowsProvider>
            <Routes>
              <Route path="/show/:id" element={<ShowDetail />} />
              <Route path="/watchlist" element={<div>Watchlist Page</div>} />
            </Routes>
          </ShowsProvider>
        </SettingsProvider>
      </UserProvider>
    </MemoryRouter>,
  );
}

describe("ShowDetail", () => {
  it("shows 'not found' for unknown show", async () => {
    renderShowDetail("999");

    await waitFor(() => {
      expect(screen.getByText("Show not found")).toBeInTheDocument();
    });
  });

  it("renders show details", async () => {
    renderShowDetail("1");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Scrubs" })).toBeInTheDocument();
    });

    expect(screen.getByText("2001")).toBeInTheDocument();
    expect(screen.getByText(/A comedy about hospital life/)).toBeInTheDocument();
  });

  it("displays season tabs", async () => {
    renderShowDetail("1");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Scrubs" })).toBeInTheDocument();
    });

    // TMDB mock returns 3 seasons
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "S1" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "S2" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "S3" })).toBeInTheDocument();
    });
  });

  it("shows sync button for seasons", async () => {
    renderShowDetail("1");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sync Episodes" })).toBeInTheDocument();
    });
  });

  it("switches seasons when tab clicked", async () => {
    const user = userEvent.setup();
    renderShowDetail("1");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "S1" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "S1" }));
    expect(screen.getByText("Season 1")).toBeInTheDocument();
  });

  it("shows streaming provider icon", async () => {
    renderShowDetail("1");

    await waitFor(() => {
      expect(screen.getByAltText("Hulu")).toBeInTheDocument();
    });
  });

  it("navigates to watchlist after delete", async () => {
    const user = userEvent.setup();

    server.use(
      http.delete("/api/shows/1", () => {
        return HttpResponse.json({ success: true });
      }),
    );

    renderShowDetail("1");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Scrubs" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Delete Show" }));

    await waitFor(() => {
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Completely remove "Scrubs" from your account\?/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => {
      expect(screen.getByText("Watchlist Page")).toBeInTheDocument();
    });
  });

  it("shows Resume Watching button when show is deactivated", async () => {
    server.use(
      http.get("/api/shows", () => {
        return HttpResponse.json([
          {
            id: 1,
            tmdb_id: 4556,
            name: "Scrubs",
            poster_path: "/scrubs.jpg",
            overview: "A comedy about hospital life",
            first_air_date: "2001-10-02",
            status: "deactivated",
            streaming_service: null,
            total_seasons: 9,
            total_episodes: 182,
            current_season: 1,
            current_episode: 6,
            rating: null,
            added_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        ]);
      }),
    );

    renderShowDetail("1");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Scrubs" })).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Resume Watching" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Stop Watching" })).not.toBeInTheDocument();
  });

  it("navigates to watchlist after deactivating a show", async () => {
    const user = userEvent.setup();

    server.use(
      http.put("/api/shows/1", async () => {
        return HttpResponse.json({
          id: 1,
          tmdb_id: 4556,
          name: "Scrubs",
          poster_path: "/scrubs.jpg",
          overview: "A comedy about hospital life",
          first_air_date: "2001-10-02",
          status: "deactivated",
          streaming_service: null,
          total_seasons: 9,
          total_episodes: 182,
          current_season: 1,
          current_episode: 6,
          rating: null,
          added_at: "2024-01-01T00:00:00Z",
          updated_at: new Date().toISOString(),
        });
      }),
    );

    renderShowDetail("1");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Scrubs" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Stop Watching" }));

    await waitFor(() => {
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Remove "Scrubs" episodes from your dashboard\?/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => {
      expect(screen.getByText("Watchlist Page")).toBeInTheDocument();
    });
  });
});

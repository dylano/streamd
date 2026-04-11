import { describe, it, expect } from "vite-plus/test";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "../test/mocks/server";
import { mockUnwatchedEpisodes } from "../test/mocks/handlers";
import { SettingsProvider } from "../context/SettingsContext";
import { Dashboard } from "./Dashboard";

function renderDashboard() {
  return render(
    <MemoryRouter>
      <SettingsProvider>
        <Dashboard />
      </SettingsProvider>
    </MemoryRouter>,
  );
}

describe("Dashboard", () => {
  it("shows loading state initially", () => {
    renderDashboard();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders Next Up section with episodes", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: "Next Up" })).toBeInTheDocument();
    // Scrubs appears twice (Next Up and Additional Episodes), so use getAllByText
    expect(screen.getAllByText("Scrubs").length).toBeGreaterThan(0);
    expect(screen.getByText("The Big Bang Theory")).toBeInTheDocument();
  });

  it("displays episode info correctly", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    // Check for episode format like "1×06"
    expect(screen.getByText(/1×06/)).toBeInTheDocument();
    expect(screen.getByText(/My Bad/)).toBeInTheDocument();
  });

  it("shows streaming provider icons when available", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    // Provider icons show as img elements with alt text
    expect(screen.getByAltText("Hulu")).toBeInTheDocument();
    expect(screen.getByAltText("Max")).toBeInTheDocument();
  });

  it("shows Additional Episodes section when there are more episodes", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Additional Episodes")).toBeInTheDocument();
    expect(screen.getByText(/\+1 more/)).toBeInTheDocument();
  });

  it("marks episode as watched when button clicked", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    // Find buttons with title "Mark as watched"
    const watchButtons = screen.getAllByTitle("Mark as watched");
    await user.click(watchButtons[0]);

    // Episode should be removed from the list after marking watched
    await waitFor(() => {
      expect(screen.queryByText("My Bad")).not.toBeInTheDocument();
    });
  });

  it("sends timezone query param", async () => {
    let capturedUrl = "";
    server.use(
      http.get("/api/episodes/unwatched", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockUnwatchedEpisodes);
      }),
    );

    renderDashboard();

    await waitFor(() => {
      expect(capturedUrl).toContain("tz=");
    });

    const url = new URL(capturedUrl);
    const tz = url.searchParams.get("tz");
    // Should be a valid IANA timezone
    expect(tz).toBeTruthy();
    expect(tz).toContain("/");
  });

  it("sorts Additional Episodes alphabetically by show name", async () => {
    server.use(
      http.get("/api/episodes/unwatched", () => {
        return HttpResponse.json([
          {
            id: 1,
            show_id: 1,
            show_name: "Zebra Show",
            show_poster_path: null,
            show_network: null,
            show_current_season: 1,
            show_current_episode: 1,
            tmdb_id: 1,
            season_number: 1,
            episode_number: 1,
            name: "Pilot",
            air_date: "2024-01-01",
            runtime: 22,
          },
          {
            id: 2,
            show_id: 1,
            show_name: "Zebra Show",
            show_poster_path: null,
            show_network: null,
            show_current_season: 1,
            show_current_episode: 1,
            tmdb_id: 2,
            season_number: 1,
            episode_number: 2,
            name: "Second",
            air_date: "2024-01-08",
            runtime: 22,
          },
          {
            id: 3,
            show_id: 2,
            show_name: "Alpha Show",
            show_poster_path: null,
            show_network: null,
            show_current_season: 1,
            show_current_episode: 1,
            tmdb_id: 3,
            season_number: 1,
            episode_number: 1,
            name: "Start",
            air_date: "2024-02-01",
            runtime: 22,
          },
          {
            id: 4,
            show_id: 2,
            show_name: "Alpha Show",
            show_poster_path: null,
            show_network: null,
            show_current_season: 1,
            show_current_episode: 1,
            tmdb_id: 4,
            season_number: 1,
            episode_number: 2,
            name: "Continue",
            air_date: "2024-02-08",
            runtime: 22,
          },
        ]);
      }),
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Additional Episodes")).toBeInTheDocument();
    });

    // Alpha Show should come before Zebra Show
    const section = screen.getByText("Additional Episodes").parentElement!;
    const names = section.querySelectorAll("summary");
    expect(names[0]).toHaveTextContent("Alpha Show");
    expect(names[1]).toHaveTextContent("Zebra Show");
  });

  it("shows empty state when no episodes", async () => {
    server.use(
      http.get("/api/episodes/unwatched", () => {
        return HttpResponse.json([]);
      }),
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
    expect(screen.getByText("Add shows to track")).toBeInTheDocument();
  });

  it("shows error state on API failure", async () => {
    server.use(
      http.get("/api/episodes/unwatched", () => {
        return HttpResponse.json({ error: "Server error" }, { status: 500 });
      }),
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    // The ApiError class sets message to the error from JSON response
    expect(screen.getByText(/Server error|Failed to load/i)).toBeInTheDocument();
  });

  it("uses bookmark to determine Next Up episode", async () => {
    // Mock with specific bookmark values - bookmark points to E7, so that's Next Up
    server.use(
      http.get("/api/episodes/unwatched", () => {
        return HttpResponse.json([
          {
            id: 1,
            show_id: 1,
            show_name: "Test Show",
            show_poster_path: "/test.jpg",
            show_network: "Test Network",
            show_current_season: 1,
            show_current_episode: 7, // Bookmark points to E7
            season_number: 1,
            episode_number: 6,
            name: "Episode Six",
            air_date: "2024-01-06",
            runtime: 22,
          },
          {
            id: 2,
            show_id: 1,
            show_name: "Test Show",
            show_poster_path: "/test.jpg",
            show_network: "Test Network",
            show_current_season: 1,
            show_current_episode: 7,
            season_number: 1,
            episode_number: 7,
            name: "Episode Seven",
            air_date: "2024-01-13",
            runtime: 22,
          },
        ]);
      }),
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    // The Next Up should be Episode Seven (matching the bookmark)
    const nextUpSection = screen.getByRole("heading", { name: "Next Up" }).parentElement;
    expect(nextUpSection).toHaveTextContent("Episode Seven");
  });

  it("links to show detail page", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    const showLinks = screen.getAllByRole("link");
    const scrubsLink = showLinks.find((link) => link.textContent?.includes("Scrubs"));
    expect(scrubsLink).toHaveAttribute("href", "/show/1");
  });
});

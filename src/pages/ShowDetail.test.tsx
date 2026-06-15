import { describe, it, expect, vi, afterEach } from "vite-plus/test";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
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

function swipe(el: HTMLElement, startX: number, endX: number, startY = 200, endY = 200) {
  el.dispatchEvent(
    new TouchEvent("touchstart", {
      touches: [{ clientX: startX, clientY: startY } as Touch],
    }),
  );
  el.dispatchEvent(
    new TouchEvent("touchend", {
      changedTouches: [{ clientX: endX, clientY: endY } as Touch],
    }),
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
      screen.getByText(/Delete "Scrubs" from your account\?/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));

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

  // Mock shows sort alphabetically (ignoring leading "the"):
  // "The Big Bang Theory" (id 2) -> "Scrubs" (id 1)
  it("swipes left to the next show", async () => {
    const { container } = renderShowDetail("2");

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "The Big Bang Theory" }),
      ).toBeInTheDocument();
    });

    swipe(container.firstChild as HTMLElement, 300, 100);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Scrubs" })).toBeInTheDocument();
    });
  });

  it("swipes right to the previous show", async () => {
    const { container } = renderShowDetail("1");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Scrubs" })).toBeInTheDocument();
    });

    swipe(container.firstChild as HTMLElement, 100, 300);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "The Big Bang Theory" }),
      ).toBeInTheDocument();
    });
  });

  it("does not swipe past the last show", async () => {
    const { container } = renderShowDetail("1");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Scrubs" })).toBeInTheDocument();
    });

    // Scrubs is last in sort order; swiping left should stay put
    swipe(container.firstChild as HTMLElement, 300, 100);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Scrubs" })).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("heading", { name: "The Big Bang Theory" }),
    ).not.toBeInTheDocument();
  });

  it("does not swipe past the first show", async () => {
    const { container } = renderShowDetail("2");

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "The Big Bang Theory" }),
      ).toBeInTheDocument();
    });

    // Big Bang Theory is first in sort order; swiping right should stay put
    swipe(container.firstChild as HTMLElement, 100, 300);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "The Big Bang Theory" }),
      ).toBeInTheDocument();
    });
    expect(screen.queryByRole("heading", { name: "Scrubs" })).not.toBeInTheDocument();
  });

  it("ignores swipe below distance threshold", async () => {
    const { container } = renderShowDetail("1");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Scrubs" })).toBeInTheDocument();
    });

    swipe(container.firstChild as HTMLElement, 300, 270);

    expect(screen.getByRole("heading", { name: "Scrubs" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "The Big Bang Theory" }),
    ).not.toBeInTheDocument();
  });

  it("back button returns to the entry point after swiping (swipe replaces history)", async () => {
    const user = userEvent.setup();

    function BackButton() {
      const navigate = useNavigate();
      return (
        <button onClick={() => navigate(-1)} type="button">
          Go Back
        </button>
      );
    }

    // Simulate arriving at a show from My Shows: history is [/watchlist, /show/2]
    const { container } = render(
      <MemoryRouter initialEntries={["/watchlist", "/show/2"]} initialIndex={1}>
        <UserProvider>
          <SettingsProvider>
            <ShowsProvider>
              <BackButton />
              <Routes>
                <Route path="/show/:id" element={<ShowDetail />} />
                <Route path="/watchlist" element={<div>My Shows Page</div>} />
              </Routes>
            </ShowsProvider>
          </SettingsProvider>
        </UserProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "The Big Bang Theory" }),
      ).toBeInTheDocument();
    });

    // Swipe to the next show (Scrubs). With replace, this does NOT push history.
    swipe(container.querySelector("[class]") as HTMLElement, 300, 100);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Scrubs" })).toBeInTheDocument();
    });

    // Back should land on My Shows, not the previously-swiped show.
    await user.click(screen.getByRole("button", { name: "Go Back" }));

    await waitFor(() => {
      expect(screen.getByText("My Shows Page")).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("heading", { name: "The Big Bang Theory" }),
    ).not.toBeInTheDocument();
  });
});

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

  it("shows bookmark info", async () => {
    renderShowDetail("1");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Scrubs" })).toBeInTheDocument();
    });

    // Scrubs mock has current_season: 1, current_episode: 6
    expect(screen.getByText("Next: S1E6")).toBeInTheDocument();
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

    await user.click(screen.getByTitle("Remove show"));

    // Confirm dialog should appear
    await waitFor(() => {
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });
    expect(screen.getByText(/Remove "Scrubs" from your watchlist/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => {
      expect(screen.getByText("Watchlist Page")).toBeInTheDocument();
    });
  });
});

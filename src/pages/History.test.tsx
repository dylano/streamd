import { describe, it, expect } from "vite-plus/test";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "../test/mocks/server";
import { UserProvider } from "../context/UserContext";
import { ShowsProvider } from "../context/ShowsContext";
import { SettingsProvider } from "../context/SettingsContext";
import { History } from "./History";

function renderHistory() {
  return render(
    <MemoryRouter>
      <UserProvider>
        <SettingsProvider>
          <ShowsProvider>
            <History />
          </ShowsProvider>
        </SettingsProvider>
      </UserProvider>
    </MemoryRouter>,
  );
}

const completedShow = {
  id: 1,
  tmdb_id: 100,
  name: "Finished Show",
  poster_path: "/done.jpg",
  overview: "A completed show",
  first_air_date: "2020-01-01",
  status: "completed",
  streaming_service: null,
  total_seasons: 3,
  total_episodes: 30,
  current_season: null,
  current_episode: null,
  added_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const droppedShow = {
  id: 2,
  tmdb_id: 200,
  name: "Abandoned Show",
  poster_path: "/drop.jpg",
  overview: "A dropped show",
  first_air_date: "2021-05-01",
  status: "dropped",
  streaming_service: null,
  total_seasons: 1,
  total_episodes: 8,
  current_season: 1,
  current_episode: 4,
  added_at: "2024-02-01T00:00:00Z",
  updated_at: "2024-02-01T00:00:00Z",
};

describe("History", () => {
  it("renders history page", () => {
    renderHistory();
    expect(screen.getByRole("heading", { name: "History" })).toBeInTheDocument();
  });

  it("shows empty message when no completed or dropped shows", async () => {
    renderHistory();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    // Default mock shows have status "watchlist", not "completed"/"dropped"
    expect(screen.getByText("No completed or dropped shows yet.")).toBeInTheDocument();
  });

  it("shows completed shows", async () => {
    server.use(
      http.get("/api/shows", () => {
        return HttpResponse.json([completedShow]);
      }),
    );

    renderHistory();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Finished Show")).toBeInTheDocument();
  });

  it("shows dropped shows", async () => {
    server.use(
      http.get("/api/shows", () => {
        return HttpResponse.json([droppedShow]);
      }),
    );

    renderHistory();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Abandoned Show")).toBeInTheDocument();
  });

  it("shows both completed and dropped shows together", async () => {
    server.use(
      http.get("/api/shows", () => {
        return HttpResponse.json([completedShow, droppedShow]);
      }),
    );

    renderHistory();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Finished Show")).toBeInTheDocument();
    expect(screen.getByText("Abandoned Show")).toBeInTheDocument();
  });

  it("filters out watchlist shows", async () => {
    server.use(
      http.get("/api/shows", () => {
        return HttpResponse.json([
          completedShow,
          { ...droppedShow, id: 3, name: "Active Show", status: "watchlist" },
        ]);
      }),
    );

    renderHistory();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Finished Show")).toBeInTheDocument();
    expect(screen.queryByText("Active Show")).not.toBeInTheDocument();
  });
});

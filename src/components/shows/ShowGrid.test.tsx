import { describe, it, expect } from "vite-plus/test";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ShowGrid } from "./ShowGrid";
import type { Show } from "../../types";

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

const mockShows: Show[] = [
  {
    id: 1,
    tmdb_id: 4556,
    name: "Scrubs",
    poster_path: "/scrubs.jpg",
    overview: "A comedy",
    first_air_date: "2001-10-02",
    status: "watchlist",
    streaming_service: "Hulu",
    total_seasons: 9,
    total_episodes: 182,
    current_season: 1,
    current_episode: 6,
    added_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    tmdb_id: 1418,
    name: "The Big Bang Theory",
    poster_path: "/tbbt.jpg",
    overview: "Physicists",
    first_air_date: "2007-09-24",
    status: "watchlist",
    streaming_service: "Max",
    total_seasons: 12,
    total_episodes: 279,
    current_season: null,
    current_episode: null,
    added_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
  },
];

describe("ShowGrid", () => {
  it("renders all shows", () => {
    renderWithRouter(<ShowGrid shows={mockShows} />);
    expect(screen.getByText("Scrubs")).toBeInTheDocument();
    expect(screen.getByText("The Big Bang Theory")).toBeInTheDocument();
  });

  it("renders default empty message when no shows", () => {
    renderWithRouter(<ShowGrid shows={[]} />);
    expect(screen.getByText("No shows")).toBeInTheDocument();
  });

  it("renders custom empty message", () => {
    renderWithRouter(<ShowGrid shows={[]} emptyMessage="Add some shows to get started!" />);
    expect(screen.getByText("Add some shows to get started!")).toBeInTheDocument();
  });

  it("renders correct number of links", () => {
    renderWithRouter(<ShowGrid shows={mockShows} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
  });
});

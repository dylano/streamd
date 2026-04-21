import { describe, it, expect, vi } from "vite-plus/test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ShowCard } from "./ShowCard";
import type { Show } from "../../types";

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

const mockShow: Show = {
  id: 1,
  tmdb_id: 4556,
  name: "Scrubs",
  poster_path: "/scrubs.jpg",
  overview: "A comedy about hospital life",
  first_air_date: "2001-10-02",
  status: "watchlist",
  streaming_service: "Hulu",
  total_seasons: 9,
  total_episodes: 182,
  current_season: 1,
  current_episode: 6,
  added_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("ShowCard", () => {
  it("renders show name", () => {
    renderWithRouter(<ShowCard show={mockShow} />);
    expect(screen.getByText("Scrubs")).toBeInTheDocument();
  });

  it("renders progress when not caught up", () => {
    renderWithRouter(<ShowCard show={mockShow} />);
    expect(screen.getByText("S1E6")).toBeInTheDocument();
  });

  it("renders 'Caught up' when no bookmark", () => {
    const caughtUpShow: Show = {
      ...mockShow,
      current_season: null,
      current_episode: null,
    };
    renderWithRouter(<ShowCard show={caughtUpShow} />);
    expect(screen.getByText("Caught up")).toBeInTheDocument();
  });

  it("links to show detail page", () => {
    renderWithRouter(<ShowCard show={mockShow} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/show/1");
  });

  it("renders poster image when path exists", () => {
    renderWithRouter(<ShowCard show={mockShow} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://image.tmdb.org/t/p/w342/scrubs.jpg");
    expect(img).toHaveAttribute("alt", "Scrubs");
  });

  it("renders placeholder when no poster path", () => {
    const noPosterShow: Show = { ...mockShow, poster_path: null };
    renderWithRouter(<ShowCard show={noPosterShow} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("S")).toBeInTheDocument(); // First letter of "Scrubs"
  });

  it("renders add button when onAdd is provided", () => {
    renderWithRouter(<ShowCard show={mockShow} onAdd={() => {}} />);
    expect(screen.getByTitle("Add to my shows")).toBeInTheDocument();
  });

  it("does not render add button by default", () => {
    renderWithRouter(<ShowCard show={mockShow} />);
    expect(screen.queryByTitle("Add to my shows")).not.toBeInTheDocument();
  });

  it("renders as div instead of link when onAdd is provided", () => {
    renderWithRouter(<ShowCard show={mockShow} onAdd={() => {}} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("calls onAdd with the show when add button is clicked", async () => {
    const handleAdd = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(<ShowCard show={mockShow} onAdd={handleAdd} />);

    await user.click(screen.getByTitle("Add to my shows"));
    expect(handleAdd).toHaveBeenCalledWith(mockShow);
  });
});

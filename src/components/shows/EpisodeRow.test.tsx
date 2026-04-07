import { describe, it, expect, vi } from "vite-plus/test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EpisodeRow } from "./EpisodeRow";
import type { Episode } from "../../types";

const mockEpisode: Episode = {
  id: 1,
  show_id: 1,
  tmdb_id: 101,
  season_number: 1,
  episode_number: 5,
  name: "My Two Dads",
  air_date: "2001-11-13",
  runtime: 22,
  watched: false,
  watched_at: null,
};

describe("EpisodeRow", () => {
  it("renders episode number formatted correctly", () => {
    const onToggle = vi.fn();
    render(<EpisodeRow episode={mockEpisode} onToggleWatched={onToggle} />);
    expect(screen.getByText("1×05")).toBeInTheDocument();
  });

  it("renders episode name", () => {
    const onToggle = vi.fn();
    render(<EpisodeRow episode={mockEpisode} onToggleWatched={onToggle} />);
    expect(screen.getByText("My Two Dads")).toBeInTheDocument();
  });

  it("renders air date formatted", () => {
    const onToggle = vi.fn();
    render(<EpisodeRow episode={mockEpisode} onToggleWatched={onToggle} />);
    // Date formatting depends on locale, so check that something with 2001 appears
    expect(screen.getByText(/2001/)).toBeInTheDocument();
  });

  it("renders runtime when present", () => {
    const onToggle = vi.fn();
    render(<EpisodeRow episode={mockEpisode} onToggleWatched={onToggle} />);
    expect(screen.getByText("22m")).toBeInTheDocument();
  });

  it("renders TBA for missing name", () => {
    const onToggle = vi.fn();
    const episodeNoName: Episode = { ...mockEpisode, name: null };
    render(<EpisodeRow episode={episodeNoName} onToggleWatched={onToggle} />);
    expect(screen.getByText("TBA")).toBeInTheDocument();
  });

  it("renders TBA for missing air date", () => {
    const onToggle = vi.fn();
    const episodeNoDate: Episode = { ...mockEpisode, air_date: null };
    render(<EpisodeRow episode={episodeNoDate} onToggleWatched={onToggle} />);
    expect(screen.getAllByText("TBA")).toHaveLength(1);
  });

  it("calls onToggleWatched when checkbox clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<EpisodeRow episode={mockEpisode} onToggleWatched={onToggle} />);

    const button = screen.getByRole("button", { name: /mark as watched/i });
    await user.click(button);

    expect(onToggle).toHaveBeenCalledWith(1, true);
  });

  it("shows checkmark when episode is watched", () => {
    const onToggle = vi.fn();
    const watchedEpisode: Episode = { ...mockEpisode, watched: true };
    render(<EpisodeRow episode={watchedEpisode} onToggleWatched={onToggle} />);

    const button = screen.getByRole("button", { name: /mark as unwatched/i });
    expect(button).toHaveTextContent("✓");
  });

  it("disables checkbox for unaired episodes", () => {
    const onToggle = vi.fn();
    const futureEpisode: Episode = {
      ...mockEpisode,
      air_date: "2099-12-31",
    };
    render(<EpisodeRow episode={futureEpisode} onToggleWatched={onToggle} />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("enables checkbox for aired episodes", () => {
    const onToggle = vi.fn();
    render(<EpisodeRow episode={mockEpisode} onToggleWatched={onToggle} />);

    const button = screen.getByRole("button");
    expect(button).not.toBeDisabled();
  });
});

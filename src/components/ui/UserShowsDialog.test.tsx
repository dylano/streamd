import { describe, it, expect, vi } from "vite-plus/test";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "../../test/mocks/server";
import { mockUser } from "../../test/mocks/handlers";
import { UserProvider } from "../../context/UserContext";
import { SettingsProvider } from "../../context/SettingsContext";
import { ShowsProvider } from "../../context/ShowsContext";
import { UserShowsDialog } from "./UserShowsDialog";

function renderDialog(onClose = vi.fn()) {
  return {
    onClose,
    ...render(
      <MemoryRouter>
        <UserProvider>
          <SettingsProvider>
            <ShowsProvider>
              <UserShowsDialog onClose={onClose} currentUserId={mockUser.id} />
            </ShowsProvider>
          </SettingsProvider>
        </UserProvider>
      </MemoryRouter>,
    ),
  };
}

describe("UserShowsDialog", () => {
  it("shows loading state initially", () => {
    renderDialog();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows user list after loading", async () => {
    renderDialog();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Browse Users")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("filters out the current user from the list", async () => {
    renderDialog();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.queryByText(mockUser.name)).not.toBeInTheDocument();
  });

  it("shows 'No other users yet' when no other users exist", async () => {
    server.use(
      http.get("/api/users/all", () => {
        return HttpResponse.json([mockUser]);
      }),
    );

    renderDialog();

    await waitFor(() => {
      expect(screen.getByText("No other users yet")).toBeInTheDocument();
    });
  });

  it("shows selected user's shows when clicking a user", async () => {
    const user = userEvent.setup();
    renderDialog();

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Alice"));

    await waitFor(() => {
      expect(screen.getByText("Alice's Shows")).toBeInTheDocument();
    });

    expect(screen.getByText("Breaking Bad")).toBeInTheDocument();
    expect(screen.getByText("Scrubs")).toBeInTheDocument();
  });

  it("shows empty state for a user with no shows", async () => {
    const user = userEvent.setup();
    renderDialog();

    await waitFor(() => {
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Bob"));

    await waitFor(() => {
      expect(screen.getByText("No shows yet")).toBeInTheDocument();
    });
  });

  it("shows back button when viewing a user's shows", async () => {
    const user = userEvent.setup();
    renderDialog();

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    expect(screen.queryByTitle("Back")).not.toBeInTheDocument();

    await user.click(screen.getByText("Alice"));

    await waitFor(() => {
      expect(screen.getByTitle("Back")).toBeInTheDocument();
    });
  });

  it("navigates back to user list when clicking back", async () => {
    const user = userEvent.setup();
    renderDialog();

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Alice"));

    await waitFor(() => {
      expect(screen.getByText("Alice's Shows")).toBeInTheDocument();
    });

    await user.click(screen.getByTitle("Back"));

    expect(screen.getByText("Browse Users")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("calls onClose when clicking close button", async () => {
    const user = userEvent.setup();
    const { onClose } = renderDialog();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    await user.click(screen.getByTitle("Close"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when pressing Escape", async () => {
    const user = userEvent.setup();
    const { onClose } = renderDialog();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("shows add button only for shows the user does not already have", async () => {
    const user = userEvent.setup();
    renderDialog();

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Alice"));

    await waitFor(() => {
      expect(screen.getByText("Breaking Bad")).toBeInTheDocument();
    });

    // Scrubs (tmdb_id 4556) is in mockShows (current user's list), so no add button
    // Breaking Bad (tmdb_id 1399) is not, so it gets an add button
    const addButtons = screen.getAllByTitle("Add to my shows");
    expect(addButtons).toHaveLength(1);
  });

  it("hides add button after adding a show", async () => {
    const user = userEvent.setup();
    renderDialog();

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Alice"));

    await waitFor(() => {
      expect(screen.getByTitle("Add to my shows")).toBeInTheDocument();
    });

    await user.click(screen.getByTitle("Add to my shows"));

    await waitFor(() => {
      expect(screen.queryByTitle("Add to my shows")).not.toBeInTheDocument();
    });
  });
});

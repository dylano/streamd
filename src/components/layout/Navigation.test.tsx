import { describe, it, expect, vi } from "vite-plus/test";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "../../test/mocks/server";
import { UserProvider } from "../../context/UserContext";
import { SyncProvider } from "../../context/SyncContext";
import { Navigation } from "./Navigation";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderNavigation() {
  return render(
    <MemoryRouter>
      <UserProvider>
        <SyncProvider>
          <Navigation />
        </SyncProvider>
      </UserProvider>
    </MemoryRouter>,
  );
}

describe("Navigation", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("renders navigation links", () => {
    renderNavigation();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("My Shows")).toBeInTheDocument();
  });

  it("renders sync button", () => {
    renderNavigation();
    const syncButton = screen.getByRole("button", { name: /sync all shows/i });
    expect(syncButton).toBeInTheDocument();
  });

  it("calls sync API and navigates on click", async () => {
    const user = userEvent.setup();
    renderNavigation();

    const syncButton = screen.getByRole("button", { name: /sync all shows/i });
    await user.click(syncButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("disables button while syncing", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("/api/shows/sync", async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({ synced: [] });
      }),
    );

    renderNavigation();
    const syncButton = screen.getByRole("button", { name: /sync all shows/i });

    await user.click(syncButton);
    expect(syncButton).toBeDisabled();

    await waitFor(() => {
      expect(syncButton).not.toBeDisabled();
    });
  });

  it("handles sync error gracefully", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("/api/shows/sync", () => {
        return HttpResponse.json({ error: "Sync failed" }, { status: 500 });
      }),
    );

    renderNavigation();
    const syncButton = screen.getByRole("button", { name: /sync all shows/i });
    await user.click(syncButton);

    await waitFor(() => {
      expect(syncButton).not.toBeDisabled();
    });
  });

  it("links have correct hrefs", () => {
    renderNavigation();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "My Shows" })).toHaveAttribute("href", "/watchlist");
  });
});

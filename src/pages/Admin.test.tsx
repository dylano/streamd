import { describe, it, expect, vi, afterEach } from "vite-plus/test";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "../context/UserContext";
import { SettingsProvider } from "../context/SettingsContext";
import { setApiUserId } from "../api/client";
import { mockUser } from "../test/mocks/handlers";
import { server } from "../test/mocks/server";
import { Admin } from "./Admin";

const adminUser = { id: 1, name: "doliver", isAdmin: true };

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.setItem("streamd-user", JSON.stringify(mockUser));
  setApiUserId(mockUser.id);
});

function seedAdmin() {
  localStorage.setItem("streamd-user", JSON.stringify(adminUser));
  setApiUserId(adminUser.id);
  // Override user validation to return doliver instead of TestUser
  server.use(http.get("/api/users/1", () => HttpResponse.json(adminUser)));
}

function renderAdmin() {
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <UserProvider>
        <SettingsProvider>
          <Routes>
            <Route path="/" element={<p>Home</p>} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </SettingsProvider>
      </UserProvider>
    </MemoryRouter>,
  );
}

describe("Admin", () => {
  it("redirects non-admin users to home", () => {
    // Default mock user is "TestUser", not admin
    renderAdmin();

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Admin" })).not.toBeInTheDocument();
  });

  it("renders stats and user list", async () => {
    seedAdmin();
    renderAdmin();

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument(); // shows
    });

    expect(screen.getByText("3")).toBeInTheDocument(); // users
    expect(screen.getByText("120")).toBeInTheDocument(); // episodes
    expect(screen.getByText("45")).toBeInTheDocument(); // watched

    expect(screen.getByText("doliver")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("does not show delete button for current user", async () => {
    seedAdmin();
    renderAdmin();

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    // Should have delete buttons for Alice and Bob, but not doliver
    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    expect(deleteButtons).toHaveLength(2);
  });

  it("shows confirm dialog when deleting a user", async () => {
    seedAdmin();
    const user = userEvent.setup();
    renderAdmin();

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[0]);

    expect(screen.getByText(/Delete user "Alice"/)).toBeInTheDocument();
  });

  it("can cancel user deletion", async () => {
    seedAdmin();
    const user = userEvent.setup();
    renderAdmin();

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[0]);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    // Dialog should be gone, user still there
    expect(screen.queryByText(/Delete user "Alice"/)).not.toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("deletes a user on confirm", async () => {
    seedAdmin();
    const user = userEvent.setup();
    renderAdmin();

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[0]);

    // Confirm dialog should appear — scope to the dialog
    const dialog = screen.getByRole("alertdialog");
    const confirmButton = within(dialog).getByRole("button", { name: "Delete" });
    await user.click(confirmButton);

    // Dialog should close after deletion
    await waitFor(() => {
      expect(screen.queryByText(/Delete user "Alice"/)).not.toBeInTheDocument();
    });
  });
});

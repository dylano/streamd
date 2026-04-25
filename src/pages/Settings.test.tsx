import { describe, it, expect, vi, afterEach } from "vite-plus/test";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { UserProvider } from "../context/UserContext";
import { SettingsProvider } from "../context/SettingsContext";
import { http, HttpResponse } from "msw";
import { setApiUserId } from "../api/client";
import { mockUser } from "../test/mocks/handlers";
import { server } from "../test/mocks/server";
import { Settings } from "./Settings";

afterEach(() => {
  vi.restoreAllMocks();
  // Restore default mock user in case a test overrode it
  localStorage.setItem("streamd-user", JSON.stringify(mockUser));
  setApiUserId(mockUser.id);
});

function renderSettings() {
  return render(
    <MemoryRouter>
      <UserProvider>
        <SettingsProvider>
          <Settings />
        </SettingsProvider>
      </UserProvider>
    </MemoryRouter>,
  );
}

function getToggleByLabel(label: string) {
  // Label is inside: div.setting > div.settingInfo > span.settingLabel
  // The toggle button is a sibling of settingInfo inside div.setting
  const labelEl = screen.getByText(label);
  const settingDiv = labelEl.parentElement!.parentElement!;
  return within(settingDiv).getByRole("button");
}

describe("Settings", () => {
  it("renders settings page with toggles", () => {
    renderSettings();

    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByText("Display trending shows")).toBeInTheDocument();
    expect(screen.getByText("Use dark mode")).toBeInTheDocument();
  });

  it("toggles trending setting", async () => {
    const user = userEvent.setup();
    renderSettings();

    const toggle = getToggleByLabel("Display trending shows");
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  it("toggles dark mode setting", async () => {
    const user = userEvent.setup();
    renderSettings();

    const toggle = getToggleByLabel("Use dark mode");
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("shows logged in user and logout button", () => {
    renderSettings();

    expect(screen.getByText(/Logged in as/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
  });

  it("does not show admin link for non-admin users", () => {
    renderSettings();

    expect(screen.queryByText("Admin panel")).not.toBeInTheDocument();
  });

  it("shows admin link for admin user", () => {
    const adminUser = { id: 1, name: "ima_admin", isAdmin: true };
    localStorage.setItem("streamd-user", JSON.stringify(adminUser));
    setApiUserId(1);
    server.use(http.get("/api/users/1", () => HttpResponse.json(adminUser)));
    renderSettings();

    expect(screen.getByText("Admin panel")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open" })).toHaveAttribute("href", "/admin");
  });
});

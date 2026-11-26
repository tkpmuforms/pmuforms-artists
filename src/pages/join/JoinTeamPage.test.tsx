import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import JoinTeamPage from "./JoinTeamPage";
import * as team from "../../services/teamServices";
import { savedTeamInvite } from "../../utils/teamInvite";

const auth = vi.hoisted(() => ({
  value: {
    isAuthenticated: false,
    me: null as unknown,
    user: {} as { businessName?: string },
    logout: () => {},
  },
}));

vi.mock("../../services/teamServices", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/teamServices")>()),
  getTeamInvite: vi.fn(),
}));
vi.mock("../../services/artistServices", () => ({ getAuthMe: vi.fn() }));
vi.mock("../../context/useAuth", () => ({ default: () => auth.value }));
vi.mock("../../components/layout/navbar/Navbar", () => ({ default: () => null }));

const mocked = vi.mocked(team);

const AuthPage = () => {
  const location = useLocation();
  return <p>Auth page: {(location.state as { authPage?: string })?.authPage}</p>;
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/join/tok123"]}>
      <Routes>
        <Route path="/join/:token" element={<JoinTeamPage />} />
        <Route path="/" element={<AuthPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe("Join team page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    auth.value = { isAuthenticated: false, me: null, user: {}, logout: vi.fn() };
    mocked.getTeamInvite.mockResolvedValue({
      data: {
        businessName: "Glow Studio",
        ownerName: "Tia Kane",
        email: "mia@x.com",
        expired: false,
      },
    } as never);
  });

  it("says whose team it is, remembers the invite and goes to signup", async () => {
    renderPage();
    expect(
      await screen.findByRole("heading", { name: "Join Glow Studio on PMU Forms" }),
    ).toBeInTheDocument();
    expect(mocked.getTeamInvite).toHaveBeenCalledWith("tok123");
    expect(screen.getByText(/Tia Kane added you/)).toBeInTheDocument();
    expect(savedTeamInvite()).toEqual({ email: "mia@x.com", businessName: "Glow Studio" });

    await userEvent.click(screen.getByRole("button", { name: "Create my login" }));
    expect(screen.getByText("Auth page: signup")).toBeInTheDocument();
  });

  it("says an expired invite needs a new one, and doesn't remember it", async () => {
    mocked.getTeamInvite.mockResolvedValue({
      data: { businessName: "Glow Studio", ownerName: "Tia Kane", email: "mia@x.com", expired: true },
    } as never);
    renderPage();
    expect(
      await screen.findByRole("heading", { name: "This invite has expired" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Ask Tia Kane to send you a new one/)).toBeInTheDocument();
    expect(savedTeamInvite()).toBeNull();
  });

  it("shows the API's reason for a bad link", async () => {
    mocked.getTeamInvite.mockRejectedValue({
      statusCode: 404,
      message: "This invite link is no longer valid. Ask for a new one.",
    });
    renderPage();
    expect(
      await screen.findByText("This invite link is no longer valid. Ask for a new one."),
    ).toBeInTheDocument();
  });

  it("asks someone signed in to another business to log out first", async () => {
    const logout = vi.fn();
    auth.value = {
      isAuthenticated: true,
      me: { id: "u9", role: "owner", name: "Other" },
      user: { businessName: "Other Brows" },
      logout,
    };
    renderPage();
    expect(await screen.findByText(/You're signed in to/)).toHaveTextContent(
      "You're signed in to Other Brows. To join Glow Studio, log out and sign in with mia@x.com.",
    );
    await userEvent.click(screen.getByRole("button", { name: "Log out and continue" }));
    expect(logout).toHaveBeenCalled();
  });
});

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TeamPage from "./TeamPage";
import * as api from "../../../services/teamServices";
import type { TeamMember } from "../../../services/teamServices";

vi.mock("../../../services/teamServices", async (importOriginal) => ({
  // the real error reader; the requests are faked
  ...(await importOriginal<typeof import("../../../services/teamServices")>()),
  getTeam: vi.fn(),
  inviteTeamMember: vi.fn(),
  resendTeamInvite: vi.fn(),
  removeTeamMember: vi.fn(),
  getTeamPeople: vi.fn(),
}));
vi.mock("../../../context/useAuth", () => ({
  default: () => ({ user: { email: "owner@glow.com", businessName: "Glow" } }),
}));
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const mocked = vi.mocked(api);

const member = (over: Partial<TeamMember> = {}): TeamMember => ({
  id: "m1",
  email: "mia@glow.com",
  firstName: "Mia",
  lastName: "Ross",
  status: "active",
  invitedAt: "2026-11-01T10:00:00Z",
  joinedAt: "2026-11-02T10:00:00Z",
  lastActiveAt: null,
  inviteExpired: false,
  ...over,
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <TeamPage />
    </MemoryRouter>,
  );

describe("Team page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.getTeam.mockResolvedValue({
      data: {
        members: [
          member(),
          member({
            id: "m2",
            email: "sam@x.com",
            firstName: "",
            lastName: "",
            status: "invited",
            joinedAt: null,
            inviteExpired: true,
          }),
        ],
        seatLimit: 5,
      },
    } as never);
  });

  it("lists the team with each person's status", async () => {
    renderPage();
    const list = await screen.findByRole("list");
    const [mia, sam] = within(list).getAllByRole("listitem");
    expect(mia).toHaveTextContent("Mia Ross");
    expect(mia).toHaveTextContent("Active");
    expect(within(mia).getByRole("button", { name: /Remove/ })).toBeInTheDocument();
    expect(sam).toHaveTextContent("sam@x.com");
    expect(sam).toHaveTextContent("Expired");
    expect(within(sam).getByRole("button", { name: /Send new invite/ })).toBeInTheDocument();
    expect(screen.getByText(/2 of 5 seats used/)).toBeInTheDocument();
  });

  it("invites someone and adds them to the list", async () => {
    mocked.inviteTeamMember.mockResolvedValue({
      data: {
        member: member({
          id: "m3",
          email: "new@x.com",
          firstName: "",
          lastName: "",
          status: "invited",
          joinedAt: null,
        }),
      },
    } as never);
    renderPage();
    await screen.findByRole("list");
    await userEvent.type(screen.getByLabelText("Email to invite"), " New@X.com ");
    await userEvent.click(screen.getByRole("button", { name: /Send invite/ }));
    expect(mocked.inviteTeamMember).toHaveBeenCalledWith("new@x.com");
    expect(await screen.findByText("new@x.com")).toBeInTheDocument();
    expect(screen.getByLabelText("Email to invite")).toHaveValue("");
  });

  it("doesn't invite the owner's own email", async () => {
    renderPage();
    await screen.findByRole("list");
    await userEvent.type(screen.getByLabelText("Email to invite"), "owner@glow.com");
    await userEvent.click(screen.getByRole("button", { name: /Send invite/ }));
    expect(screen.getByRole("alert")).toHaveTextContent("That's your own email.");
    expect(mocked.inviteTeamMember).not.toHaveBeenCalled();
  });

  it("links to Owner's details when the API asks for them first", async () => {
    // what axiosSetup's interceptor rejects with: the response body
    mocked.inviteTeamMember.mockRejectedValue({
      statusCode: 400,
      message:
        "Add your first name, last name and phone number in Owner's details before inviting your team.",
    });
    renderPage();
    await screen.findByRole("list");
    await userEvent.type(screen.getByLabelText("Email to invite"), "new@x.com");
    await userEvent.click(screen.getByRole("button", { name: /Send invite/ }));
    const link = await screen.findByRole("link", { name: "Add them now" });
    expect(link).toHaveAttribute("href", "/profile/business-information");
  });

  it("refuses an email that already has its own account, saying why", async () => {
    mocked.inviteTeamMember.mockRejectedValue({
      statusCode: 409,
      message:
        "This email already has its own PMU Forms account. Invite a different email.",
    });
    renderPage();
    await screen.findByRole("list");
    await userEvent.type(screen.getByLabelText("Email to invite"), "taken@x.com");
    await userEvent.click(screen.getByRole("button", { name: /Send invite/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This email already has its own PMU Forms account. Invite a different email.",
    );
  });

  it("clears the invite box's error once the owner does something else", async () => {
    mocked.inviteTeamMember.mockRejectedValue({
      statusCode: 409,
      message:
        "This email already has its own PMU Forms account. Invite a different email.",
    });
    mocked.resendTeamInvite.mockResolvedValue({
      data: { member: member({ id: "m2", email: "sam@x.com", status: "invited" }) },
    } as never);
    renderPage();
    const list = await screen.findByRole("list");
    await userEvent.type(screen.getByLabelText("Email to invite"), "taken@x.com");
    await userEvent.click(screen.getByRole("button", { name: /Send invite/ }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    const sam = within(list).getAllByRole("listitem")[1];
    await userEvent.click(within(sam).getByRole("button", { name: /Send new invite/ }));
    expect(mocked.resendTeamInvite).toHaveBeenCalledWith("m2");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("removes someone after confirming", async () => {
    mocked.removeTeamMember.mockResolvedValue({ data: { member: member() } } as never);
    renderPage();
    const list = await screen.findByRole("list");
    const [mia] = within(list).getAllByRole("listitem");
    await userEvent.click(within(mia).getByRole("button", { name: /Remove/ }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Remove Mia Ross?");
    await userEvent.click(within(dialog).getByRole("button", { name: "Remove" }));
    expect(mocked.removeTeamMember).toHaveBeenCalledWith("m1");
    await waitFor(() => expect(screen.queryByText("Mia Ross")).toBeNull());
  });

  it("stops invites when the team is full", async () => {
    mocked.getTeam.mockResolvedValue({
      data: {
        members: [1, 2].map((n) => member({ id: `m${n}`, email: `p${n}@x.com` })),
        seatLimit: 2,
      },
    } as never);
    renderPage();
    expect(await screen.findByText(/Your team is full \(2 people\)/)).toBeInTheDocument();
    expect(screen.getByLabelText("Email to invite")).toBeDisabled();
  });
});

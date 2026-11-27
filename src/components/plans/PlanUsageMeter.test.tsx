import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../services/artistServices";
import PlanUsageMeter from "./PlanUsageMeter";

vi.mock("../../services/artistServices", () => ({ getPlanUsage: vi.fn() }));
const auth = vi.hoisted(() => ({
  user: { stripeSubscriptionActive: true } as Record<string, unknown>,
  isMember: false,
}));
vi.mock("../../context/useAuth", () => ({ default: () => auth }));

const mocked = vi.mocked(api);

const starter = (clients: number, appointmentsThisMonth: number) =>
  mocked.getPlanUsage.mockResolvedValue({
    data: {
      plan: "starter",
      limits: { clients: 10, appointmentsPerMonth: 5 },
      usage: { clients, appointmentsThisMonth, month: "2026-12" },
    },
  } as never);

const renderMeter = () =>
  render(
    <MemoryRouter>
      <PlanUsageMeter />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  auth.user = { stripeSubscriptionActive: true };
  auth.isMember = false;
});

describe("Starter usage meter", () => {
  it("shows what's used this month, in the browser's time zone", async () => {
    starter(7, 3);
    renderMeter();

    expect(
      await screen.findByText("7 of 10 clients · 3 of 5 appointments in December"),
    ).toBeInTheDocument();
    expect(mocked.getPlanUsage).toHaveBeenCalledWith(
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
    // not close to a limit yet: no nudge
    expect(screen.queryByRole("link", { name: /Upgrade to Pro/ })).toBeNull();
  });

  it("offers the upgrade close to a limit", async () => {
    starter(8, 1);
    renderMeter();

    expect(
      await screen.findByRole("link", { name: "Upgrade to Pro for unlimited" }),
    ).toHaveAttribute("href", "/profile/payment");
  });

  it("says when a limit is reached", async () => {
    starter(4, 5);
    renderMeter();

    expect(
      await screen.findByText("You've used all your appointments for December."),
    ).toBeInTheDocument();
  });

  it("tells a team member to ask the owner instead", async () => {
    auth.isMember = true;
    starter(10, 2);
    renderMeter();

    expect(
      await screen.findByText(/Ask the account owner to upgrade to Pro/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("shows nothing on Pro", async () => {
    mocked.getPlanUsage.mockResolvedValue({
      data: {
        plan: "pro",
        limits: null,
        usage: { clients: 40, appointmentsThisMonth: 12, month: "2026-12" },
      },
    } as never);
    const { container } = renderMeter();

    await waitFor(() => expect(mocked.getPlanUsage).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("doesn't ask without a web subscription", () => {
    auth.user = { appStorePurchaseActive: true };
    const { container } = renderMeter();

    expect(mocked.getPlanUsage).not.toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
  });
});

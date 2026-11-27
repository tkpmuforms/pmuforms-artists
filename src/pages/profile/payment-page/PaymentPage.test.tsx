import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../../services/artistServices";
import PaymentPage from "./PaymentPage";

vi.mock("../../../services/artistServices", async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  getSubscription: vi.fn(),
  listPaymentMethods: vi.fn(),
  listTransactions: vi.fn(),
  cancelSubscription: vi.fn(),
  resumeSubscription: vi.fn(),
  getSubscriptionPlans: vi.fn(),
  getPlanUsage: vi.fn(),
}));
vi.mock("react-redux", () => ({ useDispatch: () => vi.fn() }));
vi.mock("../../../utils/authUtils", () => ({ refreshAuthUser: vi.fn() }));
vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock("../../../context/useAuth", () => ({
  default: () => ({ user: { userId: "a1", stripeSubscriptionActive: true } }),
}));

const mocked = vi.mocked(api);

const DEC_24 = Date.UTC(2026, 11, 24, 19) / 1000;

/** a monthly subscription that started free with PMUSTUDIO26 */
const subscription = (overrides: Record<string, unknown> = {}) => ({
  id: "sub_1",
  status: "active",
  cancel_at_period_end: false,
  cancel_at: null,
  items: {
    data: [
      {
        current_period_end: DEC_24,
        current_period_start: DEC_24 - 30 * 86400,
        price: {
          id: "price_month",
          unit_amount: 1999,
          currency: "usd",
          recurring: { interval: "month", interval_count: 1 },
        },
      },
    ],
  },
  latest_invoice: { billing_reason: "subscription_create", total: 0, subtotal: 1999 },
  discounts: [{ promotion_code: { code: "PMUSTUDIO26" } }],
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mocked.listPaymentMethods.mockResolvedValue({ data: { data: [] } } as never);
  mocked.listTransactions.mockResolvedValue({ data: { invoices: [] } } as never);
  mocked.getSubscriptionPlans.mockResolvedValue({ data: {} } as never);
});

describe("Payment page subscription", () => {
  it("shows the free first month and when the first payment is", async () => {
    mocked.getSubscription.mockResolvedValue({ data: subscription() } as never);
    render(<PaymentPage />);

    expect(
      await screen.findByText(/Your first month\s+is free/),
    ).toHaveTextContent(
      "🎁 Your first month is free with code PMUSTUDIO26. Your first payment of $19.99 is on December 24, 2026.",
    );
    expect(screen.getByRole("button", { name: "Cancel Subscription" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change Plan" })).toBeInTheDocument();
  });

  it("explains a cancellation and offers to resume, without cancel or change plan", async () => {
    mocked.getSubscription.mockResolvedValue({
      data: subscription({ cancel_at_period_end: true, cancel_at: DEC_24 }),
    } as never);
    render(<PaymentPage />);

    expect(
      await screen.findByText(/Your subscription is cancelled and ends on December 24, 2026/),
    ).toBeInTheDocument();
    expect(screen.getByText(/won't be charged again/)).toBeInTheDocument();
    expect(screen.getByText(/carries on at \$19\.99\/month from December 24, 2026/)).toBeInTheDocument();
    expect(screen.getByText(/still runs to the end, December 24, 2026/)).toBeInTheDocument();
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel Subscription" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Change Plan" })).toBeNull();
    expect(screen.getByRole("button", { name: "Resume Subscription" })).toBeInTheDocument();
  });

  it("resumes the plan", async () => {
    mocked.getSubscription
      .mockResolvedValueOnce({
        data: subscription({ cancel_at_period_end: true, cancel_at: DEC_24 }),
      } as never)
      .mockResolvedValue({ data: subscription() } as never);
    mocked.resumeSubscription.mockResolvedValue({ data: subscription() } as never);
    const user = userEvent.setup();
    render(<PaymentPage />);

    await user.click(await screen.findByRole("button", { name: "Resume Subscription" }));

    expect(mocked.resumeSubscription).toHaveBeenCalled();
    expect(await screen.findByRole("button", { name: "Cancel Subscription" })).toBeInTheDocument();
    expect(screen.queryByText(/is cancelled/)).toBeNull();
  });

  it("says when access ends before cancelling, with clear buttons", async () => {
    mocked.getSubscription.mockResolvedValue({ data: subscription() } as never);
    mocked.cancelSubscription.mockResolvedValue({ data: {} } as never);
    const user = userEvent.setup();
    render(<PaymentPage />);

    await user.click(await screen.findByRole("button", { name: "Cancel Subscription" }));
    const dialog = (await screen.findByText(/You'll keep full access until December 24, 2026/))
      .closest("div")!.parentElement!;
    expect(within(dialog).getByRole("button", { name: "Keep My Plan" })).toBeInTheDocument();

    mocked.getSubscription.mockResolvedValue({
      data: subscription({ cancel_at_period_end: true, cancel_at: DEC_24 }),
    } as never);
    const confirm = screen.getAllByRole("button", { name: "Cancel Subscription" });
    await user.click(confirm[confirm.length - 1]);

    await waitFor(() => expect(mocked.cancelSubscription).toHaveBeenCalled());
    expect(await screen.findByRole("button", { name: "Resume Subscription" })).toBeInTheDocument();
  });

  it("says nothing about a free month when the first payment was paid", async () => {
    mocked.getSubscription.mockResolvedValue({
      data: subscription({
        latest_invoice: { billing_reason: "subscription_create", total: 1999, subtotal: 1999 },
        discounts: [],
      }),
    } as never);
    render(<PaymentPage />);

    expect(await screen.findByRole("button", { name: "Change Plan" })).toBeInTheDocument();
    expect(screen.queryByText(/is free/)).toBeNull();
  });
});

describe("Payment page with Starter", () => {
  const plansWithStarter = {
    monthly: { priceId: "price_month", amount: 19.99, currency: "usd" },
    yearly: { priceId: "price_year", amount: 149.99, currency: "usd" },
    starter: { priceId: "price_starter", amount: 9.99, currency: "usd" },
  };
  const starterSubscription = () =>
    subscription({
      latest_invoice: { billing_reason: "subscription_create", total: 999, subtotal: 999 },
      discounts: [],
      items: {
        data: [
          {
            current_period_end: DEC_24,
            current_period_start: DEC_24 - 30 * 86400,
            price: {
              id: "price_starter",
              unit_amount: 999,
              currency: "usd",
              recurring: { interval: "month", interval_count: 1 },
            },
          },
        ],
      },
    });

  beforeEach(() => {
    mocked.getSubscriptionPlans.mockResolvedValue({ data: plansWithStarter } as never);
    mocked.getPlanUsage.mockResolvedValue({
      data: {
        plan: "starter",
        limits: { clients: 10, appointmentsPerMonth: 5 },
        usage: { clients: 7, appointmentsThisMonth: 3, month: "2026-12" },
      },
    } as never);
  });

  it("shows Starter with its usage and an upgrade to Pro, monthly or yearly", async () => {
    mocked.getSubscription.mockResolvedValue({ data: starterSubscription() } as never);
    const user = userEvent.setup();
    render(<PaymentPage />);

    expect(
      await screen.findByText("7 of 10 clients · 3 of 5 appointments in December"),
    ).toBeInTheDocument();
    expect(screen.getByText("Current Plan").nextSibling).toHaveTextContent(/^Starter$/);
    expect(screen.queryByRole("button", { name: "Change Plan" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Upgrade to Pro" }));
    expect(
      await screen.findByRole("heading", { name: "Upgrade to Pro" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Pro Yearly")).toBeInTheDocument();
    expect(screen.getByText("Current")).toBeInTheDocument();
  });

  it("never offers a Pro subscriber Starter", async () => {
    mocked.getSubscription.mockResolvedValue({ data: subscription() } as never);
    const user = userEvent.setup();
    render(<PaymentPage />);

    await user.click(await screen.findByRole("button", { name: "Change Plan" }));
    expect(await screen.findByText("Select a new plan to switch your subscription")).toBeInTheDocument();
    expect(screen.getByText("Pro · Monthly Plan")).toBeInTheDocument();
    expect(screen.queryByText("Starter")).toBeNull();
    expect(screen.queryByText("$9.99/month")).toBeNull();
    expect(mocked.getPlanUsage).not.toHaveBeenCalled();
  });
});

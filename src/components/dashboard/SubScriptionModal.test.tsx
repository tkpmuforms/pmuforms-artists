import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../services/artistServices";
import SubscriptionModal from "./SubScriptionModal";
import { resetSavedOfferChecks } from "../../utils/savedOffer";

vi.mock("../../services/artistServices", async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  getSubscriptionPlans: vi.fn(),
  getReferralSummary: vi.fn(),
  listPaymentMethods: vi.fn(),
  validateCoupon: vi.fn(),
  createSubscription: vi.fn(),
  getSignupOffer: vi.fn(),
}));
vi.mock("react-redux", () => ({ useDispatch: () => vi.fn() }));
const auth = vi.hoisted(() => ({ user: {} as Record<string, unknown> }));
vi.mock("../../context/useAuth", () => ({
  default: () => ({ user: auth.user, isMember: false }),
}));
vi.mock("../../utils/authUtils", () => ({ refreshAuthUser: vi.fn() }));
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const mocked = vi.mocked(api);

const noBuildPlans = () => {
  // what the pop-up saw: none of the plan settings in the build
  for (const key of [
    "VITE_MONTHLY_PRICE",
    "VITE_MONTHLY_PRICE_ID",
    "VITE_YEARLY_PRICE",
    "VITE_YEARLY_PRICE_ID",
  ]) {
    vi.stubEnv(key, "");
  }
};

const STARTER = { priceId: "price_starter", amount: 9.99, currency: "usd" };
const withStarter = () =>
  mocked.getSubscriptionPlans.mockResolvedValue({
    data: {
      monthly: { priceId: "price_month", amount: 19.99, currency: "usd" },
      yearly: { priceId: "price_year", amount: 149.99, currency: "usd" },
      starter: STARTER,
    },
  } as never);

beforeEach(() => {
  vi.clearAllMocks();
  auth.user = {};
  resetSavedOfferChecks();
  noBuildPlans();
  mocked.getSignupOffer.mockResolvedValue({ data: { offer: null } } as never);
  mocked.getSubscriptionPlans.mockResolvedValue({
    data: {
      monthly: { priceId: "price_month", amount: 19.99, currency: "usd" },
      yearly: { priceId: "price_year", amount: 149.99, currency: "usd" },
    },
  } as never);
  mocked.getReferralSummary.mockRejectedValue(new Error("none"));
  mocked.listPaymentMethods.mockResolvedValue({
    data: {
      data: [
        {
          id: "pm_1",
          card: { brand: "visa", last4: "4242", exp_month: 1, exp_year: 2030 },
          billing_details: { name: "Ada" },
        },
      ],
    },
  } as never);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Subscription pop-up", () => {
  it("shows real prices from Stripe and lets a new artist subscribe", async () => {
    render(<SubscriptionModal onClose={vi.fn()} />);

    expect(await screen.findByText("$19.99")).toBeInTheDocument();
    expect(screen.getByText("$149.99/year")).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).toBeNull();
    // not subscribed, so nothing is their current plan
    expect(screen.queryByText("Current Plan")).toBeNull();
    // enabled once the API says there's no signup offer
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Subscribe" })).toBeEnabled(),
    );
    expect(screen.getByText("Most Popular")).toBeInTheDocument();
    expect(screen.queryByText(/HIPAA/i)).toBeNull();
    expect(
      screen.getByText("Have a discount or referral code? You can add it on the next step."),
    ).toBeInTheDocument();
  });

  it("uses the build's plans when they're set, without asking the API", () => {
    vi.stubEnv("VITE_MONTHLY_PRICE", "19.99");
    vi.stubEnv("VITE_MONTHLY_PRICE_ID", "price_build_month");
    vi.stubEnv("VITE_YEARLY_PRICE", "149.99");
    vi.stubEnv("VITE_YEARLY_PRICE_ID", "price_build_year");
    render(<SubscriptionModal onClose={vi.fn()} currentPriceId="price_build_month" />);

    expect(screen.getByText("$19.99")).toBeInTheDocument();
    expect(screen.getAllByText(/Current/).length).toBeGreaterThan(0);
    expect(mocked.getSubscriptionPlans).not.toHaveBeenCalled();
  });

  it("takes a one-month code on the next step: $19.99 off the first payment", async () => {
    mocked.validateCoupon.mockResolvedValue({
      data: {
        isValid: true,
        message: "Coupon is valid",
        coupon: { name: "Academy", amount_off: 1999, duration: "once" },
      },
    } as never);
    mocked.createSubscription.mockResolvedValue({ data: { status: "active" } } as never);
    const user = userEvent.setup();
    render(<SubscriptionModal onClose={vi.fn()} />);

    await user.click(await screen.findByRole("button", { name: "Subscribe" }));
    await user.type(await screen.findByPlaceholderText("Discount or referral code"), "glowacademy");
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(
      await screen.findByText(/Academy — \$19\.99 off your first payment/),
    ).toBeInTheDocument();
    expect(mocked.validateCoupon).toHaveBeenCalledWith("GLOWACADEMY");
    expect(screen.getByText("$0.00")).toBeInTheDocument();

    const pay = screen.getByRole("button", { name: "Claim free month" });
    await waitFor(() => expect(pay).toBeEnabled());
    await user.click(pay);
    await waitFor(() =>
      expect(mocked.createSubscription).toHaveBeenCalledWith(
        "price_month",
        "pm_1",
        "GLOWACADEMY",
      ),
    );
  });
});

describe("Subscription pop-up with Starter", () => {
  it("offers Starter, with its limits, to an artist choosing a plan", async () => {
    withStarter();
    mocked.createSubscription.mockResolvedValue({ data: { status: "active" } } as never);
    const user = userEvent.setup();
    render(<SubscriptionModal onClose={vi.fn()} />);

    expect(await screen.findByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("Choose Your Plan")).toBeInTheDocument();
    expect(screen.getByText("$9.99/month")).toBeInTheDocument();
    expect(
      screen.getByText("Best for part-time artists — we've got you covered."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Every feature, for up to 10 clients and 5 appointments a month.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Pro Yearly")).toBeInTheDocument();

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Subscribe to Pro" }),
      ).toBeEnabled(),
    );
    await user.click(screen.getByRole("button", { name: /^Starter/ }));
    const pay = await screen.findByRole("button", { name: "Make Payment" });
    await waitFor(() => expect(pay).toBeEnabled());
    await user.click(pay);
    await waitFor(() =>
      expect(mocked.createSubscription).toHaveBeenCalledWith(
        "price_starter",
        "pm_1",
        undefined,
      ),
    );
  });

  it("hides Starter when it isn't set up", async () => {
    render(<SubscriptionModal onClose={vi.fn()} />);

    expect(await screen.findByText("$19.99")).toBeInTheDocument();
    expect(screen.queryByText("Starter")).toBeNull();
    expect(screen.getByText("Continue Creating Without Limits")).toBeInTheDocument();
  });

  it("never offers Starter to a Pro subscriber", async () => {
    withStarter();
    render(<SubscriptionModal onClose={vi.fn()} currentPriceId="price_month" />);

    expect(await screen.findByText("$19.99")).toBeInTheDocument();
    expect(screen.queryByText("Starter")).toBeNull();
    expect(screen.queryByText("$9.99/month")).toBeNull();
  });

  it("never offers Starter to a Pro subscriber known only from their account", async () => {
    withStarter();
    auth.user = { stripeSubscriptionActive: true, activeStripePriceId: "price_year" };
    render(<SubscriptionModal onClose={vi.fn()} />);

    expect(await screen.findByText("$19.99")).toBeInTheDocument();
    expect(screen.queryByText("Starter")).toBeNull();
  });

  it("lets a Starter subscriber upgrade to Pro monthly or yearly", async () => {
    withStarter();
    render(<SubscriptionModal onClose={vi.fn()} currentPriceId="price_starter" />);

    expect(
      await screen.findByRole("heading", { name: "Upgrade to Pro" }),
    ).toBeInTheDocument();
    // Starter is theirs, marked current; Pro monthly and yearly are upgrades
    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("Current")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upgrade to Pro" })).toBeInTheDocument();
    expect(screen.getByText("Upgrade")).toBeInTheDocument();
  });
});

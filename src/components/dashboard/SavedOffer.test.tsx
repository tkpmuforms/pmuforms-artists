import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../services/artistServices";
import { ATTRIBUTION_COOKIE, captureAttribution, savedCode } from "../../utils/attribution";
import SavedCodeNotice from "../../pages/auth/SavedCodeNotice";
import SavedOfferPrompt from "./SavedOfferPrompt";
import SubscriptionModal from "./SubScriptionModal";
import SelectPaymentMethodModal from "../payment/SelectPaymentMethodModal";
import { resetSavedOfferChecks } from "../../utils/savedOffer";

vi.mock("../../services/artistServices", async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  getSubscriptionPlans: vi.fn(),
  getReferralSummary: vi.fn(),
  listPaymentMethods: vi.fn(),
  validateCoupon: vi.fn(),
  createSubscription: vi.fn(),
  previewCode: vi.fn(),
  getSignupOffer: vi.fn(),
}));
vi.mock("react-redux", () => ({ useDispatch: () => vi.fn() }));
vi.mock("../../utils/authUtils", () => ({ refreshAuthUser: vi.fn() }));
vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));
type User = Record<string, unknown> | null;
let mockUser: User = null;
vi.mock("../../context/useAuth", () => ({ default: () => ({ user: mockUser }) }));

const mocked = vi.mocked(api);

/** someone scanned a QR code / opened a link with this code */
const arriveWith = (code: string) =>
  captureAttribution({ search: `?code=${code}`, pathname: "/" }, "");

const academyCode = () =>
  mocked.validateCoupon.mockResolvedValue({
    data: {
      isValid: true,
      coupon: { name: "1 month free", amount_off: 1999, duration: "once" },
    },
  } as never);

/** signed up, business name and services done, not subscribed */
const readyToPay = {
  userId: "a1",
  businessName: "Brow Bar",
  services: [{ id: 1 }],
  stripeSubscriptionActive: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  resetSavedOfferChecks();
  document.cookie = `${ATTRIBUTION_COOKIE}=; Path=/; Max-Age=0`;
  window.sessionStorage.clear();
  for (const key of ["VITE_MONTHLY_PRICE", "VITE_MONTHLY_PRICE_ID", "VITE_YEARLY_PRICE", "VITE_YEARLY_PRICE_ID"]) {
    vi.stubEnv(key, "");
  }
  mockUser = readyToPay;
  mocked.getSubscriptionPlans.mockResolvedValue({
    data: {
      monthly: { priceId: "price_month", amount: 19.99, currency: "usd" },
      yearly: { priceId: "price_year", amount: 149.99, currency: "usd" },
    },
  } as never);
  mocked.getReferralSummary.mockRejectedValue(new Error("none"));
  mocked.getSignupOffer.mockResolvedValue({ data: { offer: null } } as never);
  mocked.listPaymentMethods.mockResolvedValue({
    data: { data: [{ id: "pm_1", card: { brand: "visa", last4: "4242" }, billing_details: { name: "Ada" } }] },
  } as never);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("a code from a link or QR code", () => {
  it("says it's saved on the login page", async () => {
    vi.stubEnv("VITE_MONTHLY_PRICE", "19.99");
    vi.stubEnv("VITE_MONTHLY_PRICE_ID", "price_month");
    vi.stubEnv("VITE_YEARLY_PRICE", "149.99");
    vi.stubEnv("VITE_YEARLY_PRICE_ID", "price_year");
    arriveWith("pmuforms2026");
    mocked.previewCode.mockResolvedValue({
      data: { valid: true, code: "PMUFORMS2026", kind: "promotion", amountOffCents: 1999, duration: "once" },
    } as never);
    render(<SavedCodeNotice />);

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Code PMUFORMS2026 is saved: your first month is free when you subscribe.",
    );
    expect(mocked.previewCode).toHaveBeenCalledWith("PMUFORMS2026");
  });

  it("says so, and forgets it, when the code isn't valid", async () => {
    arriveWith("OLDCODE");
    mocked.previewCode.mockResolvedValue({
      data: { valid: false, code: "OLDCODE", message: "This code has expired" },
    } as never);
    render(<SavedCodeNotice />);

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Code OLDCODE isn't valid anymore.",
    );
    expect(savedCode()).toBeNull();
  });

  it("goes from the plans to $0.00 today and confirms the free month", async () => {
    arriveWith("PMUFORMS2026");
    academyCode();
    mocked.createSubscription.mockResolvedValue({
      data: {
        id: "sub_1",
        status: "active",
        items: { data: [{ current_period_end: Date.UTC(2026, 11, 24, 12) / 1000 }] },
      },
    } as never);
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<SubscriptionModal onClose={onClose} />);

    expect(await screen.findByText("Your first month is free")).toBeInTheDocument();
    expect(screen.getByText(/You pay \$0\.00 today, then \$19\.99\/month/)).toBeInTheDocument();
    // one month free: monthly only
    expect(screen.queryByText("Yearly")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Continue: $0.00 today" }));
    // already applied: nothing to type
    expect(await screen.findByText(/1 month free — \$19\.99 off your first payment/)).toBeInTheDocument();
    expect(screen.getByText("$0.00")).toBeInTheDocument();
    expect(mocked.validateCoupon).toHaveBeenCalledTimes(1);

    expect(
      screen.getByText("Add or select a card to claim it. You won't be charged today."),
    ).toBeInTheDocument();
    const pay = screen.getByRole("button", { name: "Claim free month" });
    await waitFor(() => expect(pay).toBeEnabled());
    await user.click(pay);

    const done = await screen.findByRole("dialog", { name: "You're subscribed" });
    expect(within(done).getByText("Your first month is free. You paid $0.00 today.")).toBeInTheDocument();
    expect(within(done).getByText(/Your next payment of \$19\.99 is on December 24, 2026/)).toBeInTheDocument();
    expect(mocked.createSubscription).toHaveBeenCalledWith("price_month", "pm_1", "PMUFORMS2026");
    expect(savedCode()).toBeNull();

    await user.click(within(done).getByRole("button", { name: "Done" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("explains a code this artist can't use and shows the usual plans", async () => {
    arriveWith("GLOWSTUD-7K2Q");
    mocked.validateCoupon.mockResolvedValue({
      data: { isValid: false, message: "You can't use your own referral code.", coupon: null },
    } as never);
    render(<SubscriptionModal onClose={vi.fn()} />);

    expect(
      await screen.findByText("Code GLOWSTUD-7K2Q can't be used: You can't use your own referral code."),
    ).toBeInTheDocument();
    expect(screen.getByText("Yearly")).toBeInTheDocument();
    expect(savedCode()).toBeNull();
  });

  it("opens the plans by itself once they're ready to pay, then keeps a banner", async () => {
    arriveWith("PMUFORMS2026");
    academyCode();
    const user = userEvent.setup();
    const { unmount } = render(<SavedOfferPrompt />);

    expect(await screen.findByText("Your first month is free")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button")[0]); // the pop-up's close button
    expect(await screen.findByText(/is saved: your first month is free when you subscribe/)).toBeInTheDocument();
    unmount();

    // another page: no second pop-up this visit, just the banner
    render(<SavedOfferPrompt />);
    expect(await screen.findByRole("button", { name: "Subscribe now" })).toBeInTheDocument();
    expect(screen.queryByText("Your first month is free")).toBeNull();
  });

  it("waits until the business name and services are set up", async () => {
    arriveWith("PMUFORMS2026");
    academyCode();
    mockUser = { ...readyToPay, businessName: "New Business" };
    render(<SavedOfferPrompt />);

    expect(await screen.findByRole("button", { name: "Subscribe now" })).toBeInTheDocument();
    expect(screen.queryByText("Your first month is free")).toBeNull();
  });

  it("does nothing for subscribers or without a code", async () => {
    mockUser = { ...readyToPay, stripeSubscriptionActive: true };
    arriveWith("PMUFORMS2026");
    const { container } = render(<SavedOfferPrompt />);
    expect(container).toBeEmptyDOMElement();
    expect(mocked.validateCoupon).not.toHaveBeenCalled();
    expect(mocked.getSignupOffer).not.toHaveBeenCalled();
  });

  describe("the signup offer, for artists without a code of their own", () => {
    const holidayOffer = () =>
      mocked.getSignupOffer.mockResolvedValue({
        data: { offer: { kind: "code", code: "PMUSTUDIO2027" } },
      } as never);

    it("opens the plans with the holiday code applied, then keeps a banner", async () => {
      holidayOffer();
      academyCode();
      const user = userEvent.setup();
      render(<SavedOfferPrompt />);

      expect(await screen.findByText("Your first month is free")).toBeInTheDocument();
      expect(mocked.validateCoupon).toHaveBeenCalledWith("PMUSTUDIO2027");
      expect(screen.getByText(/You pay \$0\.00 today/)).toBeInTheDocument();
      await user.click(screen.getAllByRole("button")[0]); // the pop-up's close button
      const banner = await screen.findByRole("status");
      expect(banner).toHaveTextContent(
        "Use code PMUSTUDIO2027: your first month is free when you subscribe.",
      );
    });

    it("prefers the code they arrived with", async () => {
      holidayOffer();
      academyCode();
      arriveWith("AZPMUACADEMY");
      render(<SavedOfferPrompt />);
      expect(await screen.findByText("Your first month is free")).toBeInTheDocument();
      expect(mocked.validateCoupon).toHaveBeenCalledWith("AZPMUACADEMY");
      expect(mocked.getSignupOffer).not.toHaveBeenCalled();
    });

    it("stays quiet when the signup code can't be used", async () => {
      holidayOffer();
      mocked.validateCoupon.mockResolvedValue({
        data: { isValid: false, message: "This code is only for new customers" },
      } as never);
      const { container } = render(<SavedOfferPrompt />);
      await waitFor(() => expect(mocked.validateCoupon).toHaveBeenCalled());
      await waitFor(() => expect(container).toBeEmptyDOMElement());
      expect(screen.queryByText(/can't be used/)).toBeNull();
    });

    it("shows the usual plans when there's no offer or the check fails", async () => {
      mocked.getSignupOffer.mockRejectedValue(new Error("offline"));
      const { container } = render(<SavedOfferPrompt />);
      await waitFor(() => expect(mocked.getSignupOffer).toHaveBeenCalled());
      expect(container).toBeEmptyDOMElement();
      expect(mocked.validateCoupon).not.toHaveBeenCalled();
    });
  });

  describe("the payment button", () => {
    const modal = (coupon: Parameters<typeof SelectPaymentMethodModal>[0]["initialCoupon"]) =>
      render(
        <SelectPaymentMethodModal
          onClose={vi.fn()}
          priceId="price_month"
          planAmount={19.99}
          planName="monthly"
          initialCoupon={coupon}
        />,
      );

    it("says Make Payment without a code", async () => {
      modal(null);
      expect(await screen.findByRole("button", { name: "Make Payment" })).toBeInTheDocument();
      expect(screen.getByText("Select or add card to make payment")).toBeInTheDocument();
    });

    it("shows what's due when a code takes part of it off", async () => {
      modal({ code: "PMU_20_OFF", description: "20% off", percentOff: 20, duration: "once" });
      expect(
        await screen.findByRole("button", { name: "Claim discount · Pay $15.99" }),
      ).toBeInTheDocument();
    });
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../services/artistServices";
import SelectPaymentMethodModal from "./SelectPaymentMethodModal";

vi.mock("../../services/artistServices", async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  getReferralSummary: vi.fn(),
  listPaymentMethods: vi.fn(),
  createSubscription: vi.fn(),
}));
vi.mock("react-redux", () => ({ useDispatch: () => vi.fn() }));
vi.mock("../../utils/authUtils", () => ({ refreshAuthUser: vi.fn() }));
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const mocked = vi.mocked(api);

const card = {
  id: "pm_1",
  name: "Ada",
  lastFour: "4242",
  brand: "visa" as const,
  isDefault: true,
  color: "#000",
};

const referral = (available: boolean) =>
  ({
    data: {
      code: "X-1234",
      link: "https://pmuforms.com/?ref=X-1234",
      rewardCents: 1999,
      invited: 0,
      paid: 0,
      rewardsEarned: 0,
      creditEarnedCents: 0,
      maxRewardsPerYear: 12,
      referralDiscountAvailable: available,
    },
  }) as never;

describe("SelectPaymentMethodModal: referral discount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.dataLayer = undefined;
  });

  it("shows the discount an invited artist gets on their first payment", async () => {
    mocked.getReferralSummary.mockResolvedValue(referral(true));
    render(
      <SelectPaymentMethodModal
        cards={[card]}
        onClose={vi.fn()}
        priceId="price_monthly"
        planAmount={19.99}
      />,
    );

    expect(
      await screen.findByText(/Referral discount: \$19\.99 off your first payment/),
    ).toBeInTheDocument();
    expect(screen.getByText("$0.00")).toBeInTheDocument();
  });

  it("shows nothing for other artists or plan changes", async () => {
    mocked.getReferralSummary.mockResolvedValue(referral(false));
    const { unmount } = render(
      <SelectPaymentMethodModal cards={[card]} onClose={vi.fn()} priceId="p" planAmount={19.99} />,
    );
    await waitFor(() => expect(mocked.getReferralSummary).toHaveBeenCalled());
    expect(screen.queryByText(/Referral discount/)).toBeNull();
    unmount();

    mocked.getReferralSummary.mockResolvedValue(referral(true));
    render(
      <SelectPaymentMethodModal
        cards={[card]}
        onClose={vi.fn()}
        priceId="p"
        planAmount={19.99}
        hasActiveSubscription
      />,
    );
    await waitFor(() => expect(mocked.getReferralSummary).toHaveBeenCalledTimes(2));
    expect(screen.queryByText(/Referral discount/)).toBeNull();
  });

  it("still lets the artist subscribe when the referral lookup fails", async () => {
    mocked.getReferralSummary.mockRejectedValue(new Error("offline"));
    mocked.createSubscription.mockResolvedValue({ data: { status: "active" } } as never);
    const onPaymentSuccess = vi.fn();
    const user = userEvent.setup();
    render(
      <SelectPaymentMethodModal
        cards={[card]}
        onClose={vi.fn()}
        priceId="price_monthly"
        planAmount={19.99}
        onPaymentSuccess={onPaymentSuccess}
      />,
    );

    const pay = await screen.findByRole("button", { name: /pay|subscribe/i });
    await user.click(pay);
    await waitFor(() => expect(onPaymentSuccess).toHaveBeenCalled());
    expect(mocked.createSubscription).toHaveBeenCalledWith("price_monthly", "pm_1", undefined);
  });
});

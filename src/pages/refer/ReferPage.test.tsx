import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../services/artistServices";
import ReferPage from "./ReferPage";

vi.mock("../../services/artistServices", async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  getReferralSummary: vi.fn(),
}));
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const mocked = vi.mocked(api);

const summary = (over: Partial<api.ReferralSummary> = {}) =>
  ({
    data: {
      code: "GLOWSTUD-7K2Q",
      link: "https://pmuforms.com/?ref=GLOWSTUD-7K2Q",
      rewardCents: 1999,
      invited: 3,
      paid: 1,
      rewardsEarned: 1,
      creditEarnedCents: 1999,
      maxRewardsPerYear: 12,
      referralDiscountAvailable: false,
      ...over,
    },
  }) as never;

describe("ReferPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the artist's link, what each side gets and their numbers", async () => {
    mocked.getReferralSummary.mockResolvedValue(summary());
    render(<ReferPage />);

    expect(
      await screen.findByRole("heading", { name: "Refer an artist, get $19.99" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Your referral link", { selector: "input" })).toHaveValue(
      "https://pmuforms.com/?ref=GLOWSTUD-7K2Q",
    );
    expect(screen.getByText("GLOWSTUD-7K2Q")).toBeInTheDocument();
    const stats = screen.getByRole("region", { name: "Your referrals" });
    expect(stats).toHaveTextContent("3Signed up");
    expect(stats).toHaveTextContent("1Paid");
    expect(stats).toHaveTextContent("$19.99Credit earned");

    // the text message carries the link
    const sms = screen.getByRole("link", { name: /Text a friend/ });
    expect(decodeURIComponent(sms.getAttribute("href")!)).toContain(
      "https://pmuforms.com/?ref=GLOWSTUD-7K2Q",
    );
  });

  it("copies the link", async () => {
    mocked.getReferralSummary.mockResolvedValue(summary());
    const user = userEvent.setup();
    render(<ReferPage />);

    await user.click(await screen.findByRole("button", { name: /Copy link/ }));
    expect(await navigator.clipboard.readText()).toBe(
      "https://pmuforms.com/?ref=GLOWSTUD-7K2Q",
    );
    expect(screen.getByRole("button", { name: /Copied/ })).toBeInTheDocument();
  });

  it("says so when the link can't load", async () => {
    mocked.getReferralSummary.mockRejectedValue(new Error("offline"));
    render(<ReferPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't load your referral link",
    );
  });
});

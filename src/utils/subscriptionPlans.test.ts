import { describe, expect, it } from "vitest";
import { planNameOf, plansFromBuild, planTierOf } from "./subscriptionPlans";

const pro = {
  VITE_MONTHLY_PRICE: "19.99",
  VITE_MONTHLY_PRICE_ID: "price_month",
  VITE_YEARLY_PRICE: "149.99",
  VITE_YEARLY_PRICE_ID: "price_year",
};

describe("plansFromBuild", () => {
  it("keeps working without Starter: Starter is null and not offered", () => {
    expect(plansFromBuild(pro)).toEqual({
      monthly: { priceId: "price_month", amount: 19.99, currency: "usd" },
      yearly: { priceId: "price_year", amount: 149.99, currency: "usd" },
      starter: null,
    });
  });

  it("adds Starter when both its settings are there", () => {
    expect(
      plansFromBuild({
        ...pro,
        VITE_STARTER_PRICE: "9.99",
        VITE_STARTER_PRICE_ID: "price_starter",
      })?.starter,
    ).toEqual({ priceId: "price_starter", amount: 9.99, currency: "usd" });
    // half set up is not set up
    expect(
      plansFromBuild({ ...pro, VITE_STARTER_PRICE_ID: "price_starter" })?.starter,
    ).toBeNull();
  });

  it("needs both Pro plans, Starter or not", () => {
    expect(
      plansFromBuild({
        VITE_MONTHLY_PRICE: "19.99",
        VITE_MONTHLY_PRICE_ID: "price_month",
        VITE_STARTER_PRICE: "9.99",
        VITE_STARTER_PRICE_ID: "price_starter",
      }),
    ).toBeNull();
  });
});

describe("planTierOf", () => {
  const plans = {
    monthly: { priceId: "price_month", amount: 19.99, currency: "usd" },
    yearly: { priceId: "price_year", amount: 149.99, currency: "usd" },
    starter: { priceId: "price_starter", amount: 9.99, currency: "usd" },
  };

  it("is Starter only for an active Starter web subscription", () => {
    expect(
      planTierOf(
        { stripeSubscriptionActive: true, activeStripePriceId: "price_starter" },
        plans,
      ),
    ).toBe("starter");
    expect(
      planTierOf(
        { stripeSubscriptionActive: true, activeStripePriceId: "price_month" },
        plans,
      ),
    ).toBe("pro");
    expect(
      planTierOf(
        {
          stripeSubscriptionActive: true,
          activeStripePriceId: "price_starter",
          appStorePurchaseActive: true,
        },
        plans,
      ),
    ).toBe("pro");
    expect(planTierOf({ activeStripePriceId: "price_starter" }, plans)).toBe("none");
    expect(planTierOf(null, plans)).toBe("none");
  });

  it("names plans for analytics", () => {
    expect(planNameOf("price_starter", plans)).toBe("starter");
    expect(planNameOf("price_year", plans)).toBe("yearly");
    expect(planNameOf("price_month", plans)).toBe("monthly");
    expect(planNameOf("price_other", plans)).toBe("other");
  });
});

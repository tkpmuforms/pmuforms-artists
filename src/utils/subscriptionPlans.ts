import { useEffect, useState } from "react";
import {
  getSubscriptionPlans,
  SubscriptionPlans,
} from "../services/artistServices";

const plan = (priceId?: string, amount?: string) => {
  const value = Number(amount);
  return priceId && amount && Number.isFinite(value) && value > 0
    ? { priceId, amount: value, currency: "usd" }
    : null;
};

/**
 * The plans this build was set up with, if Pro monthly and yearly are both
 * complete. Starter is optional: without VITE_STARTER_PRICE_ID and
 * VITE_STARTER_PRICE it's null and not offered.
 */
export const plansFromBuild = (
  env: Record<string, string | undefined> = import.meta.env,
): SubscriptionPlans | null => {
  const monthly = plan(env.VITE_MONTHLY_PRICE_ID, env.VITE_MONTHLY_PRICE);
  const yearly = plan(env.VITE_YEARLY_PRICE_ID, env.VITE_YEARLY_PRICE);
  const starter = plan(env.VITE_STARTER_PRICE_ID, env.VITE_STARTER_PRICE);
  return monthly && yearly ? { monthly, yearly, starter } : null;
};

/** Starter's limits; Pro has none (the API has the same numbers) */
export const STARTER_LIMITS = { clients: 10, appointmentsPerMonth: 5 } as const;

export type PlanTier = "starter" | "pro" | "none";

/**
 * Which plan an account is on, as the API works it out: Starter is the
 * Starter Stripe price; any other subscription (other prices, the App Store)
 * is Pro.
 */
export const planTierOf = (
  user?: {
    appStorePurchaseActive?: boolean;
    stripeSubscriptionActive?: boolean;
    activeStripePriceId?: string | null;
  } | null,
  plans?: SubscriptionPlans | null,
): PlanTier => {
  if (user?.appStorePurchaseActive) return "pro";
  if (!user?.stripeSubscriptionActive) return "none";
  const starterId = plans?.starter?.priceId;
  return starterId && user.activeStripePriceId === starterId ? "starter" : "pro";
};

/** for analytics and the payment step */
export const planNameOf = (
  priceId: string | undefined,
  plans?: SubscriptionPlans | null,
): "starter" | "monthly" | "yearly" | "other" => {
  if (!priceId) return "other";
  if (priceId === plans?.starter?.priceId) return "starter";
  if (priceId === plans?.yearly?.priceId) return "yearly";
  if (priceId === plans?.monthly?.priceId) return "monthly";
  return "other";
};

/**
 * Starter, Pro monthly and Pro yearly: from this build's settings when
 * they're there, otherwise from Stripe through the API.
 */
export function useSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlans | null>(() =>
    plansFromBuild(),
  );
  const [error, setError] = useState(false);

  useEffect(() => {
    if (plans) return;
    let active = true;
    getSubscriptionPlans()
      .then((response) => {
        if (active) setPlans(response.data);
      })
      .catch((err) => {
        console.error("Error loading plans:", err);
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [plans]);

  return { plans, loading: !plans && !error, error };
}

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

/** the plans this build was set up with, if both are complete */
export const plansFromBuild = (
  env: Record<string, string | undefined> = import.meta.env,
): SubscriptionPlans | null => {
  const monthly = plan(env.VITE_MONTHLY_PRICE_ID, env.VITE_MONTHLY_PRICE);
  const yearly = plan(env.VITE_YEARLY_PRICE_ID, env.VITE_YEARLY_PRICE);
  return monthly && yearly ? { monthly, yearly } : null;
};

/**
 * The monthly and yearly plans: from this build's settings when they're
 * there, otherwise from Stripe through the API.
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

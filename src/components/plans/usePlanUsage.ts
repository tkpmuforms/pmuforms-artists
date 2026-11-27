import { useEffect, useState } from "react";
import useAuth from "../../context/useAuth";
import { getPlanUsage, type PlanUsage } from "../../services/artistServices";
import { browserTimeZone } from "../../utils/planLimits";

/**
 * The account's plan and usage, from the API. Only web subscriptions can be
 * Starter, so nobody else asks.
 */
export const usePlanUsage = (refreshKey: unknown = 0) => {
  const { user } = useAuth();
  const mightBeStarter =
    !!user?.stripeSubscriptionActive && !user?.appStorePurchaseActive;
  const [usage, setUsage] = useState<PlanUsage | null>(null);

  useEffect(() => {
    if (!mightBeStarter) {
      setUsage(null);
      return;
    }
    let active = true;
    Promise.resolve()
      .then(() => getPlanUsage(browserTimeZone()))
      .then((response) => {
        if (active) setUsage(response?.data ?? null);
      })
      // the meter is a nicety: say nothing when it can't load
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [mightBeStarter, refreshKey]);

  return usage;
};

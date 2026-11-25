export interface SubscriptionData {
  id: string;
  status: string;
  currentPeriodEnd: number;
  currentPeriodStart: number;
  priceId: string;
  interval: string;
  intervalCount: number;
  amount: number;
  currency: string;
  cancelAt?: number;
  /** cancelled: runs to the end of the paid period, then stops */
  cancelAtPeriodEnd?: boolean;
  /** the first payment was $0 thanks to a code */
  freeStart?: { code: string | null } | null;
}

interface StripeSubscriptionLike {
  latest_invoice?:
    | string
    | { billing_reason?: string; total?: number; subtotal?: number }
    | null;
  discounts?: Array<string | { promotion_code?: string | { code?: string } | null }>;
}

/** a $0 first invoice, and the code that made it so */
const freeStartOf = (
  subscription: StripeSubscriptionLike,
): SubscriptionData["freeStart"] => {
  const invoice = subscription?.latest_invoice;
  if (
    !invoice ||
    typeof invoice !== "object" ||
    invoice.billing_reason !== "subscription_create" ||
    invoice.total !== 0 ||
    !((invoice.subtotal ?? 0) > 0)
  ) {
    return null;
  }
  let code: string | null = null;
  for (const discount of subscription.discounts || []) {
    if (typeof discount === "object" && typeof discount.promotion_code === "object") {
      code = discount.promotion_code?.code ?? null;
      if (code) break;
    }
  }
  return { code: code ?? null };
};

const SUBSCRIPTION_KEY = "pmu_subscription_data";

export const saveSubscriptionToStorage = (subscriptionData: any): void => {
  try {
    const data: SubscriptionData = {
      id: subscriptionData.id,
      status: subscriptionData.status,
      currentPeriodEnd:
        subscriptionData.items.data[0]?.current_period_end ||
        subscriptionData.current_period_end,
      currentPeriodStart:
        subscriptionData.items.data[0]?.current_period_start ||
        subscriptionData.current_period_start,
      priceId:
        subscriptionData.items.data[0]?.price.id || subscriptionData.plan?.id,
      interval:
        subscriptionData.items.data[0]?.price.recurring?.interval ||
        subscriptionData.plan?.interval,
      intervalCount:
        subscriptionData.items.data[0]?.price.recurring?.interval_count ||
        subscriptionData.plan?.interval_count ||
        1,
      amount:
        subscriptionData.items.data[0]?.price.unit_amount ||
        subscriptionData.plan?.amount,
      currency:
        subscriptionData.items.data[0]?.price.currency ||
        subscriptionData.currency,
      cancelAt: subscriptionData.cancel_at,
      cancelAtPeriodEnd: !!subscriptionData.cancel_at_period_end,
      freeStart: freeStartOf(subscriptionData),
    };

    localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving subscription to storage:", error);
  }
};

export const getSubscriptionFromStorage = (): SubscriptionData | null => {
  try {
    const data = localStorage.getItem(SUBSCRIPTION_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error getting subscription from storage:", error);
    return null;
  }
};

export const clearSubscriptionFromStorage = (): void => {
  try {
    localStorage.removeItem(SUBSCRIPTION_KEY);
  } catch (error) {
    console.error("Error clearing subscription from storage:", error);
  }
};

export const formatNextBillingDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const getPlanName = (
  interval: string,
  intervalCount: number = 1
): string => {
  if (interval === "week") {
    return intervalCount === 1 ? "Weekly Plan" : `${intervalCount}-Week Plan`;
  }
  if (interval === "month") {
    return intervalCount === 1 ? "Monthly Plan" : `${intervalCount}-Month Plan`;
  }
  if (interval === "year") {
    return intervalCount === 1 ? "Yearly Plan" : `${intervalCount}-Year Plan`;
  }
  return "Subscription Plan";
};

export const isSubscriptionActive = (status: string): boolean => {
  return ["active", "trialing"].includes(status.toLowerCase());
};

/** whether the artist has a paid plan, from the web (Stripe) or the app stores */
export const isArtistSubscribed = (
  user?: {
    appStorePurchaseActive?: boolean;
    stripeSubscriptionActive?: boolean;
  } | null,
): boolean => !!(user?.appStorePurchaseActive || user?.stripeSubscriptionActive);

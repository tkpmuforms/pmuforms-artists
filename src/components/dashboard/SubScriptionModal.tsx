"use client";

import type React from "react";
import { X, Check, Star } from "lucide-react";
import { useState } from "react";
import "./subscription-modal.scss";
import SelectPaymentMethodModal from "../payment/SelectPaymentMethodModal";
import {
  planNameOf,
  planTierOf,
  STARTER_LIMITS,
  useSubscriptionPlans,
} from "../../utils/subscriptionPlans";
import { priceAfter, useSavedOffer } from "../../utils/savedOffer";
import useAuth from "../../context/useAuth";

interface SubscriptionModalProps {
  onClose: () => void;
  onShowFeatures?: () => void;
  onSubscribe?: () => void;
  currentPriceId?: string;
}

const features = [
  "Unlimited clients & appointments",
  "Unlimited client forms",
  "Digital signatures",
  "Secure cloud storage",
  "Instant PDF export",
  "Pre-care & aftercare emails",
];

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  onClose,
  onShowFeatures,
  onSubscribe,
  currentPriceId,
}) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPriceId, setSelectedPriceId] = useState<string>("");

  const { user } = useAuth();
  const { plans, loading: plansLoading } = useSubscriptionPlans();
  const monthlyPrice = plans?.monthly?.amount;
  const yearlyPrice = plans?.yearly?.amount;
  const monthlyPriceId = plans?.monthly?.priceId ?? "";
  const yearlyPriceId = plans?.yearly?.priceId ?? "";
  const starter = plans?.starter ?? null;

  // the plan they're on: from the subscription when the page has it
  const tier = currentPriceId
    ? currentPriceId === starter?.priceId
      ? "starter"
      : "pro"
    : planTierOf(user, plans);
  const onStarter = tier === "starter";
  // Starter is for a first subscription or coming back; Pro subscribers can't
  // switch down to it (the API refuses that too)
  const showStarter = !!starter && tier !== "pro";

  const yearlyPricePerWeek = yearlyPrice ? yearlyPrice / 52 : null;
  const monthlyPricePerWeek = monthlyPrice ? monthlyPrice / 4.33 : null;

  const yearlyDiscount =
    monthlyPrice && yearlyPrice
      ? ((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100
      : 0;
  const money = (value?: number | null) =>
    value == null ? "…" : `$${value.toFixed(2).replace(/\.00$/, "")}`;

  // a code from a link or QR code, for an artist's first subscription
  const offer = useSavedOffer(!currentPriceId);
  const codeOffer = offer.status === "ready" ? offer.coupon : null;
  const todayPrice =
    codeOffer && monthlyPrice != null ? priceAfter(monthlyPrice, codeOffer) : null;
  const firstMonthFree = todayPrice === 0;

  const handleSubscribeClick = (priceId: string) => {
    setSelectedPriceId(priceId);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    if (onSubscribe) {
      onSubscribe();
    }
    onClose();
  };

  // a missing plan id is never the artist's plan
  const isCurrentPlan = (priceId: string) =>
    !!priceId && !!currentPriceId && currentPriceId === priceId;

  const getButtonText = (planName: string, priceId: string) => {
    if (isCurrentPlan(priceId)) return "Current Plan";
    if (onStarter) return "Upgrade to Pro";
    if (currentPriceId) return "Upgrade Subscription";
    if (showStarter) return "Subscribe to Pro";
    return planName === "monthly" ? "Subscribe" : "Continue with Yearly Plan";
  };

  const selectedPlanName = planNameOf(selectedPriceId, plans);

  return (
    <>
      <div className="subscription-modal">
        <div className="subscription-modal__overlay" onClick={onClose} />
        <div className="subscription-modal__content">
          <button className="subscription-modal__close" onClick={onClose}>
            <X size={20} />
          </button>

          <div className="subscription-modal__header">
            <div className="subscription-modal__logo">
              <div className="pmu-logo">
                PMU
                <br />
                Forms
              </div>
            </div>
            {codeOffer ? (
              <>
                <h2>
                  {firstMonthFree
                    ? "Your first month is free"
                    : "Your discount is ready"}
                </h2>
                <p className="subscription-modal__offer" role="status">
                  🎁 Code <strong>{codeOffer.code}</strong> is applied:{" "}
                  {codeOffer.description.replace(/^.* — /, "")}.
                  {todayPrice != null &&
                    ` You pay $${todayPrice.toFixed(2)} today, then ${money(monthlyPrice)}/month. Cancel anytime.`}
                </p>
              </>
            ) : (
              <>
                <h2>
                  {onStarter
                    ? "Upgrade to Pro"
                    : showStarter
                      ? "Choose Your Plan"
                      : "Continue Creating Without Limits"}
                </h2>
                <p>
                  {onStarter
                    ? "Unlimited clients and appointments. Your plan switches to Pro right away."
                    : currentPriceId
                      ? "Select a new plan to switch your subscription"
                      : showStarter
                        ? "Every plan includes all features. Pro has no limits."
                        : "Keep access to your PMU client forms and all premium features"}
                </p>
                {offer.status === "checking" && (
                  <p className="subscription-modal__offer" role="status">
                    {offer.code
                      ? `Checking your code ${offer.code}…`
                      : "Checking for offers…"}
                  </p>
                )}
                {offer.status === "unusable" && (
                  <p
                    className="subscription-modal__offer subscription-modal__offer--error"
                    role="status"
                  >
                    Code {offer.code} can't be used: {offer.message}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="subscription-modal__featured">
            <div className="featured-plan">
              <div className="featured-plan__badges">
                <span className="featured-plan__badge featured-plan__badge--popular">
                  Most Popular
                </span>
              </div>

              {isCurrentPlan(monthlyPriceId) && (
                <div className="featured-plan__current-tag">Current Plan</div>
              )}

              {showStarter && <div className="featured-plan__name">Pro</div>}

              <div className="featured-plan__price-row">
                <span className="featured-plan__amount">
                  {money(monthlyPrice)}
                </span>
                <span className="featured-plan__period">/month</span>
              </div>
              <div className="featured-plan__subtitle">
                {monthlyPricePerWeek
                  ? `Only ${money(monthlyPricePerWeek)}/week`
                  : plansLoading
                    ? "Loading prices…"
                    : "Prices are unavailable right now. Please try again shortly."}
              </div>

              <ul className="featured-plan__features">
                {features.map((feature, i) => (
                  <li key={i}>
                    <Check size={16} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className="featured-plan__cta"
                onClick={() =>
                  monthlyPriceId &&
                  !isCurrentPlan(monthlyPriceId) &&
                  handleSubscribeClick(monthlyPriceId)
                }
                disabled={
                  !monthlyPriceId ||
                  isCurrentPlan(monthlyPriceId) ||
                  // wait for the code check, so it's on the next step
                  offer.status === "checking"
                }
              >
                {codeOffer && todayPrice != null
                  ? `Continue: $${todayPrice.toFixed(2)} today`
                  : getButtonText("monthly", monthlyPriceId)}
              </button>

              {!currentPriceId && !codeOffer && (
                <p className="featured-plan__code-hint">
                  Have a discount or referral code? You can add it on the next step.
                </p>
              )}

              <p className="featured-plan__guarantee">
                Cancel anytime &middot; 7-day money-back guarantee
              </p>
            </div>
          </div>

          {/* a link's code is one month free: monthly only */}
          {yearlyPriceId && !codeOffer && (
          <div className="subscription-modal__alt-plan">
            <div
              className={`alt-plan ${
                isCurrentPlan(yearlyPriceId) ? "alt-plan--current" : ""
              }`}
              onClick={() =>
                !isCurrentPlan(yearlyPriceId) &&
                handleSubscribeClick(yearlyPriceId)
              }
            >
              <div className="alt-plan__info">
                <div className="alt-plan__badges">
                  <span className="featured-plan__badge featured-plan__badge--recommended">
                    Recommended
                  </span>
                  <span className="featured-plan__badge featured-plan__badge--value">
                    Best Value
                  </span>
                  {yearlyDiscount > 0 && (
                    <span className="featured-plan__badge featured-plan__badge--save">
                      Save {Math.round(yearlyDiscount)}%
                    </span>
                  )}
                </div>
                <span className="alt-plan__name">
                  {showStarter ? "Pro Yearly" : "Yearly"}
                </span>
                <span className="alt-plan__price">{money(yearlyPrice)}/year</span>
                <span className="alt-plan__weekly">
                  ({money(yearlyPricePerWeek)}/week)
                </span>
              </div>
              {isCurrentPlan(yearlyPriceId) ? (
                <span className="alt-plan__current-badge">Current</span>
              ) : (
                <span className="alt-plan__select">
                  {onStarter ? "Upgrade" : currentPriceId ? "Switch" : "Select"}
                </span>
              )}
            </div>
          </div>
          )}

          {showStarter && starter && (
            <div className="subscription-modal__alt-plan">
              <div
                className={`alt-plan alt-plan--starter ${
                  onStarter ? "alt-plan--current" : ""
                }`}
                onClick={() =>
                  !onStarter &&
                  offer.status !== "checking" &&
                  handleSubscribeClick(starter.priceId)
                }
                role="button"
                aria-label={`Starter, ${money(starter.amount)} a month`}
              >
                <div className="alt-plan__info">
                  <span className="alt-plan__name">Starter</span>
                  <span className="alt-plan__price">
                    {money(starter.amount)}/month
                  </span>
                  <span className="alt-plan__tagline">
                    Best for part-time artists — we've got you covered.
                  </span>
                  <span className="alt-plan__limits">
                    Every feature, for up to {STARTER_LIMITS.clients} clients
                    and {STARTER_LIMITS.appointmentsPerMonth} appointments a
                    month.
                  </span>
                </div>
                {onStarter ? (
                  <span className="alt-plan__current-badge">Current</span>
                ) : (
                  <span className="alt-plan__select">Select</span>
                )}
              </div>
            </div>
          )}

          <div className="subscription-modal__testimonial">
            <div className="testimonial">
              <div className="testimonial__stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
              <p className="testimonial__quote">
                &ldquo;PMU Forms saves me 4+ hours per week.&rdquo;
              </p>
              <p className="testimonial__author">
                &mdash; Sarah M., Brow Artist
              </p>
            </div>
          </div>

          <p className="subscription-modal__social-proof">
            Join 4,000+ PMU artists
          </p>

          <div className="subscription-modal__actions"></div>
        </div>
      </div>

      {showPaymentModal && (
        <SelectPaymentMethodModal
          cards={[]}
          onClose={() => setShowPaymentModal(false)}
          priceId={selectedPriceId}
          planAmount={
            selectedPlanName === "starter"
              ? starter?.amount
              : selectedPlanName === "yearly"
                ? yearlyPrice
                : monthlyPrice
          }
          planName={
            selectedPlanName === "other" ? "monthly" : selectedPlanName
          }
          onPaymentSuccess={handlePaymentSuccess}
          hasActiveSubscription={!!currentPriceId || onStarter}
          // a link's code is for a monthly plan: Pro monthly or Starter
          initialCoupon={
            selectedPlanName === "monthly" || selectedPlanName === "starter"
              ? codeOffer
              : null
          }
        />
      )}
    </>
  );
};

export default SubscriptionModal;

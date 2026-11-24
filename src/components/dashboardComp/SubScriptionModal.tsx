"use client";

import type React from "react";
import { X, Check, Star } from "lucide-react";
import { useState } from "react";
import "./subscription-modal.scss";
import SelectPaymentMethodModal from "../payment/SelectPaymentMethodModal";
import { useSubscriptionPlans } from "../../utils/subscriptionPlans";

interface SubscriptionModalProps {
  onClose: () => void;
  onShowFeatures?: () => void;
  onSubscribe?: () => void;
  currentPriceId?: string;
}

const features = [
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

  const { plans, loading: plansLoading } = useSubscriptionPlans();
  const monthlyPrice = plans?.monthly?.amount;
  const yearlyPrice = plans?.yearly?.amount;
  const monthlyPriceId = plans?.monthly?.priceId ?? "";
  const yearlyPriceId = plans?.yearly?.priceId ?? "";

  const yearlyPricePerWeek = yearlyPrice ? yearlyPrice / 52 : null;
  const monthlyPricePerWeek = monthlyPrice ? monthlyPrice / 4.33 : null;

  const yearlyDiscount =
    monthlyPrice && yearlyPrice
      ? ((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100
      : 0;
  const money = (value?: number | null) =>
    value == null ? "…" : `$${value.toFixed(2).replace(/\.00$/, "")}`;

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
    if (currentPriceId) return "Upgrade Subscription";
    return planName === "monthly" ? "Subscribe" : "Continue with Yearly Plan";
  };

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
            <h2>Continue Creating Without Limits</h2>
            <p>
              {currentPriceId
                ? "Select a new plan to switch your subscription"
                : "Keep access to your PMU client forms and all premium features"}
            </p>
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
                disabled={!monthlyPriceId || isCurrentPlan(monthlyPriceId)}
              >
                {getButtonText("monthly", monthlyPriceId)}
              </button>

              {!currentPriceId && (
                <p className="featured-plan__code-hint">
                  Have a discount code? You can add it on the next step.
                </p>
              )}

              <p className="featured-plan__guarantee">
                Cancel anytime &middot; 7-day money-back guarantee
              </p>
            </div>
          </div>

          {yearlyPriceId && (
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
                <span className="alt-plan__name">Yearly</span>
                <span className="alt-plan__price">{money(yearlyPrice)}/year</span>
                <span className="alt-plan__weekly">
                  ({money(yearlyPricePerWeek)}/week)
                </span>
              </div>
              {isCurrentPlan(yearlyPriceId) ? (
                <span className="alt-plan__current-badge">Current</span>
              ) : (
                <span className="alt-plan__select">
                  {currentPriceId ? "Switch" : "Select"}
                </span>
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
          planAmount={selectedPriceId === yearlyPriceId ? yearlyPrice : monthlyPrice}
          planName={selectedPriceId === yearlyPriceId ? "yearly" : "monthly"}
          onPaymentSuccess={handlePaymentSuccess}
          hasActiveSubscription={!!currentPriceId}
        />
      )}
    </>
  );
};

export default SubscriptionModal;

"use client";

import type React from "react";
import { X } from "lucide-react";
import { useState } from "react";
import "./subscription-modal.scss";
import SelectPaymentMethodModal from "../payment/SelectPaymentMethodModal";

interface SubscriptionModalProps {
  onClose: () => void;
  onShowFeatures?: () => void;
  onSubscribe?: () => void;
  currentPriceId?: string;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  onClose,
  onShowFeatures,
  onSubscribe,
  currentPriceId,
}) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPriceId, setSelectedPriceId] = useState<string>("");

  const weeklyPrice = Number(import.meta.env.VITE_WEEKLY_PRICE);
  const monthlyPrice = Number(import.meta.env.VITE_MONTHLY_PRICE);
  const yearlyPrice = Number(import.meta.env.VITE_YEARLY_PRICE);

  const monthlyPricePerWeek = monthlyPrice / 4.33;
  const yearlyPricePerWeek = yearlyPrice / 52;

  const monthlyDiscount =
    ((weeklyPrice * 4.33 - monthlyPrice) / (weeklyPrice * 4.33)) * 100;
  const yearlyDiscount =
    ((weeklyPrice * 52 - yearlyPrice) / (weeklyPrice * 52)) * 100;

  const pricingPlans = [
    {
      name: import.meta.env.VITE_WEEKLY_NAME,
      price: `$${weeklyPrice}`,
      period: import.meta.env.VITE_WEEKLY_PERIOD,
      subtitle: import.meta.env.VITE_WEEKLY_SUBTITLE,
      badge: import.meta.env.VITE_WEEKLY_BADGE,
      popular: import.meta.env.VITE_WEEKLY_POPULAR === "true",
      priceId: import.meta.env.VITE_WEEKLY_PRICE_ID,
    },
    {
      name: import.meta.env.VITE_MONTHLY_NAME,
      price: `$${monthlyPrice}`,
      period: import.meta.env.VITE_MONTHLY_PERIOD,
      subtitle:
        import.meta.env.VITE_MONTHLY_BADGE_PERCENT === "auto"
          ? `(only $${monthlyPricePerWeek.toFixed(2)} / week)`
          : `(only $${monthlyPricePerWeek.toFixed(2)} / week)`,
      badge:
        import.meta.env.VITE_MONTHLY_BADGE_PERCENT === "auto"
          ? `-${Math.round(monthlyDiscount)}%`
          : import.meta.env.VITE_MONTHLY_BADGE_PERCENT || "",
      popular: import.meta.env.VITE_MONTHLY_POPULAR === "true",
      priceId: import.meta.env.VITE_MONTHLY_PRICE_ID,
    },
    {
      name: import.meta.env.VITE_YEARLY_NAME,
      price: `$${yearlyPrice}`,
      period: import.meta.env.VITE_YEARLY_PERIOD,
      subtitle:
        import.meta.env.VITE_YEARLY_BADGE_PERCENT === "auto"
          ? `(only $${yearlyPricePerWeek.toFixed(2)} / week)`
          : `(only $${yearlyPricePerWeek.toFixed(2)} / week)`,
      badge:
        import.meta.env.VITE_YEARLY_BADGE_PERCENT === "auto"
          ? `-${Math.round(yearlyDiscount)}%`
          : import.meta.env.VITE_YEARLY_BADGE_PERCENT || "",
      popular: import.meta.env.VITE_YEARLY_POPULAR === "true",
      priceId: import.meta.env.VITE_YEARLY_PRICE_ID,
    },
  ];

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

  const isCurrentPlan = (priceId: string) => {
    return currentPriceId === priceId;
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
            <h2>
              {currentPriceId
                ? "Change Your PMU Subscription"
                : "Reactivate your PMU Subscription"}
            </h2>
            <p>
              {currentPriceId
                ? "Select a new plan to switch your subscription"
                : "Subscribe to unlock and keep enjoying the ultimate experience on PMU Forms"}
            </p>
          </div>

          <div className="subscription-modal__pricing">
            <h3>SELECT YOUR PLAN</h3>
            <div className="pricing-plans">
              {pricingPlans.map((plan, index) => (
                <div
                  key={index}
                  className={`pricing-plan ${
                    plan.popular && !currentPriceId
                      ? "pricing-plan--popular"
                      : ""
                  } ${
                    isCurrentPlan(plan.priceId)
                      ? "pricing-plan--current pricing-plan--popular"
                      : ""
                  }`}
                  onClick={() =>
                    !isCurrentPlan(plan.priceId) &&
                    handleSubscribeClick(plan.priceId)
                  }
                  style={{
                    cursor: isCurrentPlan(plan.priceId)
                      ? "not-allowed"
                      : "pointer",
                    opacity: isCurrentPlan(plan.priceId) ? 0.7 : 1,
                  }}
                >
                  {plan.badge && (
                    <div className="pricing-plan__badge">{plan.badge}</div>
                  )}
                  {plan.popular && !currentPriceId && (
                    <div className="pricing-plan__popular-label">
                      Best Value
                    </div>
                  )}
                  {isCurrentPlan(plan.priceId) && (
                    <div className="pricing-plan__current-label">
                      Current Plan
                    </div>
                  )}
                  <div className="pricing-plan__name">{plan.name}</div>
                  <div className="pricing-plan__price">
                    <span className="pricing-plan__amount">{plan.price}</span>
                    <span className="pricing-plan__period">
                      / {plan.period}
                    </span>
                  </div>
                  <div className="pricing-plan__subtitle">{plan.subtitle}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="subscription-modal__actions">
            <button
              className="subscription-modal__restore"
              onClick={onShowFeatures}
            >
              Restore Purchases
            </button>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <SelectPaymentMethodModal
          cards={[]}
          onClose={() => setShowPaymentModal(false)}
          priceId={selectedPriceId}
          onPaymentSuccess={handlePaymentSuccess}
          hasActiveSubscription={!!currentPriceId}
        />
      )}
    </>
  );
};

export default SubscriptionModal;

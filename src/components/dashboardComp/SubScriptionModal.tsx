"use client";

import type React from "react";
import { X, Check, Star } from "lucide-react";
import { useState } from "react";
import "./subscription-modal.scss";
import SelectPaymentMethodModal from "../payment/SelectPaymentMethodModal";

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
  "HIPAA compliant",
];

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  onClose,
  onShowFeatures,
  onSubscribe,
  currentPriceId,
}) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPriceId, setSelectedPriceId] = useState<string>("");

  const monthlyPrice = Number(import.meta.env.VITE_MONTHLY_PRICE);
  const yearlyPrice = Number(import.meta.env.VITE_YEARLY_PRICE);

  const yearlyPricePerWeek = yearlyPrice / 52;
  const monthlyPricePerWeek = monthlyPrice / 4.33;

  const yearlyDiscount =
    ((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100;

  const yearlyPriceId = import.meta.env.VITE_YEARLY_PRICE_ID;
  const monthlyPriceId = import.meta.env.VITE_MONTHLY_PRICE_ID;

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

  const getButtonText = (planName: string, priceId: string) => {
    if (isCurrentPlan(priceId)) return "Current Plan";
    if (currentPriceId) return "Upgrade Subscription";
    return planName === "yearly"
      ? "Continue with Yearly Plan"
      : "Subscribe";
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
                <span className="featured-plan__badge featured-plan__badge--recommended">
                  Recommended
                </span>
                <span className="featured-plan__badge featured-plan__badge--value">
                  Best Value
                </span>
                <span className="featured-plan__badge featured-plan__badge--save">
                  Save {Math.round(yearlyDiscount)}%
                </span>
              </div>

              {isCurrentPlan(yearlyPriceId) && (
                <div className="featured-plan__current-tag">Current Plan</div>
              )}

              <div className="featured-plan__price-row">
                <span className="featured-plan__amount">${yearlyPrice}</span>
                <span className="featured-plan__period">/year</span>
              </div>
              <div className="featured-plan__subtitle">
                Only ${yearlyPricePerWeek.toFixed(2)}/week
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
                  !isCurrentPlan(yearlyPriceId) &&
                  handleSubscribeClick(yearlyPriceId)
                }
                disabled={isCurrentPlan(yearlyPriceId)}
              >
                {getButtonText("yearly", yearlyPriceId)}
              </button>

              <p className="featured-plan__guarantee">
                Cancel anytime &middot; 7-day money-back guarantee
              </p>
            </div>
          </div>

          <div className="subscription-modal__alt-plan">
            <div
              className={`alt-plan ${
                isCurrentPlan(monthlyPriceId) ? "alt-plan--current" : ""
              }`}
              onClick={() =>
                !isCurrentPlan(monthlyPriceId) &&
                handleSubscribeClick(monthlyPriceId)
              }
            >
              <div className="alt-plan__info">
                <span className="alt-plan__name">Monthly</span>
                <span className="alt-plan__price">
                  ${monthlyPrice}/month
                </span>
                <span className="alt-plan__weekly">
                  (${monthlyPricePerWeek.toFixed(2)}/week)
                </span>
              </div>
              {isCurrentPlan(monthlyPriceId) ? (
                <span className="alt-plan__current-badge">Current</span>
              ) : (
                <span className="alt-plan__select">
                  {currentPriceId ? "Switch" : "Select"}
                </span>
              )}
            </div>
          </div>

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

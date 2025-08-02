"use client";

import type React from "react";
import { X } from "lucide-react";
import "./subscription-modal.scss";

interface SubscriptionModalProps {
  onClose: () => void;
  onShowFeatures: () => void;
  onSubscribe: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  onClose,
  onShowFeatures,
  onSubscribe,
}) => {
  const pricingPlans = [
    {
      name: "1 MONTH",
      price: "$14.99",
      period: "month",
      subtitle: "(7days free trial)",
      popular: false,
    },
    {
      name: "6 MONTHS",
      price: "$69.99",
      period: "month",
      subtitle: "(only $11.67 / month)",
      badge: "-5%",
      popular: false,
    },
    {
      name: "12 MONTHS",
      price: "$119.99",
      period: "year",
      subtitle: "(only $9.99 / month)",
      badge: "Special Offer",
      popular: true,
    },
  ];

  return (
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
          <h2>Reactivate your PMU Subscription</h2>
          <p>
            Subscribe to unlock and keep enjoying the ultimate experience on PMU
            Forms
          </p>
        </div>

        <div className="subscription-modal__pricing">
          <h3>SELECT YOUR PLAN</h3>
          <div className="pricing-plans">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`pricing-plan ${
                  plan.popular ? "pricing-plan--popular" : ""
                }`}
              >
                {plan.badge && (
                  <div
                    className={`pricing-plan__badge ${
                      plan.badge === "Special Offer"
                        ? "pricing-plan__badge--special"
                        : ""
                    }`}
                  >
                    {plan.badge}
                  </div>
                )}
                {plan.popular && (
                  <div className="pricing-plan__trial">7-day free trial</div>
                )}
                <div className="pricing-plan__name">{plan.name}</div>
                <div className="pricing-plan__price">
                  <span className="pricing-plan__amount">{plan.price}</span>
                  <span className="pricing-plan__period">/ {plan.period}</span>
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
          <button
            className="subscription-modal__subscribe"
            onClick={onSubscribe}
          >
            Subscribe Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;

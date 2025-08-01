"use client";

import type React from "react";
import { useState } from "react";
import "./pricing-modal.scss";

interface PricingModalProps {
  onClose: () => void;
  onSubscribe: () => void;
}

const PricingModal: React.FC<PricingModalProps> = ({
  onClose,
  onSubscribe,
}) => {
  const [selectedPlan, setSelectedPlan] = useState(2);

  const pricingPlans = [
    {
      name: "1 MONTH",
      price: "$14.99",
      period: "month",
      subtitle: "(7days free trial)",
    },
    {
      name: "6 MONTHS",
      price: "$69.99",
      period: "month",
      subtitle: "(only $11.67 / month)",
      badge: "-5%",
    },
    {
      name: "12 MONTHS",
      price: "$119.99",
      period: "year",
      subtitle: "(only $9.99 / month)",
      badge: "Special Offer",
      trial: "7-day free trial",
    },
  ];

  return (
    <div className="pricing-modal">
      <div className="pricing-modal__overlay" onClick={onClose} />
      <div className="pricing-modal__content">
        <div className="pricing-modal__header">
          <h2>SELECT YOUR PLAN</h2>
        </div>

        <div className="pricing-modal__plans">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`pricing-option ${
                selectedPlan === index ? "pricing-option--selected" : ""
              }`}
              onClick={() => setSelectedPlan(index)}
            >
              {plan.badge && (
                <div
                  className={`pricing-option__badge ${
                    plan.badge === "Special Offer"
                      ? "pricing-option__badge--special"
                      : ""
                  }`}
                >
                  {plan.badge}
                </div>
              )}
              {plan.trial && selectedPlan === index && (
                <div className="pricing-option__trial">{plan.trial}</div>
              )}
              <div className="pricing-option__content">
                <div className="pricing-option__name">{plan.name}</div>
                <div className="pricing-option__price">
                  <span className="pricing-option__amount">{plan.price}</span>
                  <span className="pricing-option__period">
                    / {plan.period}
                  </span>
                </div>
                <div className="pricing-option__subtitle">{plan.subtitle}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="pricing-modal__actions">
          <button className="pricing-modal__restore">Restore Purchases</button>
          <button className="pricing-modal__subscribe" onClick={onSubscribe}>
            Subscribe Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;

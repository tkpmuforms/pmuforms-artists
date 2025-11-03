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
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  onClose,
  onShowFeatures,
  onSubscribe,
}) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPriceId, setSelectedPriceId] = useState<string>("");

  const weeklyPrice = 10;
  const monthlyPrice = 29.99;
  const yearlyPrice = 269.99;

  const monthlyPricePerWeek = monthlyPrice / 4.33;
  const yearlyPricePerWeek = yearlyPrice / 52;

  const monthlyDiscount =
    ((weeklyPrice * 4.33 - monthlyPrice) / (weeklyPrice * 4.33)) * 100;
  const yearlyDiscount =
    ((weeklyPrice * 52 - yearlyPrice) / (weeklyPrice * 52)) * 100;

  const pricingPlans = [
    {
      name: "WEEKLY",
      price: "$10",
      period: "week",
      subtitle: "Basic access",
      badge: "",
      popular: false,
      priceId: "price_1SOKJc1WpkP2T0EiyKEpxK4J",
    },
    {
      name: "MONTHLY",
      price: "$29.99",
      period: "month",
      subtitle: `(only $${monthlyPricePerWeek.toFixed(2)} / week)`,
      badge: `-${Math.round(monthlyDiscount)}%`,
      popular: false,
      priceId: "price_1SOKMB1WpkP2T0EinSb2IbdD",
    },
    {
      name: "YEARLY",
      price: "$269.99",
      period: "year",
      subtitle: `(only $${yearlyPricePerWeek.toFixed(2)} / week)`,
      badge: `-${Math.round(yearlyDiscount)}%`,
      popular: true,
      priceId: "price_1SOKNb1WpkP2T0EiO1dNlUAr",
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
            <h2>Reactivate your PMU Subscription</h2>
            <p>
              Subscribe to unlock and keep enjoying the ultimate experience on
              PMU Forms
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
                  onClick={() => handleSubscribeClick(plan.priceId)}
                >
                  {plan.badge && (
                    <div className="pricing-plan__badge">{plan.badge}</div>
                  )}
                  {plan.popular && (
                    <div className="pricing-plan__popular-label">
                      Best Value
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
        />
      )}
    </>
  );
};

export default SubscriptionModal;

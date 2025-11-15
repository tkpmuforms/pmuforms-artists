"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";
import "./addCardModal.scss";
import {
  createSubscription,
  listPaymentMethods,
  changeSubscriptionPlan,
} from "../../services/artistServices";
import AddCardModal from "./AddCardModal";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import {
  saveSubscriptionToStorage,
  getSubscriptionFromStorage,
} from "../../utils/subscriptionUtils";
import { refreshAuthUser } from "../../utils/authUtils";

interface Card {
  id: string;
  name: string;
  lastFour: string;
  brand: "mastercard" | "visa" | "amex" | "unionpay";
  isDefault: boolean;
  color: string;
}

interface SelectPaymentMethodModalProps {
  cards?: Card[];
  onClose: () => void;
  priceId?: string;
  onPaymentSuccess?: () => void;
  hasActiveSubscription?: boolean;
}

const SelectPaymentMethodModal = ({
  cards: initialCards = [],
  onClose,
  priceId,
  onPaymentSuccess,
  hasActiveSubscription = false,
}: SelectPaymentMethodModalProps) => {
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [selectedCard, setSelectedCard] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAddCard, setShowAddCard] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (initialCards.length === 0) {
      fetchPaymentMethods();
    } else {
      setCards(initialCards);
      const defaultCard = initialCards.find((c) => c.isDefault);
      setSelectedCard(defaultCard?.id || initialCards[0]?.id || "");
    }
  }, [initialCards]);

  const fetchPaymentMethods = async () => {
    try {
      const response = await listPaymentMethods();
      const paymentMethods = response.data.data;

      const formattedCards: Card[] = paymentMethods.map((pm: any) => ({
        id: pm.id,
        name: pm.billing_details?.name || "Card Holder",
        lastFour: pm.card?.last4 || "0000",
        brand: pm.card?.brand || "visa",
        isDefault: pm.metadata?.isDefault === "true",
        color: getCardColor(pm.card?.brand),
      }));

      setCards(formattedCards);
      const defaultCard = formattedCards.find((c) => c.isDefault);
      setSelectedCard(defaultCard?.id || formattedCards[0]?.id || "");
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      setError("Failed to load payment methods");
    }
  };

  const getCardColor = (brand: string) => {
    const colors: { [key: string]: string } = {
      visa: "#1A1F71",
      mastercard: "#EB001B",
      amex: "#006FCF",
    };
    return colors[brand.toLowerCase()] || "#6B2A6B";
  };

  const handleMakePayment = async () => {
    if (!selectedCard) {
      setError("Please select a payment method");
      return;
    }

    if (!priceId) {
      setError("Price ID is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const subscriptionData = getSubscriptionFromStorage();
      const isSubscriptionActive =
        subscriptionData &&
        ["active", "trialing"].includes(subscriptionData.status.toLowerCase());

      const shouldChangeSubscription =
        hasActiveSubscription || isSubscriptionActive;

      if (shouldChangeSubscription) {
        const response = await changeSubscriptionPlan(priceId, selectedCard);
        toast.success("Subscription plan updated successfully!");

        if (response.data) {
          saveSubscriptionToStorage(response.data);
        }
      } else {
        const response = await createSubscription(priceId, selectedCard);
        toast.success("Payment successful! Subscription activated.");

        if (response.data) {
          saveSubscriptionToStorage(response.data);
        }
      }

      // Refresh user data to update subscription status immediately
      await refreshAuthUser(dispatch);

      if (onPaymentSuccess) {
        onPaymentSuccess();
      }

      onClose();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Payment failed. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Error making payment:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCardAdded = () => {
    fetchPaymentMethods();
    setShowAddCard(false);
  };

  if (showAddCard) {
    return (
      <AddCardModal
        onClose={() => setShowAddCard(false)}
        onCardAdded={handleCardAdded}
      />
    );
  }

  const subscriptionData = getSubscriptionFromStorage();
  const isChangingPlan =
    hasActiveSubscription ||
    (subscriptionData &&
      ["active", "trialing"].includes(subscriptionData.status.toLowerCase()));

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select a Payment Method</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <p className="modal-subtitle">
          {isChangingPlan
            ? "Select card to update your subscription plan"
            : "Select or add card to make payment"}
        </p>

        {error && <div className="error-message">{error}</div>}

        <div className="payment-method-section">
          <div className="payment-method-header">
            <h3>Select a Card</h3>
            <button
              className="add-card-link"
              onClick={() => setShowAddCard(true)}
            >
              + Add a Card
            </button>
          </div>

          {cards.length === 0 ? (
            <div className="no-cards-message">
              <p>No payment methods available. Please add a card.</p>
              <button
                className="btn btn--primary"
                onClick={() => setShowAddCard(true)}
              >
                Add a Card
              </button>
            </div>
          ) : (
            <div className="cards-selection">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className={`card-option ${
                    selectedCard === card.id ? "card-option--selected" : ""
                  }`}
                  onClick={() => setSelectedCard(card.id)}
                >
                  <div
                    className="card-option-visual"
                    style={{ background: card.color }}
                  >
                    <div className="card-option-radio">
                      {selectedCard === card.id && (
                        <div className="radio-dot"></div>
                      )}
                    </div>
                    <div className="card-option-info">
                      <p className="card-option-name">{card.name}</p>
                      <p className="card-option-number">
                        •••• •••• •••• {card.lastFour}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button
            className="btn btn--secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn--primary"
            onClick={handleMakePayment}
            disabled={loading || !selectedCard || cards.length === 0}
          >
            {loading
              ? "Processing..."
              : isChangingPlan
              ? "Update Plan"
              : "Make Payment"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectPaymentMethodModal;

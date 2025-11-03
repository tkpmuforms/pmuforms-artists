import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { addPaymentMethod } from "../../services/artistServices";
import "./addCardModal.scss";

interface AddCardModalProps {
  onClose: () => void;
  onCardAdded?: () => void;
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#32325d",
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": {
        color: "#aab7c4",
      },
    },
    invalid: {
      color: "#fa755a",
      iconColor: "#fa755a",
    },
  },
  hidePostalCode: true,
};

const CardForm = ({ onClose, onCardAdded }: AddCardModalProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [formData, setFormData] = useState({
    cardholderName: "",
    billingAddress: "",
    postalCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error("Card element not found");
      }

      const { error: stripeError, paymentMethod } =
        await stripe.createPaymentMethod({
          type: "card",
          card: cardElement,
          billing_details: {
            name: formData.cardholderName,
            address: {
              line1: formData.billingAddress || undefined,
              postal_code: formData.postalCode || undefined,
            },
          },
        });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentMethod) {
        await addPaymentMethod(paymentMethod.id);

        if (onCardAdded) {
          onCardAdded();
        }

        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Failed to add card. Please try again.");
      console.error("Error adding card:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button type="button" className="modal-back-btn" onClick={onClose}>
            <span>←</span>
          </button>
          <h2>Add a Card</h2>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <p className="modal-subtitle">
          Securely add your card details to subscribe.
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="cardholderName">Cardholder Name</label>
            <input
              type="text"
              id="cardholderName"
              name="cardholderName"
              placeholder="Enter Cardholder Name"
              value={formData.cardholderName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="cardElement">Card Details</label>
            <div className="card-element-container">
              <CardElement options={CARD_ELEMENT_OPTIONS} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="billingAddress">Billing Address (Optional)</label>
            <input
              type="text"
              id="billingAddress"
              name="billingAddress"
              placeholder="Enter your billing address"
              value={formData.billingAddress}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="postalCode">Postal Code (Optional)</label>
            <input
              type="text"
              id="postalCode"
              name="postalCode"
              placeholder="Enter postal code"
              value={formData.postalCode}
              onChange={handleChange}
            />
          </div>

          <p className="modal-disclaimer">
            By confirming your subscription, you allow PMUforms to charge you
            for future payments in accordance with their terms. You can always
            cancel your subscription.
          </p>

          <p className="modal-powered">
            Powered by <span>stripe</span>
          </p>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={loading || !stripe}
            >
              {loading ? "Adding..." : "Add Card"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddCardModal = ({ onClose, onCardAdded }: AddCardModalProps) => {
  return (
    <Elements stripe={stripePromise}>
      <CardForm onClose={onClose} onCardAdded={onCardAdded} />
    </Elements>
  );
};

export default AddCardModal;

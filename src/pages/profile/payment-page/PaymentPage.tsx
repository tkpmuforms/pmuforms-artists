"use client";

import { CreditCard, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import "./payment.scss";
import AddCardModal from "../../../components/payment/AddCardModal";
import SelectPaymentMethodModal from "../../../components/payment/SelectPaymentMethodModal";
import SubscriptionModal from "../../../components/dashboardComp/SubScriptionModal";
import {
  listPaymentMethods,
  listTransactions,
  detachPaymentMethod,
} from "../../../services/artistServices";

interface Card {
  id: string;
  name: string;
  lastFour: string;
  brand: "mastercard" | "visa" | "amex";
  isDefault: boolean;
  color: string;
}

interface SubscriptionHistory {
  date: string;
  description: string;
  cardUsed: string;
  amount: number;
  status: "Successful" | "Failed" | "Pending";
}

const PaymentPage = () => {
  const [showAddCard, setShowAddCard] = useState(false);
  const [showSelectPayment, setShowSelectPayment] = useState(false);
  const [showUpgradeSubscription, setShowUpgradeSubscription] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [subscriptionHistory, setSubscriptionHistory] = useState<
    SubscriptionHistory[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentMethods();
    fetchTransactionHistory();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await listPaymentMethods();
      const paymentMethods = response.data.data || response.data;

      const formattedCards: Card[] = paymentMethods.map((pm: any) => ({
        id: pm.id,
        name: pm.billing_details?.name || "Card Holder",
        lastFour: pm.card?.last4 || "0000",
        brand: (pm.card?.brand || "visa") as "mastercard" | "visa" | "amex",
        isDefault: pm.metadata?.isDefault === "true",
        color: getCardColor(pm.card?.brand || "visa"),
      }));

      setCards(formattedCards);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    }
  };

  const fetchTransactionHistory = async () => {
    try {
      setLoading(true);
      const response = await listTransactions();
      const invoices = response.data?.invoices || response.data;

      const formattedHistory: SubscriptionHistory[] = invoices.map(
        (invoice: any) => ({
          date: new Date(invoice.created).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          description: invoice.description || "Subscription Payment",
          cardUsed: `•••• •••• •••• ${
            invoice.payment_method_details?.card?.last4 ||
            cards[0]?.lastFour ||
            "0000"
          }`,
          amount: invoice.amount / 100,
          status: getTransactionStatus(invoice.status),
        })
      );

      setSubscriptionHistory(formattedHistory);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await detachPaymentMethod(cardId);
      await fetchPaymentMethods();
    } catch (error) {
      console.error("Error deleting card:", error);
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

  const getTransactionStatus = (
    status: string
  ): "Successful" | "Failed" | "Pending" => {
    if (status === "succeeded" || status === "paid") return "Successful";
    if (status === "failed") return "Failed";
    return "Pending";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Successful":
        return "#10B981";
      case "Failed":
        return "#EF4444";
      case "Pending":
        return "#F59E0B";
      default:
        return "#6B7280";
    }
  };

  const handleCardAdded = () => {
    fetchPaymentMethods();
    setShowAddCard(false);
  };

  const handleSubscriptionSuccess = () => {
    fetchTransactionHistory();
  };

  return (
    <div className="payment-page">
      <div className="payment-page__content">
        <section className="payment-page__section">
          <h2 className="payment-page__section-title">Your Subscription</h2>
          <div className="payment-page__subscription-info">
            <div className="payment-page__subscription-item">
              <span className="payment-page__label">Current Plan</span>
              <span className="payment-page__value">6-Month Plan</span>
            </div>
            <div className="payment-page__subscription-item">
              <span className="payment-page__label">Next Billing Date</span>
              <span className="payment-page__value">Nov 28, 2025</span>
            </div>
            <div className="payment-page__subscription-item">
              <span className="payment-page__label">Status</span>
              <span className="payment-page__status payment-page__status--active">
                • Active
              </span>
            </div>
            <div className="payment-page__subscription-actions">
              <button className="payment-page__btn payment-page__btn--secondary">
                Cancel Subscription
              </button>
              <button
                className="payment-page__btn payment-page__btn--primary"
                onClick={() => setShowUpgradeSubscription(true)}
              >
                Upgrade Plan
              </button>
            </div>
          </div>
        </section>

        <section className="payment-page__section">
          <div className="payment-page__section-header">
            <h2 className="payment-page__section-title">Cards</h2>
            <button
              className="payment-page__add-card-link"
              onClick={() => setShowAddCard(true)}
            >
              + Add a Card
            </button>
          </div>

          <div className="payment-page__cards-grid">
            {cards.map((card) => (
              <div
                key={card.id}
                className="payment-page__card"
                style={{ background: card.color }}
              >
                <div className="payment-page__card-header">
                  {card.isDefault && (
                    <span className="payment-page__card-badge">
                      • Default Card
                    </span>
                  )}
                </div>
                <div className="payment-page__card-content">
                  <CreditCard size={40} color="white" />
                </div>
                <div className="payment-page__card-footer">
                  <div>
                    <p className="payment-page__card-name">{card.name}</p>
                    <p className="payment-page__card-number">
                      •••• •••• •••• {card.lastFour}
                    </p>
                  </div>
                  <button
                    className="payment-page__card-menu"
                    onClick={() => handleDeleteCard(card.id)}
                  >
                    ⋮
                  </button>
                </div>
              </div>
            ))}

            <button
              className="payment-page__add-card-btn"
              onClick={() => setShowAddCard(true)}
            >
              <Plus size={32} />
              <span>Add a Card</span>
            </button>
          </div>
        </section>

        <section className="payment-page__section">
          <h2 className="payment-page__section-title">
            Payment & Subscription History
          </h2>
          {loading ? (
            <p>Loading transaction history...</p>
          ) : (
            <div className="payment-page__history-table">
              <div className="payment-page__table-header">
                <div className="payment-page__table-cell">Date</div>
                <div className="payment-page__table-cell">Description</div>
                <div className="payment-page__table-cell">Card Used</div>
                <div className="payment-page__table-cell">Amount</div>
                <div className="payment-page__table-cell">Status</div>
                <div className="payment-page__table-cell"></div>
              </div>

              {subscriptionHistory.map((item, index) => (
                <div key={index} className="payment-page__table-row">
                  <div className="payment-page__table-cell">{item.date}</div>
                  <div className="payment-page__table-cell">
                    {item.description}
                  </div>
                  <div className="payment-page__table-cell">
                    {item.cardUsed}
                  </div>
                  <div className="payment-page__table-cell">${item.amount}</div>
                  <div className="payment-page__table-cell">
                    <span
                      className="payment-page__status-badge"
                      style={{ color: getStatusColor(item.status) }}
                    >
                      • {item.status}
                    </span>
                  </div>
                  <div className="payment-page__table-cell">
                    <button className="payment-page__action-btn">⋮</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {showAddCard && (
        <AddCardModal
          onClose={() => setShowAddCard(false)}
          onCardAdded={handleCardAdded}
        />
      )}

      {showSelectPayment && (
        <SelectPaymentMethodModal
          cards={cards}
          onClose={() => setShowSelectPayment(false)}
        />
      )}

      {showUpgradeSubscription && (
        <SubscriptionModal
          onClose={() => setShowUpgradeSubscription(false)}
          onSubscribe={handleSubscriptionSuccess}
        />
      )}
    </div>
  );
};

export default PaymentPage;

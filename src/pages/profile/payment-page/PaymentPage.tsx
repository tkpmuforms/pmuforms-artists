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
  cancelSubscription,
  getSubscription,
} from "../../../services/artistServices";
import { LoadingSmall } from "../../../components/loading/Loading";
import DeleteModal from "../../../components/clientsComp/details/DeleteModal";
import { Card, SubscriptionHistory } from "../../../redux/types";
import useAuth from "../../../context/useAuth";
import {
  saveSubscriptionToStorage,
  getSubscriptionFromStorage,
  formatNextBillingDate,
  getPlanName,
  isSubscriptionActive,
  clearSubscriptionFromStorage,
  SubscriptionData,
} from "../../../utils/subscriptionUtils";

const PaymentPage = () => {
  const { user } = useAuth();
  const [showAddCard, setShowAddCard] = useState(false);
  const [showSelectPayment, setShowSelectPayment] = useState(false);
  const [showUpgradeSubscription, setShowUpgradeSubscription] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [subscriptionHistory, setSubscriptionHistory] = useState<
    SubscriptionHistory[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setShowDeleteModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [cancelPlans, setShowCancelPlans] = useState(false);
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);

  useEffect(() => {
    fetchPaymentMethods();
    fetchTransactionHistory();
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const response = await getSubscription();
      const subData = response.data;
      saveSubscriptionToStorage(subData);
      setSubscriptionData(getSubscriptionFromStorage());
    } catch (error) {
      console.error("Error fetching subscription:", error);
      const storedData = getSubscriptionFromStorage();
      setSubscriptionData(storedData);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await listPaymentMethods();
      const paymentMethods = response.data.data || response.data;

      const formattedCards: Card[] = paymentMethods.map(
        (pm: any, index: number) => ({
          id: pm.id,
          name: pm.billing_details?.name || "Card Holder",
          lastFour: pm.card?.last4 || "0000",
          brand: (pm.card?.brand || "visa") as
            | "mastercard"
            | "visa"
            | "amex"
            | "unionpay",
          isDefault: index === 0,
          color: getCardColor(pm.card?.brand || "visa"),
        })
      );

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
          amount: invoice.amount,
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

  const handleCancelSubscription = async () => {
    try {
      await cancelSubscription();
      clearSubscriptionFromStorage();
      setSubscriptionData(null);
      fetchTransactionHistory();
      setShowCancelPlans(false);
    } catch (error) {
      console.error("Error cancelling subscription:", error);
    }
  };

  const handleDeleteCard = async () => {
    if (cardToDelete)
      try {
        await detachPaymentMethod(cardToDelete);
        await fetchPaymentMethods();
        setShowDeleteModal(false);
      } catch (error) {
        console.error("Error deleting card:", error);
      }
  };

  const getCardColor = (brand: string) => {
    const colors: { [key: string]: string } = {
      visa: "#1A1F71",
      mastercard: "#EB001B",
      amex: "#006FCF",
      unionpay: "#00447C",
    };
    return colors[brand.toLowerCase()] || "#6B2A6B";
  };

  const getCardLogo = (brand: string) => {
    const logos: { [key: string]: string } = {
      visa: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 32'%3E%3Cpath fill='%23fff' d='M20.5 10h-3.8L13.2 22h2.6l.7-1.9h2.3l.4 1.9h2.8L20.5 10zm-2.8 7.5l.9-4.8.5 4.8h-1.4zm8.1-7.5h-2.5L20 22h2.5l3.3-12zm7.5 0h-2.5l-4.1 12h2.5l.9-2.7h3l.4 2.7h2.4l-2.6-12zm-2.2 7.5l1.2-5.2.6 5.2h-1.8zm7.9-7.5l-3.1 8.6-.3-1.7-.9-4.6c-.1-.7-.7-1.2-1.5-1.2h-4.1l-.1.4c1 .2 2 .5 2.8 1l2.4 9.1h2.6L40 10h-2.0z'/%3E%3C/svg%3E",
      mastercard:
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 32'%3E%3Ccircle cx='15' cy='16' r='8' fill='%23EB001B'/%3E%3Ccircle cx='25' cy='16' r='8' fill='%23FF5F00'/%3E%3Cpath fill='%23F79E1B' d='M20 9.5a8 8 0 000 13 8 8 0 000-13z'/%3E%3C/svg%3E",
      amex: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 32'%3E%3Cpath fill='%23fff' d='M10 12h2.5l.8 2 .8-2H17l-2 4 2 4h-2.5l-.8-2-.8 2H10l2-4-2-4zm8 0h6v1.5h-4v1h4v1.5h-4v1h4V19h-6v-7zm8 0h2l1.5 5 1.5-5h2v7h-1.5v-5.5L29 19h-1l-1.5-5.5V19H25v-7zm10 0h2v5.5h3V19h-5v-7z'/%3E%3C/svg%3E",
      unionpay:
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 32'%3E%3Cpath fill='%23fff' d='M12 14h2l1 3 1-3h2v5h-1v-4l-1 4h-1l-1-4v4h-2v-5zm7 0h3v1h-2v1h2v1h-2v1h2v1h-3v-5zm5 0h1l2 3v-3h1v5h-1l-2-3v3h-1v-5zm5 0h1v4h2v1h-3v-5z'/%3E%3C/svg%3E",
    };
    return logos[brand.toLowerCase()] || null;
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
    fetchSubscriptionData();
    setShowUpgradeSubscription(false);
  };

  const isActive = subscriptionData
    ? isSubscriptionActive(subscriptionData.status)
    : user?.stripeSubscriptionActive;

  const currentPlan = subscriptionData
    ? getPlanName(subscriptionData.interval, subscriptionData.intervalCount)
    : "No Active Plan";

  const nextBillingDate = subscriptionData?.currentPeriodEnd
    ? formatNextBillingDate(subscriptionData.currentPeriodEnd)
    : "N/A";

  return (
    <div className="payment-page">
      <div className="payment-page__content">
        <section className="payment-page__section payment-page__section--full">
          <h2 className="payment-page__section-title">Your Subscription</h2>
          <div className="payment-page__subscription-info">
            <div className="payment-page__subscription-item">
              <span className="payment-page__label">Current Plan</span>
              <span className="payment-page__value">{currentPlan}</span>
            </div>
            <div className="payment-page__subscription-item">
              <span className="payment-page__label">Next Billing Date</span>
              <span className="payment-page__value">{nextBillingDate}</span>
            </div>
            <div className="payment-page__subscription-item">
              <span className="payment-page__label">Status</span>
              <span
                className={`payment-page__status payment-page__status--${
                  isActive ? "active" : "inactive"
                }`}
              >
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="payment-page__subscription-actions">
              {isActive && (
                <button
                  className="payment-page__btn payment-page__btn--secondary"
                  onClick={() => setShowCancelPlans(true)}
                >
                  Cancel Subscription
                </button>
              )}
              <button
                className="payment-page__btn payment-page__btn--primary"
                onClick={() => setShowUpgradeSubscription(true)}
              >
                {isActive ? "Change Plan" : "Upgrade Subscription"}
              </button>
            </div>
          </div>
        </section>

        <div className="payment-page__two-column">
          <section className="payment-page__section payment-page__section--left">
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
                    {getCardLogo(card.brand) ? (
                      <img
                        src={getCardLogo(card.brand)!}
                        alt={card.brand}
                        className="payment-page__card-logo"
                      />
                    ) : (
                      <CreditCard size={40} color="white" />
                    )}
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
                      onClick={() => {
                        setCardToDelete(card.id);
                        setShowDeleteModal(true);
                      }}
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

          <section className="payment-page__section payment-page__section--right">
            <h2 className="payment-page__section-title">
              Payment & Subscription History
            </h2>
            {loading ? (
              <LoadingSmall />
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
                    <div className="payment-page__table-cell">
                      ${item.amount}
                    </div>
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
          currentPriceId={subscriptionData?.priceId}
        />
      )}

      {deleteModal && (
        <DeleteModal
          onClose={() => setShowDeleteModal(false)}
          headerText="Delete Card"
          shorterText="Are you sure you want to delete this card?"
          handleDelete={handleDeleteCard}
        />
      )}

      {cancelPlans && (
        <DeleteModal
          onClose={() => setShowCancelPlans(false)}
          headerText="Cancel Plans"
          shorterText="Are you sure you want to cancel your plan?"
          handleDelete={handleCancelSubscription}
        />
      )}
    </div>
  );
};

export default PaymentPage;

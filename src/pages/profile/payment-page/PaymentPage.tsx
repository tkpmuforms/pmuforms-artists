"use client";

import { CreditCard, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import DeleteModal from "../../../components/clients/details/DeleteModal";
import SubscriptionModal from "../../../components/dashboard/SubScriptionModal";
import AddCardModal from "../../../components/payment/AddCardModal";
import SelectPaymentMethodModal from "../../../components/payment/SelectPaymentMethodModal";
import PlanUsageMeter from "../../../components/plans/PlanUsageMeter";
import useAuth from "../../../context/useAuth";
import { Card, SubscriptionHistory } from "../../../redux/types";
import {
  cancelSubscription,
  detachPaymentMethod,
  getSubscription,
  listPaymentMethods,
  listTransactions,
  resumeSubscription,
} from "../../../services/artistServices";
import { refreshAuthUser } from "../../../utils/authUtils";
import {
  formatNextBillingDate,
  getPlanName,
  getSubscriptionFromStorage,
  isSubscriptionActive,
  saveSubscriptionToStorage,
  SubscriptionData,
} from "../../../utils/subscriptionUtils";
import {
  getCardColor,
  getCardLogo,
  getStatusColor,
  getTransactionStatus,
} from "../../../utils/utils";
import "./payment.scss";
import { getApiErrorMessage } from "../../../utils/apiError";
import {
  STARTER_LIMITS,
  useSubscriptionPlans,
} from "../../../utils/subscriptionPlans";

const PaymentPage = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();

  const defaultCardId = user?.defaultStripePaymentMethod || "";
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
  const [resuming, setResuming] = useState(false);
  const { plans } = useSubscriptionPlans();

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
          isDefault: pm.id === defaultCardId,
          color: getCardColor(pm.card?.brand || "visa"),
        }),
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
        }),
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

      await refreshAuthUser(dispatch);

      fetchTransactionHistory();
      const response = await getSubscription();
      const subData = response.data;
      saveSubscriptionToStorage(subData);
      setSubscriptionData(getSubscriptionFromStorage());
      setShowCancelPlans(false);
      toast.success(
        endDate
          ? `Cancelled. You keep full access until ${endDate}.`
          : "Subscription cancelled.",
      );
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast.error("Failed to cancel subscription. Please try again.");
    }
  };

  const handleResume = async () => {
    setResuming(true);
    try {
      const response = await resumeSubscription();
      saveSubscriptionToStorage(response.data);
      await refreshAuthUser(dispatch);
      await fetchSubscriptionData();
      toast.success(
        endDate
          ? `Welcome back! Your plan continues and renews on ${endDate}.`
          : "Welcome back! Your plan continues.",
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Couldn't resume your subscription. Please try again.",
        ),
      );
    } finally {
      setResuming(false);
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

  const handleCardAdded = () => {
    fetchPaymentMethods();
    setShowAddCard(false);
  };

  const handleSubscriptionSuccess = async () => {
    // Refresh user data to update subscription status immediately
    await refreshAuthUser(dispatch);

    fetchTransactionHistory();
    fetchSubscriptionData();
    setShowUpgradeSubscription(false);
  };

  // const isMobileSub =  false;
  const isMobileSub = user?.appStorePurchaseActive ?? false;
  const isActive = isMobileSub
    ? true
    : subscriptionData
      ? isSubscriptionActive(subscriptionData.status)
      : user?.stripeSubscriptionActive;

  // Starter is its own Stripe price; every other web plan is Pro
  const starterPriceId = plans?.starter?.priceId;
  const activePriceId = subscriptionData?.priceId ?? user?.activeStripePriceId;
  const isStarter =
    !isMobileSub && !!isActive && !!starterPriceId && activePriceId === starterPriceId;

  const currentPlan = isMobileSub
    ? null
    : isStarter
      ? "Starter"
      : subscriptionData
        ? `${isActive && starterPriceId ? "Pro · " : ""}${getPlanName(
            subscriptionData.interval,
            subscriptionData.intervalCount,
          )}`
        : "No Active Plan";

  // cancelled, but paid up until the end of the period
  const isCancelled =
    !isMobileSub &&
    !!isActive &&
    !!(subscriptionData?.cancelAt || subscriptionData?.cancelAtPeriodEnd);
  const endsAt = subscriptionData?.cancelAt || subscriptionData?.currentPeriodEnd;
  const endDate = endsAt
    ? new Date(endsAt * 1000).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const nextDate = subscriptionData?.currentPeriodEnd
    ? new Date(subscriptionData.currentPeriodEnd * 1000).toLocaleDateString(
        "en-US",
        { month: "long", day: "numeric", year: "numeric" },
      )
    : null;
  const planPrice =
    subscriptionData?.amount != null
      ? `$${(subscriptionData.amount / 100).toFixed(2)}/${
          subscriptionData.interval === "year" ? "year" : "month"
        }`
      : null;
  const freeStart = !isMobileSub && isActive ? subscriptionData?.freeStart : null;

  const billingDateLabel = isCancelled
    ? "Subscription Ends"
    : "Next Billing Date";

  // Hide billing date for Mobile Sub
  const billingDateValue = isMobileSub
    ? "—"
    : isCancelled
      ? formatNextBillingDate(subscriptionData.cancelAt!)
      : subscriptionData?.currentPeriodEnd
        ? formatNextBillingDate(subscriptionData.currentPeriodEnd)
        : "N/A";

  return (
    <div className="payment-page">
      <div className="payment-page__content">
        <section className="payment-page__section payment-page__section--full">
          <h2 className="payment-page__section-title">Your Subscription</h2>
          {isMobileSub ? (
            <div className="payment-page__mobile-sub-container">
              <div className="payment-page__mobile-sub-info">
                <span className="payment-page__mobile-sub-title">
                  You already have an active mobile subscription.
                </span>
                <span className="payment-page__mobile-sub-text">
                  Your current plan is still valid and managed through the
                  mobile app.
                </span>
                <span className="payment-page__mobile-sub-text">
                  When it expires, you'll be able to switch to a web
                  subscription directly from this site.
                </span>
              </div>
            </div>
          ) : (
            <div className="payment-page__subscription-info">
              <div className="payment-page__subscription-item">
                <span className="payment-page__label">Current Plan</span>
                <span className="payment-page__value">{currentPlan}</span>
              </div>
              <div className="payment-page__subscription-item">
                <span className="payment-page__label">{billingDateLabel}</span>
                <span className="payment-page__value">{billingDateValue}</span>
              </div>
              <div className="payment-page__subscription-item">
                <span className="payment-page__label">Status</span>
                <span
                  className={`payment-page__status payment-page__status--${
                    isCancelled ? "ending" : isActive ? "active" : "inactive"
                  }`}
                >
                  {isCancelled ? "Cancelled" : isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {isCancelled ? (
                <div className="payment-page__subscription-actions">
                  <button
                    className="payment-page__btn payment-page__btn--primary"
                    onClick={handleResume}
                    disabled={resuming}
                  >
                    {resuming ? "Resuming..." : "Resume Subscription"}
                  </button>
                </div>
              ) : (
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
                    {isStarter
                      ? "Upgrade to Pro"
                      : isActive
                        ? "Change Plan"
                        : "Upgrade Subscription"}
                  </button>
                </div>
              )}
            </div>
          )}

          {isStarter && (
            <div className="payment-page__plan-usage">
              <PlanUsageMeter showUpgrade={false} />
              {!isCancelled && (
                <p className="payment-page__plan-note">
                  Starter includes every feature for up to{" "}
                  {STARTER_LIMITS.clients} clients and{" "}
                  {STARTER_LIMITS.appointmentsPerMonth} appointments a month.
                  Pro has no limits: upgrade anytime, monthly or yearly.
                </p>
              )}
            </div>
          )}

          {isCancelled && (
            <div
              className="payment-page__notice payment-page__notice--ending"
              role="status"
            >
              <strong>
                Your subscription is cancelled
                {endDate ? ` and ends on ${endDate}` : ""}.
              </strong>{" "}
              You keep full access until then and won't be charged again.
              Changed your mind? Resume it and your plan carries on
              {planPrice ? ` at ${planPrice}` : ""}
              {endDate ? ` from ${endDate}` : ""}.
            </div>
          )}

          {freeStart && !isCancelled && (
            <div className="payment-page__notice" role="status">
              🎁 Your first {subscriptionData?.interval === "year" ? "year" : "month"}{" "}
              is free
              {freeStart.code ? (
                <>
                  {" "}
                  with code <strong>{freeStart.code}</strong>
                </>
              ) : null}
              .{" "}
              {nextDate && planPrice
                ? `Your first payment of ${planPrice.split("/")[0]} is on ${nextDate}.`
                : ""}
            </div>
          )}

          {freeStart && isCancelled && (
            <div className="payment-page__notice" role="status">
              🎁 Your free {subscriptionData?.interval === "year" ? "year" : "month"}
              {freeStart.code ? (
                <>
                  {" "}
                  (code <strong>{freeStart.code}</strong>)
                </>
              ) : null}{" "}
              still runs to the end{endDate ? `, ${endDate}` : ""}.
            </div>
          )}
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

          {!isMobileSub && !loading && subscriptionHistory.length > 0 && (
            <section className="payment-page__section payment-page__section--right">
              <h2 className="payment-page__section-title">
                Payment & Subscription History
              </h2>
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
            </section>
          )}
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
          // an ended subscription isn't a plan to switch from: choosing one
          // starts a new subscription, and Starter is offered again
          currentPriceId={isActive ? subscriptionData?.priceId : undefined}
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
          headerText="Cancel Subscription"
          shorterText={
            endDate
              ? `You'll keep full access until ${endDate} and won't be charged again. You can resume anytime before then.`
              : "Are you sure you want to cancel your plan?"
          }
          confirmLabel="Cancel Subscription"
          cancelLabel="Keep My Plan"
          handleDelete={handleCancelSubscription}
        />
      )}
    </div>
  );
};

export default PaymentPage;

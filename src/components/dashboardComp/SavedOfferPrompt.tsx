import type React from "react";
import { useEffect, useState } from "react";
import useAuth from "../../context/useAuth";
import { determineOnboardingStep } from "../../pages/auth/authUtils";
import { useSavedOffer } from "../../utils/savedOffer";
import { isArtistSubscribed } from "../../utils/subscriptionUtils";
import SubscriptionModal from "./SubScriptionModal";
import "./saved-offer-prompt.scss";

const OPENED_KEY = "pmu_offer_opened";

const openedFor = (code: string) => {
  try {
    return window.sessionStorage.getItem(OPENED_KEY) === code;
  } catch {
    return false;
  }
};

const markOpened = (code: string) => {
  try {
    window.sessionStorage.setItem(OPENED_KEY, code);
  } catch {
    // private mode: it may open again on the next page load
  }
};

/**
 * Someone came from a link or QR code with a discount code and hasn't
 * subscribed yet: once they've set up their business name and services, the
 * plans open with the code applied (once per visit), and a banner keeps the
 * offer in view if they close it.
 */
const SavedOfferPrompt: React.FC = () => {
  const { user } = useAuth();
  const subscribed = isArtistSubscribed(user);
  const offer = useSavedOffer(!!user && !subscribed);
  const [open, setOpen] = useState(false);

  const code = offer.status === "ready" ? offer.coupon.code : null;
  // business name and services come first; then it's time to pay
  const readyToPay = !!user && determineOnboardingStep(user) === "payment";

  useEffect(() => {
    if (code && readyToPay && !subscribed && !openedFor(code)) {
      markOpened(code);
      setOpen(true);
    }
  }, [code, readyToPay, subscribed]);

  // kept open after subscribing, so they see the confirmation
  if (open) return <SubscriptionModal onClose={() => setOpen(false)} />;
  if (!code || subscribed || offer.status !== "ready") return null;

  const free = offer.coupon.description.includes("off your first payment");
  return (
    <div className="saved-offer-banner" role="status">
      <span>
        🎁 Code <strong>{code}</strong> is saved:{" "}
        {free
          ? "your first month is free when you subscribe."
          : `${offer.coupon.description.replace(/^.* — /, "")} when you subscribe.`}
      </span>
      <button type="button" onClick={() => setOpen(true)}>
        Subscribe now
      </button>
    </div>
  );
};

export default SavedOfferPrompt;

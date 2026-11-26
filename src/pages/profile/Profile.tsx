"use client";

import {
  Building2,
  Edit,
  FileText,
  HelpCircle,
  Key,
  LogOut,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChangePasswordModal from "../../components/profileComp/ChangePasswordModal";
import EditBusinessInformationModal from "../../components/profileComp/EditBusinessInformationModal";
import UpdateServicesModal from "../../components/profileComp/UpdateServicesModal";
import useAuth from "../../context/useAuth";
import type { OnboardingStep } from "../auth/authUtils";
import { determineOnboardingStep } from "../auth/authUtils";
import PaymentPage from "./payment-page/PaymentPage";
import "./profile.scss";
import { useSavedOffer } from "../../utils/savedOffer";

interface LocationState {
  newUser?: boolean;
  onboardingStep?: OnboardingStep;
}

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState;
  const [showEditBusinessInfo, setShowEditBusinessInfo] = useState(false);
  const [showUpdateServices, setShowUpdateServices] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isNewUser] = useState(locationState?.newUser || false);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>(
    locationState?.onboardingStep || "completed",
  );
  const [showPaymentPage, setShowPaymentPage] = useState(false);
  // a usable code from a link: the plans pop-up opens with it instead (see
  // SavedOfferPrompt); otherwise, or if it can't be checked, the usual step
  const savedOffer = useSavedOffer(isNewUser);
  const offerTakesOver =
    savedOffer.status === "checking" || savedOffer.status === "ready";

  useEffect(() => {
    if (!user) return;

    const currentStep = determineOnboardingStep(user);
    setOnboardingStep(currentStep);

    const shouldShowOnboarding = isNewUser || currentStep !== "completed";

    if (shouldShowOnboarding) {
      if (currentStep === "businessName") {
        setShowEditBusinessInfo(true);
      } else if (currentStep === "services") {
        setShowUpdateServices(true);
      } else if (currentStep === "payment") {
        setShowPaymentPage(true);
      }
    }
  }, [user, isNewUser]);

  const handleBusinessInfoSave = () => {
    setShowEditBusinessInfo(false);
    setOnboardingStep("services");
    setShowUpdateServices(true);
  };

  const handleServicesSave = () => {
    setShowUpdateServices(false);

    const hasActiveSubscription = user?.stripeSubscriptionActive;

    if (hasActiveSubscription) {
      setOnboardingStep("completed");
    } else {
      setOnboardingStep("payment");
      setShowPaymentPage(true);
    }
  };

  const profileMenuItems = [
    {
      icon: <Building2 size={10} />,
      title: "Business Information",
      onClick: () => navigate("/profile/business-information"),
    },
    {
      icon: <Key size={10} />,
      title: "Change Password",
      onClick: () => setShowChangePassword(true),
    },
    {
      icon: <FileText size={10} />,
      title: "Payment & Subscriptions",
      onClick: () => navigate("/profile/payment"),
    },
    {
      icon: <HelpCircle size={10} />,
      title: "Help & Support",
      onClick: () => navigate("/contact-us"),
    },
    {
      icon: <FileText size={10} />,
      title: "Privacy Policy",
      onClick: () => navigate("/privacy-policy"),
    },
    {
      icon: <LogOut size={10} />,
      title: "Log Out",
      onClick: () => logout(),
      variant: "danger" as const,
    },
  ];

  return (
    <div className="profile-page">
      {isNewUser && onboardingStep !== "completed" && (
        <div className="profile-page__onboarding-banner">
          <h2>Welcome! Let's set up your account</h2>
          <p>
            {onboardingStep === "businessName"
              ? "First, let's set your business name"
              : onboardingStep === "services"
                ? "Now, let's add your services"
                : "Finally, let's complete your payment setup"}
          </p>
        </div>
      )}

      <div className="profile-page__content">
        <div className="profile-page__header">
          <div className="profile-page__user">
            <div className="profile-page__user-info">
              <h1>{user?.businessName}</h1>
              <button
                className="profile-page__edit-btn"
                onClick={() => navigate("/profile/business-information")}
              >
                <Edit size={20} />
                Edit business info
              </button>
            </div>
          </div>
        </div>

        <div className="profile-page__menu">
          {profileMenuItems.map((item, index) => (
            <button
              key={index}
              className={`profile-page__menu-item ${
                item.variant === "danger"
                  ? "profile-page__menu-item--danger"
                  : ""
              }`}
              onClick={item.onClick}
            >
              <div className="profile-page__menu-icon">{item.icon}</div>
              <span className="profile-page__menu-title">{item.title}</span>
            </button>
          ))}
        </div>
      </div>

      {isNewUser &&
        showEditBusinessInfo &&
        onboardingStep === "businessName" && (
          <EditBusinessInformationModal
            onClose={() => {
              setShowEditBusinessInfo(false);
              setOnboardingStep("completed");
            }}
            onSave={handleBusinessInfoSave}
          />
        )}

      {isNewUser && showUpdateServices && onboardingStep === "services" && (
        <UpdateServicesModal
          onClose={handleServicesSave}
          onGoBack={() => {
            setShowUpdateServices(false);
            setOnboardingStep("completed");
          }}
        />
      )}

      {/* with a code from a link, the plans open with it applied instead */}
      {isNewUser &&
        showPaymentPage &&
        onboardingStep === "payment" &&
        !offerTakesOver && (
        <div className="profile-page__payment-modal-overlay">
          <div className="profile-page__payment-modal">
            <div className="profile-page__payment-modal-header">
              <h2>Complete Your Payment Setup</h2>
              <button
                className="profile-page__payment-modal-close"
                onClick={() => {
                  setShowPaymentPage(false);
                  setOnboardingStep("completed");
                }}
              >
                ✕
              </button>
            </div>
            <div className="profile-page__payment-modal-content">
              <PaymentPage />
            </div>
          </div>
        </div>
      )}

      {!isNewUser && showEditBusinessInfo && (
        <EditBusinessInformationModal
          onClose={() => setShowEditBusinessInfo(false)}
          onSave={() => setShowEditBusinessInfo(false)}
        />
      )}

      {!isNewUser && showUpdateServices && (
        <UpdateServicesModal
          onClose={() => setShowUpdateServices(false)}
          onGoBack={() => {
            setShowUpdateServices(false);
          }}
        />
      )}

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </div>
  );
};

export default ProfilePage;

"use client";

import { Avatar } from "@mui/material";
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
import EditBusinessNameModal from "../../components/profileComp/EditBusinessNameModal";
import UpdateServicesModal from "../../components/profileComp/UpdateServicesModal";
import useAuth from "../../context/useAuth";
import "./profile.scss";
import { getAuthMe } from "../../services/artistServices";

interface LocationState {
  newUser?: boolean;
}

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState;
  const [showEditBusinessName, setShowEditBusinessName] = useState(false);
  const [showUpdateServices, setShowUpdateServices] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isNewUser] = useState(locationState?.newUser || false);
  const [onboardingStep, setOnboardingStep] = useState<
    "businessName" | "services" | "completed"
  >("completed");

  useEffect(() => {
    if (isNewUser) {
      setOnboardingStep("businessName");
      setShowEditBusinessName(true);
    }
  }, [isNewUser]);
  useEffect(() => {
    getAuthMe().then((response) => {
      // You can handle the response if needed
      console.log(response);
    });
  }, []);

  const handleBusinessNameSave = () => {
    setShowEditBusinessName(false);
    setOnboardingStep("services");
    setShowUpdateServices(true);
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
    // {
    //   icon: <FileText size={10} />,
    //   title: "Payment & Subscriptions",
    //   onClick: () => navigate("/profile/payment"),
    // },
    // {
    //   icon: <FileText size={10} />,
    //   title: "Integrations ",
    //   onClick: () => navigate("/profile/integrations"),
    // },
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
          <h2>Welcome! Let's set up your profile</h2>
          <p>
            {onboardingStep === "businessName"
              ? "First, let's set your business name"
              : "Now, let's add your services"}
          </p>
        </div>
      )}

      <div className="profile-page__content">
        <div className="profile-page__header">
          <div className="profile-page__user">
            <div className="profile-page__avatar">
              <Avatar
                src={user?.avatarUrl ?? ""}
                alt={user?.businessName ?? ""}
                sx={{ width: 60, height: 60 }}
              />
            </div>
            <div className="profile-page__user-info">
              <h1>{user?.businessName}</h1>
              <button
                className="profile-page__edit-btn"
                onClick={() => navigate("/profile/edit")}
              >
                <Edit size={20} />
                Edit Profile
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
        showEditBusinessName &&
        onboardingStep === "businessName" && (
          <EditBusinessNameModal
            onClose={() => {
              setShowEditBusinessName(false);
              setOnboardingStep("completed");
            }}
            onSave={handleBusinessNameSave}
          />
        )}

      {isNewUser && showUpdateServices && onboardingStep === "services" && (
        <UpdateServicesModal
          onClose={() => {
            setShowUpdateServices(false);
            setOnboardingStep("completed");
          }}
          onGoBack={() => {
            setShowUpdateServices(false);
            setOnboardingStep("completed");
          }}
        />
      )}

      {!isNewUser && showEditBusinessName && (
        <EditBusinessNameModal
          onClose={() => setShowEditBusinessName(false)}
          onSave={() => setShowEditBusinessName(false)}
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

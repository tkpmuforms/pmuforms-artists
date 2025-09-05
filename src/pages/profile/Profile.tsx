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
import { useLocation } from "react-router-dom";
import BusinessInformationModal from "../../components/profileComp/BusinessInformationModal";
import ChangePasswordModal from "../../components/profileComp/ChangePasswordModal";
import EditBusinessNameModal from "../../components/profileComp/EditBusinessNameModal";
import EditProfileModal from "../../components/profileComp/EditProfileModal";
import UpdateServicesModal from "../../components/profileComp/UpdateServicesModal";
import useAuth from "../../context/useAuth";
import "./profile.scss";

interface LocationState {
  newUser?: boolean;
}

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const locationState = location.state as LocationState;

  const [showEditBusinessName, setShowEditBusinessName] = useState(false);
  const [showBusinessInfo, setShowBusinessInfo] = useState(false);
  const [showUpdateServices, setShowUpdateServices] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Track the onboarding flow for new users
  const [isNewUser] = useState(locationState?.newUser || false);
  const [onboardingStep, setOnboardingStep] = useState<
    "businessName" | "services" | "completed"
  >("completed");

  useEffect(() => {
    if (isNewUser) {
      // Start the onboarding flow for new users
      setOnboardingStep("businessName");
      setShowEditBusinessName(true);
    }
  }, [isNewUser]);

  const handleBusinessNameSave = () => {
    setShowEditBusinessName(false);
    // Move to next step: services
    setOnboardingStep("services");
    setShowUpdateServices(true);
  };

  const handleServicesSave = () => {
    setShowUpdateServices(false);
    setOnboardingStep("completed");
    // Onboarding complete - user can now use the app normally
  };

  const profileMenuItems = [
    {
      icon: <Building2 size={10} />,
      title: "Business Information",
      onClick: () => setShowBusinessInfo(true),
    },
    {
      icon: <Key size={10} />,
      title: "Change Password",
      onClick: () => setShowChangePassword(true),
    },
    {
      icon: <HelpCircle size={10} />,
      title: "Help & Support",
      onClick: () => console.log("Help & Support"),
    },
    {
      icon: <FileText size={10} />,
      title: "Privacy Policy",
      onClick: () => console.log("Privacy Policy"),
    },
    {
      icon: <LogOut size={10} />,
      title: "Log Out",
      onClick: () => console.log("Log Out"),
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
                src={user?.info?.avatar_url ?? ""}
                alt={user?.businessName ?? ""}
                sx={{ width: 60, height: 60 }}
              />
            </div>
            <div className="profile-page__user-info">
              <h1>{user?.businessName}</h1>
              <button
                className="profile-page__edit-btn"
                onClick={() => setShowEditProfile(true)}
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

      {/* Onboarding Modals */}
      {isNewUser &&
        showEditBusinessName &&
        onboardingStep === "businessName" && (
          <EditBusinessNameModal
            onClose={() => {
              setShowEditBusinessName(false);
              setOnboardingStep("completed"); // Allow them to skip if they close
            }}
            onSave={handleBusinessNameSave}
          />
        )}

      {isNewUser && showUpdateServices && onboardingStep === "services" && (
        <UpdateServicesModal
          onClose={() => {
            setShowUpdateServices(false);
            setOnboardingStep("completed"); // Allow them to skip if they close
          }}
          onGoBack={() => {
            setShowUpdateServices(false);
            setOnboardingStep("businessName");
            setShowEditBusinessName(true);
          }}
          onSave={handleServicesSave}
        />
      )}

      {/* Regular Modals (for existing flow) */}
      {!isNewUser && showEditBusinessName && (
        <EditBusinessNameModal
          onClose={() => setShowEditBusinessName(false)}
          onSave={() => setShowEditBusinessName(false)}
        />
      )}

      {showBusinessInfo && (
        <BusinessInformationModal
          onClose={() => setShowBusinessInfo(false)}
          onEditServices={() => {
            setShowBusinessInfo(false);
            setShowUpdateServices(true);
          }}
          onEditBusinessName={() => {
            setShowBusinessInfo(false);
            setShowEditBusinessName(true);
          }}
        />
      )}

      {!isNewUser && showUpdateServices && (
        <UpdateServicesModal
          onClose={() => setShowUpdateServices(false)}
          onGoBack={() => {
            setShowUpdateServices(false);
            setShowBusinessInfo(true);
          }}
        />
      )}

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}

      {showEditProfile && (
        <EditProfileModal onClose={() => setShowEditProfile(false)} />
      )}
    </div>
  );
};

export default ProfilePage;

"use client";

import type React from "react";
import { useState } from "react";
import {
  Building2,
  Key,
  HelpCircle,
  FileText,
  LogOut,
  Edit,
} from "lucide-react";

import "./profile.scss";
import useAuth from "../../context/useAuth";
import EditBusinessNameModal from "../../components/profileComp/EditBusinessNameModal";
import BusinessInformationModal from "../../components/profileComp/BusinessInformationModal";
import UpdateServicesModal from "../../components/profileComp/UpdateServicesModal";
import ChangePasswordModal from "../../components/profileComp/ChangePasswordModal";
import EditProfileModal from "../../components/profileComp/EditProfileModal";

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [showEditBusinessName, setShowEditBusinessName] = useState(false);
  const [showBusinessInfo, setShowBusinessInfo] = useState(false);
  const [showUpdateServices, setShowUpdateServices] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const profileMenuItems = [
    {
      icon: <Building2 size={20} />,
      title: "Business Information",
      onClick: () => setShowBusinessInfo(true),
    },
    {
      icon: <Key size={20} />,
      title: "Change Password",
      onClick: () => setShowChangePassword(true),
    },
    {
      icon: <HelpCircle size={20} />,
      title: "Help & Support",
      onClick: () => console.log("Help & Support"),
    },
    {
      icon: <FileText size={20} />,
      title: "Privacy Policy",
      onClick: () => console.log("Privacy Policy"),
    },
    {
      icon: <LogOut size={20} />,
      title: "Log Out",
      onClick: () => console.log("Log Out"),
      variant: "danger" as const,
    },
  ];

  return (
    <div className="profile-page">
      <div className="profile-page__content">
        <div className="profile-page__header">
          <div className="profile-page__user">
            <div className="profile-page__avatar">
              <span>LL</span>
            </div>
            <div className="profile-page__user-info">
              <h1>Linda Lovely</h1>
              <button
                className="profile-page__edit-btn"
                onClick={() => setShowEditProfile(true)}
              >
                <Edit size={16} />
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

        <div className="profile-page__pagination">
          <span>144 / 157</span>
        </div>
      </div>

      {showEditBusinessName && (
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

      {showUpdateServices && (
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

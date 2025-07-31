"use client";

import { Avatar, CircularProgress } from "@mui/material";
import { X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import useAuth from "../../context/useAuth";
import "./edit-profile-modal.scss";

interface EditProfileModalProps {
  onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phoneNumber: user?.phoneNumber || "",
  });
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarChange = () => {};

  const handleInputChange = (
    field: keyof typeof profileData,
    value: string
  ) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddClient = () => {
    console.log("Profile updated:", profileData);
    onClose();
  };

  return (
    <div className="edit-profile-modal">
      <div className="edit-profile-modal__overlay" onClick={onClose} />
      <div className="edit-profile-modal__content">
        <button className="edit-profile-modal__close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="edit-profile-modal__header">
          <h2>Edit Your Profile</h2>
          <p>Enhance your profile information</p>
        </div>

        <div className="edit-profile-modal__avatar">
          <div className="avatar-section">
            <label
              htmlFor="avatar-upload"
              style={{ cursor: "pointer", position: "relative" }}
            >
              {uploadingAvatar ? (
                <div
                  style={{
                    position: "relative",
                    width: 100,
                    height: 100,
                  }}
                >
                  <Avatar
                    src={avatarUrl || ""}
                    alt="Profile Avatar"
                    sx={{ width: 100, height: 100, opacity: 0.5 }}
                  >
                    {user?.displayName
                      ? user.displayName.slice(0, 2).toUpperCase()
                      : ""}
                  </Avatar>
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <CircularProgress size={40} sx={{ color: "#8e2d8e" }} />
                  </div>
                </div>
              ) : (
                <Avatar
                  src={avatarUrl || ""}
                  alt="Profile Avatar"
                  sx={{ width: 100, height: 100 }}
                >
                  {user?.displayName
                    ? user.displayName.slice(0, 2).toUpperCase()
                    : ""}
                </Avatar>
              )}
            </label>
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: "none" }}
              disabled={uploadingAvatar}
            />
          </div>
        </div>

        <div className="edit-profile-modal__form">
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              type="text"
              value={profileData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              type="text"
              value={profileData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phoneNumber">Phone number</label>
            <input
              id="phoneNumber"
              type="tel"
              value={profileData.phoneNumber}
              onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        <button className="edit-profile-modal__save" onClick={handleAddClient}>
          Add Client
        </button>
      </div>
    </div>
  );
};

export default EditProfileModal;

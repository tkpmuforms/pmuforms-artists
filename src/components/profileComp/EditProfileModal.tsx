"use client";

import type React from "react";
import { useState } from "react";
import { X, Camera } from "lucide-react";
import "./edit-profile-modal.scss";

interface EditProfileModalProps {
  onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose }) => {
  const [profileData, setProfileData] = useState({
    firstName: "Johnson",
    lastName: "Smith",
    phoneNumber: "555-0123-4567",
  });

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
          <div className="avatar-container">
            <div className="avatar-circle">
              <span>LL</span>
            </div>
            <button className="avatar-edit-btn">
              <Camera size={16} />
            </button>
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

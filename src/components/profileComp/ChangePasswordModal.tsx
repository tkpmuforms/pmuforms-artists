"use client";

import type React from "react";
import { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import "./change-password-modal.scss";

interface ChangePasswordModalProps {
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  onClose,
}) => {
  const [passwords, setPasswords] = useState({
    old: "",
    new: "",
    confirm: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const handlePasswordChange = (
    field: keyof typeof passwords,
    value: string
  ) => {
    setPasswords((prev) => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = () => {
    console.log("Password changed");
    onClose();
  };

  return (
    <div className="change-password-modal">
      <div className="change-password-modal__overlay" onClick={onClose} />
      <div className="change-password-modal__content">
        <button className="change-password-modal__close" onClick={onClose}>
          <X size={20} />
        </button>

        <h2>Change Password</h2>

        <div className="change-password-modal__form">
          <div className="form-group">
            <label htmlFor="oldPassword">Old Password</label>
            <div className="input-wrapper">
              <input
                id="oldPassword"
                type={showPasswords.old ? "text" : "password"}
                value={passwords.old}
                onChange={(e) => handlePasswordChange("old", e.target.value)}
                className="form-input"
                placeholder="••••••••"
              />
              <button
                type="button"
                className="input-icon"
                onClick={() => togglePasswordVisibility("old")}
                aria-label="Toggle password visibility"
              >
                {showPasswords.old ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <div className="input-wrapper">
              <input
                id="newPassword"
                type={showPasswords.new ? "text" : "password"}
                value={passwords.new}
                onChange={(e) => handlePasswordChange("new", e.target.value)}
                className="form-input"
                placeholder="••••••••"
              />
              <button
                type="button"
                className="input-icon"
                onClick={() => togglePasswordVisibility("new")}
                aria-label="Toggle password visibility"
              >
                {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <div className="input-wrapper">
              <input
                id="confirmPassword"
                type={showPasswords.confirm ? "text" : "password"}
                value={passwords.confirm}
                onChange={(e) =>
                  handlePasswordChange("confirm", e.target.value)
                }
                className="form-input"
                placeholder="••••••••"
              />
              <button
                type="button"
                className="input-icon"
                onClick={() => togglePasswordVisibility("confirm")}
                aria-label="Toggle password visibility"
              >
                {showPasswords.confirm ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
              </button>
            </div>
          </div>
        </div>

        <button className="change-password-modal__save" onClick={handleSave}>
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default ChangePasswordModal;

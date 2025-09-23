"use client";

import type React from "react";
import { useState } from "react";
import { X } from "lucide-react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import "./change-password-modal.scss";

interface ChangePasswordModalProps {
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  onClose,
}) => {
  const [email, setEmail] = useState("");
  const auth = getAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      alert(`Reset link sent to: ${email}`);
      onClose();
    } catch (error) {
      console.error(
        "Error sending password reset email:",
        (error as Error).message
      );
      alert("Failed to send reset link. Please try again.");
    }
  };

  return (
    <div className="change-password-modal">
      <div className="change-password-modal__overlay" onClick={onClose} />
      <div className="change-password-modal__content">
        <button className="change-password-modal__close" onClick={onClose}>
          <X size={20} />
        </button>
        <h2>Change Password</h2>
        <p className="subtext">
          Provide us with your registered email so we can send you reset
          instructions.
        </p>
        <form onSubmit={handleSubmit} className="change-password-modal__form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter registered email address"
              required
            />
          </div>

          <button type="submit" className="change-password-modal__save">
            Send Reset Link
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;

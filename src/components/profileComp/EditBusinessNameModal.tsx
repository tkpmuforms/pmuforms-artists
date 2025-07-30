"use client";

import type React from "react";
import { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import "./edit-business-name-modal.scss";
import useAuth from "../../context/useAuth";

interface EditBusinessNameModalProps {
  onClose: () => void;
  onSave: () => void;
}

const EditBusinessNameModal: React.FC<EditBusinessNameModalProps> = ({
  onClose,
  onSave,
}) => {
  const { user } = useAuth();
  const [businessName, setBusinessName] = useState(user?.businessName || "");
  const [showPassword, setShowPassword] = useState(false);

  const handleSave = () => {
    onSave();
    console.log("Business name saved:", businessName);
  };

  return (
    <div className="edit-business-name-modal">
      <div className="edit-business-name-modal__overlay" onClick={onClose} />
      <div className="edit-business-name-modal__content">
        <button className="edit-business-name-modal__close" onClick={onClose}>
          <X size={20} />
        </button>

        <h2>Edit Business Name</h2>

        <div className="edit-business-name-modal__form">
          <div className="form-group">
            <label htmlFor="businessName">Business Name</label>
            <div className="input-wrapper">
              <input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="form-input"
              />
              <button
                type="button"
                className="input-icon"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        <button className="edit-business-name-modal__save" onClick={handleSave}>
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default EditBusinessNameModal;

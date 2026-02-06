"use client";

import type React from "react";
import { useState } from "react";
import { Check, X } from "lucide-react";
import "./edit-client-modal.scss";
import { updateCustomerPersonalDetails } from "../../../services/artistServices";

interface EditClientModalProps {
  onClose: () => void;
  id: string;
  initialFormData?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

const EditClientModal: React.FC<EditClientModalProps> = ({
  onClose,
  id,
  initialFormData,
}) => {
  const [formData, setFormData] = useState({
    firstName: initialFormData?.firstName || "",
    lastName: initialFormData?.lastName || "",
    email: initialFormData?.email || "",
    phone: initialFormData?.phone || "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setLoading(true);
    const updatedData = {
      name:
        [formData.firstName, formData.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() || "Client 1",
      primaryPhone: formData.phone,
      email: formData.email,
    };

    updateCustomerPersonalDetails(id, updatedData)
      .then(() => {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1000);
      })
      .catch((error) => {
        console.error("Error updating client:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="edit-client-modal">
      <div className="edit-client-modal__overlay" onClick={onClose} />
      <div className="edit-client-modal__content">
        <button className="edit-client-modal__close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="edit-client-modal__header">
          <h2>Edit Client Details</h2>
          <p>Please update the client's information.</p>
        </div>

        <div className="edit-client-modal__form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone number</label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="form-input"
              />
            </div>
          </div>
        </div>

        <button
          className="edit-client-modal__save"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? (
            "Saving..."
          ) : success ? (
            <span className="success-state">
              <Check size={16} />
              Saved
            </span>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </div>
  );
};

export default EditClientModal;

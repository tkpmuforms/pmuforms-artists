"use client";

import type React from "react";
import { useState } from "react";
import { X } from "lucide-react";
import "./add-client-modal.scss";
import { createClient } from "../../services/artistServices";
import toast from "react-hot-toast";

interface AddClientModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

type FieldErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

const AddClientModal: React.FC<AddClientModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field as keyof FieldErrors]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field as keyof FieldErrors];
        return next;
      });
    }
  };

  const handleSubmit = () => {
    const errors: FieldErrors = {};
    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required";
    if (!formData.email.trim()) errors.email = "Email address is required";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    createClient({
      name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
      primaryPhone: formData.phone,
      email: formData.email.trim(),
    })
      .then(() => {
        toast.success("Client added successfully!");
        setFormData({ firstName: "", lastName: "", email: "", phone: "" });
        onSuccess?.();
      })
      .catch((error) => {
        console.error("Error adding client:", error);
        toast.error("Failed to add client. Please try again.");
      });
  };

  return (
    <div className="add-client-modal">
      <div className="add-client-modal__overlay" onClick={onClose} />
      <div className="add-client-modal__content">
        <button className="add-client-modal__close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="add-client-modal__header">
          <h2>Add a New Client</h2>
          <p>
            Please provide the necessary information to onboard a new client.
          </p>
        </div>

        <div className="add-client-modal__form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                id="firstName"
                type="text"
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className={`form-input${fieldErrors.firstName ? " error" : ""}`}
              />
              {fieldErrors.firstName && (
                <span className="field-error">{fieldErrors.firstName}</span>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                id="lastName"
                type="text"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className={`form-input${fieldErrors.lastName ? " error" : ""}`}
              />
              {fieldErrors.lastName && (
                <span className="field-error">{fieldErrors.lastName}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                id="email"
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={`form-input${fieldErrors.email ? " error" : ""}`}
              />
              {fieldErrors.email && (
                <span className="field-error">{fieldErrors.email}</span>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone number</label>
              <input
                id="phone"
                type="tel"
                placeholder="Phone number"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="form-input"
              />
            </div>
          </div>
        </div>

        <button className="add-client-modal__submit" onClick={handleSubmit}>
          Add Client
        </button>
      </div>
    </div>
  );
};

export default AddClientModal;

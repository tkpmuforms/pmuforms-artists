"use client";

import type React from "react";
import { useState } from "react";
import { X } from "lucide-react";
import "./add-client-modal.scss";

interface AddClientModalProps {
  onClose: () => void;
}

const AddClientModal: React.FC<AddClientModalProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    console.log("Adding client:", formData);
    onClose();
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
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                placeholder="Enter client's first name"
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
                placeholder="Enter client's last name"
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
                placeholder="Enter client's email address"
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
                placeholder="Enter Client's phone number"
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

"use client";

import type React from "react";
import { X, Edit } from "lucide-react";
import "./business-information-modal.scss";

interface BusinessInformationModalProps {
  onClose: () => void;
  onEditServices: () => void;
  onEditBusinessName: () => void;
}

const BusinessInformationModal: React.FC<BusinessInformationModalProps> = ({
  onClose,
  onEditServices,
  onEditBusinessName,
}) => {
  const registeredServices = [
    "BB Glow",
    "Dry Needling",
    "Brow Lamination",
    "Tattoo Removal",
    "Areola Reconstruction",
  ];

  return (
    <div className="business-information-modal">
      <div className="business-information-modal__overlay" onClick={onClose} />
      <div className="business-information-modal__content">
        <button className="business-information-modal__close" onClick={onClose}>
          <X size={20} />
        </button>

        <h2>Business Information</h2>

        <div className="business-information-modal__section">
          <div className="section-header">
            <div>
              <label>Business Name</label>
              <div className="business-name">Glow Beauty Bar</div>
            </div>
            <button className="edit-button" onClick={onEditBusinessName}>
              <Edit size={16} />
              Edit
            </button>
          </div>
        </div>

        <div className="business-information-modal__section">
          <div className="section-header">
            <div>
              <label>Registered Services</label>
              <div className="services-list">
                {registeredServices.map((service, index) => (
                  <div key={index} className="service-item">
                    <span className="service-bullet">•</span>
                    {service}
                  </div>
                ))}
              </div>
            </div>
            <button className="edit-button" onClick={onEditServices}>
              <Edit size={16} />
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessInformationModal;

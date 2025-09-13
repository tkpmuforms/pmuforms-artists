"use client";

import type React from "react";
import { X, Edit } from "lucide-react";
import "./business-information-modal.scss";
import useAuth from "../../context/useAuth";
import { Service } from "../../redux/types";

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
  const { user } = useAuth();
  const registeredServices = user?.services || [];

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
              <div className="business-name">{user?.businessName}</div>
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
                {registeredServices.map((service: Service, index) => (
                  <div key={index} className="service-item">
                    <span className="service-bullet">•</span>
                    {service.service}
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

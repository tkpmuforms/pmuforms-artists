"use client";

import type React from "react";
import { ChevronLeft, X } from "lucide-react";
import "./preview-appointment-modal.scss";

interface PreviewAppointmentModalProps {
  onClose: () => void;
}

const PreviewAppointmentModal: React.FC<PreviewAppointmentModalProps> = ({
  onClose,
}) => {
  const selectedServices = ["BB Glow", "Dry Needling", "Tattoo Removal"];

  const formsToSend = [
    "Client Information & Medical History",
    "Precautionary Coronavirus Liability Release Form",
    "Picture of the area getting treatment done",
    "Possible Risks, Hazards, or Complications",
    "Permanent Makeup Consent & Procedure Permission",
  ];

  return (
    <div className="preview-appointment-modal">
      <div className="preview-appointment-modal__overlay" onClick={onClose} />
      <div className="preview-appointment-modal__content">
        <div className="preview-appointment-modal__header">
          <button className="preview-appointment-modal__back">
            <ChevronLeft size={20} />
          </button>
          <h2>Preview Appointment</h2>
          <button
            className="preview-appointment-modal__close"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="preview-appointment-modal__body">
          <div className="appointment-info">
            <div className="info-section">
              <div className="info-group">
                <label>Client Name</label>
                <div className="client-info">
                  <div className="client-avatar">LL</div>
                  <span>Linda Lovely</span>
                </div>
              </div>
              <div className="info-group">
                <label>Appointment Date</label>
                <div className="date-info">
                  <span>📅</span>
                  <span>June 25, 2025</span>
                </div>
              </div>
            </div>

            <div className="services-section">
              <label>Services Selected</label>
              <div className="services-list">
                {selectedServices.map((service, index) => (
                  <div key={index} className="service-item">
                    <span className="service-bullet">•</span>
                    {service}
                  </div>
                ))}
              </div>
            </div>

            <div className="forms-section">
              <label>Forms to be sent</label>
              <div className="forms-list">
                {formsToSend.map((form, index) => (
                  <div key={index} className="form-item">
                    <span className="form-icon">📄</span>
                    {form}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          className="preview-appointment-modal__continue"
          onClick={onClose}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default PreviewAppointmentModal;

"use client";
import type React from "react";
import { ChevronLeft, X } from "lucide-react";
import { useState, useEffect } from "react";
import "./preview-appointment-modal.scss";
import { formatAppointmentTime } from "../../../utils/utils";

interface PreviewAppointmentModalProps {
  onClose: () => void;
  onSuccess: () => void;
  clientName: string;
  appointmentDate: string;
  selectedServices: string[];
  selectedServiceIds: string[];
}

const PreviewAppointmentModal: React.FC<PreviewAppointmentModalProps> = ({
  onClose,
  onSuccess,
  clientName,
  appointmentDate,
  selectedServices,
  selectedServiceIds,
}) => {
  const [formsToSend, setFormsToSend] = useState<string[]>([
    "Client Information & Medical History",
    "Precautionary Coronavirus Liability Release Form",
    "Picture of the area getting treatment done",
    "Possible Risks, Hazards, or Complications",
    "Permanent Makeup Consent & Procedure Permission",
  ]);

  // Function to fetch forms based on service IDs
  const fetchFormsForServices = async (serviceIds: string[]) => {};

  useEffect(() => {
    if (selectedServiceIds && selectedServiceIds.length > 0) {
      fetchFormsForServices(selectedServiceIds);
    }
  }, [selectedServiceIds]);

  const getClientInitials = (name: string) => {
    return name
      ?.split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .substring(0, 2);
  };

  const handleContinue = () => {
    // Add your logic here to send the consent forms
    onSuccess();
  };

  return (
    <div className="preview-appointment-modal">
      <div className="preview-appointment-modal__overlay" onClick={onClose} />
      <div className="preview-appointment-modal__content">
        <div className="preview-appointment-modal__header">
          <button className="preview-appointment-modal__back" onClick={onClose}>
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
          <div className="appointment-details">
            <div className="detail-row">
              <div className="client-info">
                <span className="label">Client Name</span>
                <div className="client-content">
                  <div className="client-avatar">
                    {getClientInitials(clientName)}
                  </div>
                  <span className="value">{clientName}</span>
                </div>
              </div>

              <div className="appointment-info">
                <span className="label">Appointment Date</span>
                <div className="value">
                  <span className="date-icon">📅</span>
                  {formatAppointmentTime(appointmentDate)}
                </div>
              </div>
            </div>

            <div className="divider"></div>

            <div className="services-section">
              <span className="section-label">Services Selected</span>
              <div className="services-list">
                {selectedServices.map((service, index) => (
                  <div key={index} className="service-item">
                    <span className="bullet">•</span>
                    <span>{service}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="divider"></div>

            <div className="forms-section">
              <span className="section-label">Forms to be sent</span>
              <div className="forms-list">
                {formsToSend.map((form, index) => (
                  <div key={index} className="form-item">
                    <span className="form-icon">📄</span>
                    <span>{form}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="divider"></div>

        <div className="preview-appointment-modal__footer">
          <button className="continue-button" onClick={handleContinue}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewAppointmentModal;

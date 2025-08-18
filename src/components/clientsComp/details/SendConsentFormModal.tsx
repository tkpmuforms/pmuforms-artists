"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { X, Calendar } from "lucide-react";
import "./send-consent-form-modal.scss";
import PreviewAppointmentModal from "./PreviewAppointMent";
import { Service } from "../../../redux/types";
import { getServices } from "../../../services/artistServices";

interface SendConsentFormModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const SendConsentFormModal: React.FC<SendConsentFormModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [appointmentDate, setAppointmentDate] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showPreviewAppointment, setShowPreviewAppointment] = useState(false);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    getServices()
      .then((response) => {
        console.log("Fetched services:", response.data.services);
        const services: Service[] = response.data.services.map(
          (service: Service) => ({
            _id: service._id,
            id: service.id,
            service: service.service,
          })
        );
        setServices(services);
      })
      .catch((error) => {
        console.error("Error fetching services:", error);
      });
  }, []);

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const handleContinue = () => {
    if (appointmentDate && selectedServices.length > 0) {
      setShowPreviewAppointment(true);
    }
  };

  return (
    <div className="send-consent-form-modal">
      <div className="send-consent-form-modal__overlay" onClick={onClose} />
      <div className="send-consent-form-modal__content">
        <button className="send-consent-form-modal__close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="send-consent-form-modal__header">
          <h2>Send Consent Form</h2>
          <p>
            Select the date and service to send the consent form to the client.
          </p>
        </div>

        <div className="send-consent-form-modal__body">
          <div className="form-group">
            <label htmlFor="appointmentDate">
              What's the date of the upcoming appointment(s)?*
            </label>
            <div className="date-input-wrapper">
              <input
                id="appointmentDate"
                type="text"
                placeholder="DD/MM/YYYY"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="form-input"
              />
              <Calendar size={16} className="date-icon" />
            </div>
          </div>

          <div className="form-group">
            <label>
              Select services for this client's upcoming appointment(s)*
            </label>
            <div className="services-grid">
              {services.map((service) => (
                <button
                  key={service?._id}
                  className={`service-tag ${
                    selectedServices.includes(service._id)
                      ? "service-tag--selected"
                      : ""
                  }`}
                  onClick={() => toggleService(service?.id)}
                >
                  {service?.service}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          className={`send-consent-form-modal__continue ${
            appointmentDate && selectedServices.length > 0
              ? ""
              : "send-consent-form-modal__continue--disabled"
          }`}
          onClick={handleContinue}
          disabled={!appointmentDate || selectedServices.length === 0}
        >
          Continue
        </button>
      </div>
      \
      {showPreviewAppointment && (
        <PreviewAppointmentModal
          onClose={() => setShowPreviewAppointment(false)}
        />
      )}
    </div>
  );
};

export default SendConsentFormModal;

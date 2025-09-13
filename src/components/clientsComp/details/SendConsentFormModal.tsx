"use client";
import { X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import useAuth from "../../../context/useAuth";
import PreviewAppointmentModal from "./PreviewAppointMent";
import "./send-consent-form-modal.scss";

interface SendConsentFormModalProps {
  onClose: () => void;
  onSuccess: () => void;
  clientName: string;
  clientId: string | undefined;
}

const SendConsentFormModal: React.FC<SendConsentFormModalProps> = ({
  onClose,
  onSuccess,
  clientName,
  clientId,
}) => {
  const { user } = useAuth();
  const [appointmentDate, setAppointmentDate] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showPreviewAppointment, setShowPreviewAppointment] = useState(false);

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((s) => s !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleContinue = () => {
    if (appointmentDate && selectedServices.length > 0) {
      setShowPreviewAppointment(true);
    }
  };

  const getSelectedServiceNames = () => {
    return (
      user?.services
        ?.filter((service: any) => selectedServices.includes(service?.id))
        ?.map((service: any) => service?.service) || []
    );
  };

  return (
    <>
      <div className="send-consent-form-modal">
        <div className="send-consent-form-modal__overlay" onClick={onClose} />
        <div className="send-consent-form-modal__content">
          <button className="send-consent-form-modal__close" onClick={onClose}>
            <X size={20} />
          </button>

          <div className="send-consent-form-modal__header">
            <h2>Send Consent Form</h2>
            <p>
              Select the date and service to send the consent form to{" "}
              {clientName}.
            </p>
          </div>

          <div className="send-consent-form-modal__body">
            <div className="form-group">
              <label>What's the date of the upcoming appointment(s)?*</label>
              <div className="date-input-wrapper">
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                Select services for this client's upcoming appointment(s)*
              </label>
              <div className="services-grid">
                {user?.services?.map((service: any) => (
                  <div
                    key={service?.id}
                    className={`service-tag ${
                      selectedServices.includes(service?.id)
                        ? "service-tag--selected"
                        : ""
                    }`}
                    onClick={() => toggleService(service?.id)}
                  >
                    {service?.service}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            className={`send-consent-form-modal__continue ${
              !appointmentDate || selectedServices.length === 0
                ? "send-consent-form-modal__continue--disabled"
                : ""
            }`}
            onClick={handleContinue}
            disabled={!appointmentDate || selectedServices.length === 0}
          >
            Continue
          </button>
        </div>
      </div>

      {showPreviewAppointment && (
        <PreviewAppointmentModal
          clientName={clientName}
          clientId={clientId || ""}
          appointmentDate={appointmentDate}
          selectedServices={getSelectedServiceNames()}
          selectedServiceIds={selectedServices}
          onClose={() => setShowPreviewAppointment(false)}
          onSuccess={onSuccess}
        />
      )}
    </>
  );
};

export default SendConsentFormModal;

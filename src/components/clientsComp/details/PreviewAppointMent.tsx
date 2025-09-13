"use client";
import type React from "react";
import { ChevronLeft, X } from "lucide-react";
import { useState, useEffect } from "react";
import "./preview-appointment-modal.scss";
import { formatAppointmentTime } from "../../../utils/utils";
import {
  getMyServiceForms,
  bookAppointment,
} from "../../../services/artistServices";
import { LoadingSmall } from "../../loading/Loading";

interface PreviewAppointmentModalProps {
  onClose: () => void;
  onSuccess: (appointmentUrl?: string) => void;
  clientName: string;
  clientId: string;
  appointmentDate: string;
  selectedServices: string[];
  selectedServiceIds: string[];
}

interface FormData {
  id: number;
  name: string;
  title: string;
}

const PreviewAppointmentModal: React.FC<PreviewAppointmentModalProps> = ({
  onClose,
  onSuccess,
  clientId,
  clientName,
  appointmentDate,
  selectedServices,
  selectedServiceIds,
}) => {
  const [formsToSend, setFormsToSend] = useState<FormData[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // Function to fetch forms based on service IDs
  const fetchFormsForServices = async (serviceIds: string[]) => {
    if (!serviceIds || serviceIds.length === 0) return;

    setIsLoadingForms(true);

    try {
      // Convert string IDs to numbers for the API
      const numericServiceIds = serviceIds
        .map((id) => parseInt(id, 10))
        .filter((id) => !isNaN(id));

      if (numericServiceIds.length === 0) {
        throw new Error("Invalid service IDs");
      }

      const response = await getMyServiceForms(numericServiceIds);

      // Assuming the API returns an array of forms in response.data
      setFormsToSend(response.data?.forms || []);
    } catch (error) {
      console.error("Error fetching forms:", error);

      setFormsToSend([]);
    } finally {
      setIsLoadingForms(false);
    }
  };

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

  const handleContinue = async () => {
    setIsBooking(true);

    try {
      // Prepare the booking data
      const bookingData = {
        appointmentDate,
        customerId: clientId,
        services: selectedServiceIds
          .map((id) => parseInt(id, 10))
          .filter((id) => !isNaN(id)),
      };

      // Call the book appointment API
      const response = await bookAppointment(bookingData);

      // Extract the appointment ID from the response
      const appointmentId = response.data?.appointmentId || response.data?.id;

      if (appointmentId) {
        // Construct the URL with the appointment ID
        const baseUrl =
          process.env.REACT_APP_USER_WEBSITE_URL || "https://yourwebsite.com";
        const appointmentUrl = `${baseUrl}/appointment/${appointmentId}`;

        console.log("Appointment booked successfully!");
        console.log("Appointment URL:", appointmentUrl);

        // Call the success callback with the appointment URL
        onSuccess(appointmentUrl);
      } else {
        console.error("No appointment ID returned from API");
        // Handle error case - you might want to show an error message
        alert("Error: No appointment ID received");
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
      // Handle error - show toast, alert, etc.
      alert("Error booking appointment. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  const renderFormsSection = () => {
    if (isLoadingForms) {
      return <LoadingSmall />;
    }

    if (formsToSend.length === 0) {
      return (
        <div className="no-forms">
          <span>No forms available for selected services</span>
        </div>
      );
    }

    return (
      <div className="forms-list">
        {formsToSend.map((form) => (
          <div key={form.id} className="form-item">
            <span className="form-icon">📄</span>
            <span>{form?.title}</span>
          </div>
        ))}
      </div>
    );
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
              {renderFormsSection()}
            </div>
          </div>
        </div>

        <div className="divider"></div>

        <div className="preview-appointment-modal__footer">
          <button
            className="continue-button"
            onClick={handleContinue}
            disabled={formsToSend.length === 0 || isBooking}
          >
            {isBooking ? "Booking..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewAppointmentModal;

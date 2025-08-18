"use client";

import type React from "react";
import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  SignatureButtonSvg,
  SignatureformsSvg,
  SignatureServicesCheckSvg,
} from "../../../assets/svgs/ClientsSvg";
import SignatureModal from "../../../components/clientsComp/signature/SignatureModal";
import "./SignaturePage.scss";
import { signAppointment } from "../../../services/artistServices";

interface FormTemplate {
  appointmentId: string;
  title: string;
  status: string;
  formTemplate?: {
    title: string;
  };
}

interface ServiceDetail {
  id: number;
  service: string;
}

interface Appointment {
  id: string;
  date: string;
  serviceDetails: ServiceDetail[];
  allFormsCompleted: boolean;
  signed: boolean;
}

const SignFormsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { forms, clientName, appointments } = location.state || {};
  const [showSignModal, setShowSignModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentAppointment: Appointment = appointments?.find(
    (appointment: Appointment) => appointment.id === appointmentId
  );

  // Filter forms for this specific appointment
  const appointmentForms =
    forms?.filter(
      (form: FormTemplate) => form.appointmentId === appointmentId
    ) || [];

  const completedForms = appointmentForms.filter(
    (form: FormTemplate) =>
      form.status === "complete" || form.status === "completed"
  );

  // Get services from appointment
  const services = currentAppointment?.serviceDetails || [];

  // Format appointment date
  const formatAppointmentDate = (dateString: string) => {
    if (!dateString) return "your upcoming appointment";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleBackClick = () => {
    navigate("/");
  };

  const handleSignClick = () => {
    console.log("Sign button clicked");
    setShowSignModal(true);
    console.log(showSignModal);
  };

  const handleConfirmSign = () => {
    setShowConfirmModal(false);
    setShowSignModal(true);
  };

  // Handle signature submission
  const handleSignatureSubmit = async (signatureDataUrl: string) => {
    if (!appointmentId) {
      setSubmitError("Appointment ID is missing");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await signAppointment(appointmentId, {
        signatureUrl: signatureDataUrl,
      });

      // Update local appointment state to reflect signing
      if (currentAppointment) {
        currentAppointment.signed = true;
      }

      setShowSignModal(false);

      // Optional: Show success message or navigate
      // You could add a success toast or redirect here
      console.log("Signature submitted successfully");
    } catch (error) {
      console.error("Error submitting signature:", error);
      setSubmitError("Failed to submit signature. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSign =
    currentAppointment?.allFormsCompleted && !currentAppointment?.signed;

  // Handle case where appointment is not found
  if (!currentAppointment) {
    // Check if all forms are completed

    return (
      <div className="sign-forms-page">
        <div className="sign-forms-page__content">
          <div className="sign-card">
            <div className="sign-card__content">
              <p>Appointment not found. Please check the appointment ID.</p>
              <button onClick={handleBackClick}>Go Back</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sign-forms-page">
      <div className="sign-forms-page__content">
        <div className="sign-card">
          <div className="sign-card__header">
            <div className="sign-card__title-section">
              <h1 className="sign-card__title">Sign Appointment Forms</h1>
              <p className="sign-card__subtitle">
                Sign Client Appointment Forms
              </p>
            </div>
            <button
              className={`sign-card__sign-btn ${
                !canSign ? "sign-card__sign-btn--disabled" : ""
              }`}
              onClick={handleSignClick}
              disabled={!canSign || isSubmitting}
            >
              <SignatureButtonSvg />
              {isSubmitting
                ? "Submitting..."
                : currentAppointment?.signed
                ? "Already Signed"
                : "Sign Appointment Forms"}
            </button>
          </div>

          <div className="sign-card__content">
            {submitError && (
              <div className="error-message">
                <p>{submitError}</p>
              </div>
            )}

            <div className="intro-section">
              <p className="intro-text">
                {currentAppointment?.allFormsCompleted
                  ? `Thank you for completing all the forms for your appointment on ${formatAppointmentDate(
                      currentAppointment?.date
                    )}! Now, all you need to do is sign!`
                  : `Please complete all required forms before signing for your appointment on ${formatAppointmentDate(
                      currentAppointment?.date
                    )}.`}
              </p>
            </div>

            <div className="instruction-section">
              <p className="instruction-title">Please read carefully</p>
              <p className="instruction-text">
                By signing below,{" "}
                <span className="client-name">{clientName || "Client"}</span>{" "}
                hereby agree that all the information in the forms completed for
                the appointment is true and accurate to the best of my
                knowledge.
              </p>
            </div>

            <div className="forms-grid">
              <div className="forms-column">
                <h3 className="column-title">
                  Forms{" "}
                  {currentAppointment?.allFormsCompleted
                    ? "Completed"
                    : `(${completedForms.length} of ${appointmentForms.length} completed)`}
                </h3>
                <div className="forms-list">
                  {appointmentForms.length > 0 ? (
                    appointmentForms.map(
                      (form: FormTemplate, index: number) => (
                        <div key={index} className="form-item">
                          <SignatureformsSvg />
                          <span className="form-item__text">
                            {form.formTemplate?.title ||
                              form.title ||
                              `Form ${index + 1}`}
                          </span>
                        </div>
                      )
                    )
                  ) : (
                    <div className="form-item">
                      <span className="form-item__text">
                        No forms available
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="services-column">
                <h3 className="column-title">Services being done</h3>
                <div className="services-list">
                  {services.length > 0 ? (
                    services.map((service: ServiceDetail, index: number) => (
                      <div key={service.id || index} className="service-item">
                        <SignatureServicesCheckSvg />
                        <span className="service-item__text">
                          {service.service}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="service-item">
                      <span className="service-item__text">
                        No services specified
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="warning-box">
              <div className="warning-box__content">
                <h3 className="warning-box__title">Warning</h3>
                <p className="warning-box__text">
                  Once you sign below, neither you nor the artist can make
                  changes. To change your answers after signing, you must create
                  a new set of forms for this appointment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSignModal && (
        <SignatureModal
          onClose={() => setShowSignModal(false)}
          onSubmit={handleSignatureSubmit}
          title="Sign Appointment Forms"
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default SignFormsPage;

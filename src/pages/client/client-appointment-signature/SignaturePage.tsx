"use client";

import { Check, PenTool } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import SignatureModal from "../../../components/clientsComp/signature/SignatureModal";
import "./SignaturePage.scss";

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

  // Find the specific appointment by ID from params
  const currentAppointment: Appointment = appointments?.find(
    (appointment: Appointment) => appointment.id === appointmentId
  );

  // Filter forms for this specific appointment
  const appointmentForms =
    forms?.filter(
      (form: FormTemplate) => form.appointmentId === appointmentId
    ) || [];

  // Filter completed forms for this appointment
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
    setShowConfirmModal(true);
  };

  const handleConfirmSign = () => {
    setShowConfirmModal(false);
    setShowSignModal(true);
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
              disabled={!canSign}
            >
              <PenTool size={16} />
              {currentAppointment?.signed
                ? "Already Signed"
                : "Sign Appointment Forms"}
            </button>
          </div>

          <div className="sign-card__content">
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
                          <Check
                            className={`form-item__icon ${
                              form.status === "complete" ||
                              form.status === "completed"
                                ? "form-item__icon--completed"
                                : "form-item__icon--pending"
                            }`}
                            size={16}
                          />
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
                        <div className="service-item__dot"></div>
                        <span className="service-item__text">
                          {service.service}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="service-item">
                      <div className="service-item__dot"></div>
                      <span className="service-item__text">
                        No services specified
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="warning-box">
              <div className="warning-box__icon">
                <span>!</span>
              </div>
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

      {/* {showConfirmModal && (
        <ConfirmationModal
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmSign}
          title="Are you sure?"
          description="Are you sure that the signature is correct and you want to sign these documents?"
          confirmText="Go Back and Loose Changes"
          cancelText="Continue Editing"
        />
      )} */}

      {showSignModal && (
        <SignatureModal
          onClose={() => setShowSignModal(false)}
          title="Sign Appointment Forms"
        />
      )}
    </div>
  );
};

export default SignFormsPage;

"use client";

import imageCompression from "browser-image-compression";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type React from "react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  SignatureButtonSvg,
  SignatureformsSvg,
  SignatureServicesCheckSvg,
} from "../../../assets/svgs/ClientsSvg";
import SignatureModal from "../../../components/clientsComp/signature/SignatureModal";
import useAuth from "../../../context/useAuth";
import { storage } from "../../../firebase/firebase";
import { signAppointment } from "../../../services/artistServices";
import { formatAppointmentTime } from "../../../utils/utils";
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
  const { user } = useAuth();
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { forms, clientName, appointments } = location.state || {};
  const [showSignModal, setShowSignModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [, setSignatureUrl] = useState<string | null>(null);

  const currentAppointment: Appointment = appointments?.find(
    (appointment: Appointment) => appointment.id === appointmentId
  );

  const appointmentForms =
    forms?.filter(
      (form: FormTemplate) => form.appointmentId === appointmentId
    ) || [];

  const completedForms = appointmentForms.filter(
    (form: FormTemplate) =>
      form.status === "complete" || form.status === "completed"
  );

  const services = currentAppointment?.serviceDetails || [];

  const handleBackClick = () => {
    navigate("/");
  };

  const handleSignClick = () => {
    console.log("Sign button clicked");
    setShowSignModal(true);
    console.log(showSignModal);
  };

  const handleSignatureSubmit = async (signatureDataUrl: string) => {
    if (!appointmentId) {
      setSubmitError("Appointment ID is missing");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(signatureDataUrl);
      const blob = await response.blob();

      const timestamp = Date.now();
      const fileName = `signature_${appointmentId}_${timestamp}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      const options = {
        maxSizeMB: 0.4, // 400KB
        maxWidthOrHeight: 500,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      const storageRef = ref(storage, `signatures/${user?._id}/${fileName}`);
      const snapshot = await uploadBytes(storageRef, compressedFile);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      await signAppointment(appointmentId, {
        signatureUrl: downloadUrl,
      });

      if (currentAppointment) {
        currentAppointment.signed = true;
      }

      setSignatureUrl(downloadUrl);
      setShowSignModal(false);

      toast.success("Signature submitted successfully");
      console.log("Signature submitted successfully");
    } catch (error) {
      console.error("Error submitting signature:", error);
      setSubmitError("Failed to submit signature. Please try again.");
      toast.error("Failed to submit signature");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSign =
    currentAppointment?.allFormsCompleted && !currentAppointment?.signed;

  if (!currentAppointment) {
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
                  ? `Thank you for completing all the forms for your appointment on ${formatAppointmentTime(
                      currentAppointment?.date
                    )}! Now, all you need to do is sign!`
                  : `Please complete all required forms before signing for your appointment on ${formatAppointmentTime(
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

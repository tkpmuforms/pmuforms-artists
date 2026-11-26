"use client";

import imageCompression from "browser-image-compression";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  SignatureButtonSvg,
  SignatureformsSvg,
  SignatureServicesCheckSvg,
} from "../../../assets/svgs/ClientsSvg";
import SignatureModal from "../../../components/clients/signature/SignatureModal";
import AppointmentNextStepModal from "../../../components/clients/appointments/AppointmentNextStepModal";
import useAuth from "../../../context/useAuth";
import { storage } from "../../../firebase/firebase";
import { LoadingSmall } from "../../../components/loading/Loading";
import {
  getAppointmentById,
  getCustomerById,
  getFilledFormsByAppointment,
  signAppointment,
} from "../../../services/artistServices";
import { formatAppointmentTime } from "../../../utils/utils";
import "./SignaturePage.scss";

interface FilledFormSummary {
  id?: string;
  _id?: string;
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

const isComplete = (form: FilledFormSummary) =>
  ["complete", "completed", "signed"].includes(form.status);

const SignFormsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { appointmentId, id } = useParams<{
    appointmentId: string;
    id: string;
  }>();
  const [clientName, setClientName] = useState<string>(
    location.state?.clientName || ""
  );
  // always loaded fresh: navigation state goes stale once the forms are
  // signed, and a stale `signed: false` would offer signing again
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [forms, setForms] = useState<FilledFormSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSignModal, setShowSignModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showNextStep, setShowNextStep] = useState(false);
  // blocks a second submit before the isSubmitting re-render lands
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!appointmentId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [appointmentResponse, formsResponse] = await Promise.all([
          getAppointmentById(appointmentId),
          getFilledFormsByAppointment(appointmentId),
        ]);
        if (cancelled) return;
        setAppointment(appointmentResponse?.data?.appointment ?? null);
        setForms(formsResponse?.data?.filledForms || []);

        if (!location.state?.clientName && id) {
          const clientResponse = await getCustomerById(id);
          if (!cancelled) {
            setClientName(clientResponse?.data?.customer?.name || "Client");
          }
        }
      } catch (error) {
        console.error("Error loading appointment:", error);
        if (!cancelled) setAppointment(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [appointmentId, id, location.state?.clientName]);

  const completedForms = forms.filter(isComplete);
  const services = appointment?.serviceDetails || [];
  const canSign =
    !!appointment?.allFormsCompleted && !appointment?.signed && !isSubmitting;

  const handleBackClick = () => {
    navigate("/");
  };

  const handleSignClick = () => {
    if (!canSign) return;
    setShowSignModal(true);
  };

  const goToSignedForms = () => {
    setShowNextStep(false);
    // replace, so Back doesn't return to a signing page for signed forms
    navigate(`/clients/${id}/appointments/${appointmentId}/forms/all`, {
      replace: true,
      state: { clientName },
    });
  };

  const handleSignatureSubmit = async (signatureDataUrl: string) => {
    if (!appointmentId || !appointment) {
      setSubmitError("Appointment ID is missing");
      return;
    }
    // a second submit while the first is in flight, or after signing
    if (submittingRef.current || appointment.signed) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(signatureDataUrl);
      const blob = await response.blob();

      const timestamp = Date.now();
      const fileName = `signature_${appointmentId}_${timestamp}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 500,
        useWebWorker: true,
      });

      const storageRef = ref(
        storage,
        `6signatures/${user?._id}/${appointmentId}/${fileName}`
      );
      const snapshot = await uploadBytes(storageRef, compressedFile);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      await signAppointment(appointmentId, {
        signatureUrl: downloadUrl,
      });

      setAppointment({ ...appointment, signed: true });
      setShowSignModal(false);
      toast.success("Signature submitted successfully");
      // next: mark the procedure complete / send care instructions
      setShowNextStep(true);
    } catch (error) {
      console.error("Error submitting signature:", error);
      setSubmitError("Failed to submit signature. Please try again.");
      toast.error("Failed to submit signature");
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSmall />;
  }

  if (!appointment) {
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
              <SignatureButtonSvg />
              {isSubmitting
                ? "Submitting..."
                : appointment.signed
                ? "Already Signed"
                : "Sign Appointment Forms"}
            </button>
          </div>

          <div className="sign-card__content">
            {appointment.signed && (
              <button
                type="button"
                className="sign-card__view-forms"
                onClick={goToSignedForms}
              >
                View signed forms
              </button>
            )}

            {submitError && (
              <div className="error-message">
                <p>{submitError}</p>
              </div>
            )}

            <div className="intro-section">
              <p className="intro-text">
                {appointment.signed
                  ? "These forms are signed and can no longer be changed."
                  : appointment.allFormsCompleted
                  ? `Thank you for completing all the forms for your appointment on ${formatAppointmentTime(
                      appointment.date
                    )}! Now, all you need to do is sign!`
                  : `Please complete all required forms before signing for your appointment on ${formatAppointmentTime(
                      appointment.date
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
                  {appointment.allFormsCompleted
                    ? "Completed"
                    : `(${completedForms.length} of ${forms.length} completed)`}
                </h3>
                <div className="forms-list">
                  {forms.length > 0 ? (
                    forms.map(
                      (form: FilledFormSummary, index: number) => (
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
                  Once you sign the forms, neither you nor the artist can make
                  changes. To change your answers after signing, you must create
                  a new set of forms for the appointment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showNextStep && appointmentId && (
        <AppointmentNextStepModal
          appointmentId={appointmentId}
          clientName={clientName || "your client"}
          onFinish={goToSignedForms}
        />
      )}

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

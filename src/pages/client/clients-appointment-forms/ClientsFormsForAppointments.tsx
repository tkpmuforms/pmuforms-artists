"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { ArrowLeft, FileText } from "lucide-react";
import "./appointment-forms-page.scss";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getFilledFormsByAppointment } from "../../../services/artistServices";
import { FilledForm } from "../../../redux/types";
import { formatAppointmentTime } from "../../../utils/utils";
import { AppointmentSvg } from "../../../assets/svgs/ClientsSvg";

const ClientsFormsForAppointments: React.FC = () => {
  const { id, appointmentId } = useParams();
  const location = useLocation();
  const [forms, setForms] = useState<FilledForm[]>([]);
  const [loading, setLoading] = useState(false);
  const { clientName, appointments } = location.state || {};
  const navigate = useNavigate();

  const onBack = () => {
    navigate(-1);
  };

  const onViewForm = (formId: string) => {
    navigate(`/clients/${id}/appointments/${appointmentId}/forms/${formId}`);
  };

  const onSignForms = () => {
    navigate(`/clients/${id}/appointments/${appointmentId}/signature`, {
      state: { clientName, forms, appointments },
    });
  };

  useEffect(() => {
    if (!appointmentId) return;

    setLoading(true);
    getFilledFormsByAppointment(appointmentId)
      .then((res) => {
        setForms(res.data?.filledForms || []);
      })
      .catch((error) => {
        console.error("Error fetching forms:", error);
        setForms([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [appointmentId]);

  if (loading) {
    return (
      <div className="appointment-forms-page">
        <div className="container">
          <div className="loading">Loading forms...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="appointment-forms-page">
      <div className="container">
        {/* Header */}
        <div className="header">
          <div className="header-content">
            <h1>{clientName}'s Appointment Form</h1>
            <p>
              Check out all your appointments and forms with{" "}
              {clientName?.split(" ")[0]} right here!
            </p>
          </div>
          <button onClick={onSignForms} className="sign-forms-btn">
            <FileText size={16} />
            Sign Appointment Forms
          </button>
        </div>

        <div className="forms-grid">
          {forms.length === 0 ? (
            <div className="no-forms">
              <FileText size={48} />
              <h3>No forms found</h3>
              <p>There are no forms associated with this appointment.</p>
            </div>
          ) : (
            forms.map((form) => (
              <div
                key={form.id || form._id}
                className="form-card"
                onClick={() => onViewForm(form.formTemplateId)}
              >
                <div className="form-header">
                  <div className="form-icon">
                    <AppointmentSvg />
                  </div>
                  <h3>{form.title}</h3>
                </div>

                <div className="status-badge">
                  <span className={`badge ${form.status.toLowerCase()}`}>
                    {form.status === "completed"
                      ? "Forms Completed"
                      : form.status}
                  </span>
                </div>

                <div className="form-details">
                  <div className="detail-section">
                    <span className="detail-label">Appointment Date</span>
                    <span className="detail-value">
                      {formatAppointmentTime(form.createdAt)}
                    </span>
                  </div>

                  <div className="detail-section">
                    <span className="detail-label">Form Filled</span>
                    <span className="detail-value">
                      {formatAppointmentTime(form.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientsFormsForAppointments;

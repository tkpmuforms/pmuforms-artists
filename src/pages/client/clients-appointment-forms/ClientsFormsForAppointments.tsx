"use client";

import { FileText } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FilledForm } from "../../../redux/types";
import { getFilledFormsByAppointment } from "../../../services/artistServices";

import "./appointment-forms-page.scss";
import ClientFormsCard from "../../../components/clientsComp/filled-forms/ClientFormsCard";

const ClientsFormsForAppointments: React.FC = () => {
  const { id, appointmentId } = useParams();
  const location = useLocation();
  const [forms, setForms] = useState<FilledForm[]>([]);
  const [loading, setLoading] = useState(false);
  const { clientName, appointments } = location.state || {};
  const navigate = useNavigate();

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

        {forms.length === 0 ? (
          <div className="no-forms">
            <div className="empty-state">
              <div className="empty-state__icon">
                <FileText size={48} />
              </div>
              <h3>No forms found</h3>
              <p>There are no forms associated with this appointment.</p>
            </div>
          </div>
        ) : (
          <div className="forms-grid">
            {forms.map((form) => (
              <ClientFormsCard
                key={form.id || form._id}
                form={form}
                onViewForm={onViewForm}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientsFormsForAppointments;

"use client";

import type React from "react";
import { useState } from "react";
import { ArrowLeft, FileText } from "lucide-react";
import "./appointment-forms-page.scss";
import { Form } from "../../../redux/types";
import { useNavigate } from "react-router-dom";

const ClientApportsmentsForms: React.FC = () => {
  const [forms] = useState<Form[]>([
    {
      id: "1",
      title: "Permanent Makeup Consent & Procedure Permission",
      status: "Forms Completed",
      appointmentDate: "June 25, 2025",
      formFilled: "June 25, 2025 | 03:00PM",
    },
    {
      id: "2",
      title: "Permanent Makeup Consent & Procedure Permission",
      status: "Forms Completed",
      appointmentDate: "June 25, 2025",
      formFilled: "June 25, 2025 | 03:00PM",
    },
    {
      id: "3",
      title: "Permanent Makeup Consent & Procedure Permission",
      status: "Forms Completed",
      appointmentDate: "June 25, 2025",
      formFilled: "June 25, 2025 | 03:00PM",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [clientName] = useState("Linda Lovely");
  const navigate = useNavigate();
  const onBack = () => {
    navigate(-1);
  };
  const onViewForm = (formId: string) => {};
  const onSignForms = () => {};

  return (
    <div className="appointment-forms-page">
      <div className="container">
        {/* Header */}
        <div className="header">
          <button onClick={onBack} className="back-btn">
            <ArrowLeft size={20} />
          </button>
          <div className="header-content">
            <h1>{clientName}'s Appointment Form</h1>
            <p>
              Check out all your appointments and forms with{" "}
              {clientName.split(" ")[0]} right here!
            </p>
          </div>
          <button onClick={onSignForms} className="sign-forms-btn">
            <FileText size={16} />
            Sign Appointment Forms
          </button>
        </div>

        {/* Forms Grid */}
        <div className="forms-grid">
          {forms.map((form) => (
            <div
              key={form.id}
              className="form-card"
              onClick={() => onViewForm(form.id)}
            >
              <div className="form-header">
                <div className="form-icon">
                  <FileText size={20} />
                </div>
                <h3>{form.title}</h3>
              </div>

              <div className="status-badge">
                <span className="badge completed">{form?.status}</span>
              </div>

              <div className="form-details">
                <div className="detail-section">
                  <span className="detail-label">Appointment Date</span>
                  <span className="detail-value">{form?.appointmentDate}</span>
                </div>

                <div className="detail-section">
                  <span className="detail-label">Form Filled</span>
                  <span className="detail-value">{form?.formFilled}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientApportsmentsForms;

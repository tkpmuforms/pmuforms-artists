"use client";

import type React from "react";
import { useState } from "react";
import {
  ChevronLeft,
  Edit,
  Calendar,
  Send,
  Clock,
  User,
  Trash2,
  Mail,
  Phone,
  Copy,
} from "lucide-react";

import "./client-detail-page.scss";
import DeleteClientModal from "../../../components/clientsComp/details/DeletClientModal";
import SendConsentFormModal from "../../../components/clientsComp/details/SendConsentFormModal";
import PreviewAppointmentModal from "../../../components/clientsComp/details/PreviewAppointMent";
import EditClientModal from "../../../components/clientsComp/details/EditClientModal";

const ClientDetailPage: React.FC = () => {
  const [showEditClient, setShowEditClient] = useState(false);
  const [showPreviewAppointment, setShowPreviewAppointment] = useState(false);
  const [showSendConsentForm, setShowSendConsentForm] = useState(false);
  const [showFormSentSuccess, setShowFormSentSuccess] = useState(false);
  const [showDeleteClient, setShowDeleteClient] = useState(false);

  const quickActions = [
    {
      icon: <Calendar size={20} />,
      title: "View Appointment",
      onClick: () => setShowPreviewAppointment(true),
    },
    {
      icon: <Send size={20} />,
      title: "Send Consent Form",
      onClick: () => setShowSendConsentForm(true),
    },
    {
      icon: <Clock size={20} />,
      title: "Set Reminders",
      onClick: () => console.log("Set Reminders"),
    },
    {
      icon: <User size={20} />,
      title: "View Notes",
      onClick: () => console.log("View Notes"),
    },
  ];

  return (
    <div className="client-detail-page">
      <div className="client-detail-page__header">
        <button className="client-detail-page__back">
          <ChevronLeft size={20} />
          Clients
        </button>
      </div>

      <div className="client-detail-page__content">
        <div className="client-detail-page__profile">
          <div className="profile-info">
            <h1>Linda Lovely</h1>
            <p>Here are all the essential details about your client.</p>
          </div>
          <button
            className="edit-client-btn"
            onClick={() => setShowEditClient(true)}
          >
            <Edit size={16} />
            Edit Client
          </button>
        </div>

        <div className="client-detail-page__overview">
          <h2>CLIENT OVERVIEW</h2>
          <div className="overview-grid">
            <div className="overview-card">
              <div className="overview-card__icon pending">
                <span>⚠️</span>
              </div>
              <div className="overview-card__content">
                <div className="overview-card__label">Pending Forms</div>
                <div className="overview-card__value">07</div>
              </div>
            </div>

            <div className="overview-card">
              <div className="overview-card__icon appointments">
                <span>📅</span>
              </div>
              <div className="overview-card__content">
                <div className="overview-card__label">Total Appointments</div>
                <div className="overview-card__value">32</div>
              </div>
            </div>
          </div>
        </div>

        <div className="client-detail-page__contact">
          <div className="contact-item">
            <div className="contact-item__icon">
              <Mail size={20} />
            </div>
            <div className="contact-item__content">
              <div className="contact-item__label">Email Address</div>
              <div className="contact-item__value">
                linda.lovely@example.com
              </div>
            </div>
            <button className="contact-item__action">
              <Copy size={16} />
            </button>
          </div>

          <div className="contact-item">
            <div className="contact-item__icon">
              <Phone size={20} />
            </div>
            <div className="contact-item__content">
              <div className="contact-item__label">Email Address</div>
              <div className="contact-item__value">+1) 555 0123 4567</div>
            </div>
            <button className="contact-item__action">
              <Copy size={16} />
            </button>
          </div>
        </div>

        <div className="client-detail-page__actions">
          <h2>QUICK ACTIONS</h2>
          <div className="actions-grid">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="action-card"
                onClick={action.onClick}
              >
                <div className="action-card__icon">{action.icon}</div>
                <span className="action-card__title">{action.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="client-detail-page__danger">
          <button
            className="delete-client-btn"
            onClick={() => setShowDeleteClient(true)}
          >
            <Trash2 size={20} />
            Delete Client
          </button>
        </div>
      </div>

      {showEditClient && (
        <EditClientModal onClose={() => setShowEditClient(false)} />
      )}

      {showPreviewAppointment && (
        <PreviewAppointmentModal
          onClose={() => setShowPreviewAppointment(false)}
        />
      )}

      {showSendConsentForm && (
        <SendConsentFormModal
          onClose={() => setShowSendConsentForm(false)}
          onSuccess={() => {
            setShowSendConsentForm(false);
            setShowFormSentSuccess(true);
          }}
        />
      )}

      {/* {showFormSentSuccess && (
        <FormSentSuccessModal onClose={() => setShowFormSentSuccess(false)} />
      )} */}

      {showDeleteClient && (
        <DeleteClientModal onClose={() => setShowDeleteClient(false)} />
      )}
    </div>
  );
};

export default ClientDetailPage;

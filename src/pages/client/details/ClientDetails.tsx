"use client";

import {
  Calendar,
  ChevronLeft,
  Clock,
  Copy,
  Edit,
  Mail,
  Phone,
  Send,
  Trash2,
  User,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import DeleteClientModal from "../../../components/clientsComp/details/DeletClientModal";
import EditClientModal from "../../../components/clientsComp/details/EditClientModal";
import PreviewAppointmentModal from "../../../components/clientsComp/details/PreviewAppointMent";
import SendConsentFormModal from "../../../components/clientsComp/details/SendConsentFormModal";
import { LoadingSmall } from "../../../components/loading/Loading";
import { CustomerResponse } from "../../../redux/types";
import { getCustomerById } from "../../../services/artistServices";
import "./client-detail-page.scss";

interface ClientDetail {
  id: string;
  name: string;
  email: string;
  phone?: string;
  pendingForms: number;
  totalAppointments: number;
}

const ClientDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showEditClient, setShowEditClient] = useState(false);
  const [showPreviewAppointment, setShowPreviewAppointment] = useState(false);
  const [showSendConsentForm, setShowSendConsentForm] = useState(false);
  const [showFormSentSuccess, setShowFormSentSuccess] = useState(false);
  const [showDeleteClient, setShowDeleteClient] = useState(false);

  useEffect(() => {
    const fetchClientDetail = async () => {
      if (!id) {
        setError("Client ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await getCustomerById(id);
        console.log("Client data fetched:", response.data);
        if (response.status !== 200) {
          throw new Error("Failed to fetch client details");
        }
        const customer = response?.data.customer;

        if (customer) {
          setClient({
            id: customer.id,
            name: customer.name,
            email: customer.email || "No email provided",
            phone: customer?.info?.cell_phone || undefined,

            pendingForms: Math.floor(Math.random() * 10),
            totalAppointments: Math.floor(Math.random() * 50),
          });
        } else {
          setError("Client not found");
        }
      } catch (err) {
        console.error("Error fetching client details:", err);
        setError("Failed to load client details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchClientDetail();
  }, [id]);

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const handleBackClick = () => {
    navigate("/clients");
  };

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

  if (loading) {
    return <LoadingSmall />;
  }

  if (error || !client) {
    return (
      <div className="client-detail-page">
        <div className="client-detail-page__header">
          <button
            className="client-detail-page__back"
            onClick={handleBackClick}
          >
            <ChevronLeft size={20} />
            Clients
          </button>
        </div>
        <div className="error-state">
          <p>{error || "Client not found"}</p>
          <button onClick={handleBackClick}>Go Back to Clients</button>
        </div>
      </div>
    );
  }

  return (
    <div className="client-detail-page">
      <div className="client-detail-page__header">
        <button className="client-detail-page__back" onClick={handleBackClick}>
          <ChevronLeft size={20} />
          Clients
        </button>
      </div>

      <div className="client-detail-page__content">
        <div className="client-detail-page__profile">
          <div className="profile-info">
            <h1>{client.name}</h1>
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
                <div className="overview-card__value">
                  {client.pendingForms.toString().padStart(2, "0")}
                </div>
              </div>
            </div>

            <div className="overview-card">
              <div className="overview-card__icon appointments">
                <span>📅</span>
              </div>
              <div className="overview-card__content">
                <div className="overview-card__label">Total Appointments</div>
                <div className="overview-card__value">
                  {client.totalAppointments}
                </div>
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
              <div className="contact-item__value">{client.email}</div>
            </div>
            <button
              className="contact-item__action"
              onClick={() => handleCopyToClipboard(client.email)}
            >
              <Copy size={16} />
            </button>
          </div>

          {client.phone && (
            <div className="contact-item">
              <div className="contact-item__icon">
                <Phone size={20} />
              </div>
              <div className="contact-item__content">
                <div className="contact-item__label">Phone Number</div>
                <div className="contact-item__value">{client.phone}</div>
              </div>
              <button
                className="contact-item__action"
                onClick={() => handleCopyToClipboard(client.phone!)}
              >
                <Copy size={16} />
              </button>
            </div>
          )}
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

      {showDeleteClient && (
        <DeleteClientModal onClose={() => setShowDeleteClient(false)} />
      )}
    </div>
  );
};

export default ClientDetailPage;

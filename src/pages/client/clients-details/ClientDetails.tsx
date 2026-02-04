"use client";

import {
  Calendar,
  Check,
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
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  PendingFormsSvg,
  TotalAppointmentsSvg,
} from "../../../assets/svgs/formsSvg";

import DeleteModal from "../../../components/clientsComp/details/DeleteModal";
import EditClientModal from "../../../components/clientsComp/details/EditClientModal";
import SendConsentFormModal from "../../../components/clientsComp/details/SendConsentFormModal";
import { LoadingSmall } from "../../../components/loading/Loading";
import {
  deleteCustomer,
  getCustomerById,
  getCustomerMetrics,
} from "../../../services/artistServices";
import "./client-detail-page.scss";

interface ClientDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface ClientMetrics {
  pendingForms: number;
  totalAppointments: number;
}

const ClientDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditClient, setShowEditClient] = useState(false);
  const [showSendConsentForm, setShowSendConsentForm] = useState(false);
  const [showFormSentSuccess, setShowFormSentSuccess] = useState(false);
  const [showDeleteClient, setShowDeleteClient] = useState(false);
  const [clientMetricsMetadata, setClientMetricsMetadata] =
    useState<ClientMetrics | null>(null);

  const fetchClientDetails = useCallback(async () => {
    if (!id) {
      setError("Client ID is required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await getCustomerById(id);

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
        });
        setLoading(false);
      } else {
        setError("Client not found");
        setLoading(false);
        return;
      }

      const metricsResponse = await getCustomerMetrics(id);
      setClientMetricsMetadata(metricsResponse?.data?.metrics || null);
      setMetricsLoading(false);
    } catch (err) {
      console.error("Error fetching client details:", err);
      setError("Failed to load client details. Please try again.");
      setLoading(false);
      setMetricsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchClientDetails();
  }, [id, fetchClientDetails]);

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const quickActions = [
    {
      icon: <Calendar size={20} />,
      title: "View Appointment",
      onClick: () =>
        navigate(`/clients/${client?.id}/appointments`, {
          state: {
            clientName: client?.name,
            clientEmail: client?.email,
            clientPhone: client?.phone,
          },
        }),
    },
    {
      icon: <Send size={20} />,
      title: "Send Consent Form",
      onClick: () => setShowSendConsentForm(true),
    },
    {
      icon: <Clock size={20} />,
      title: "Set Reminders",
      onClick: () => navigate(`/clients/${client?.id}/reminders`),
    },
    {
      icon: <User size={20} />,
      title: "View Notes",
      onClick: () =>
        navigate(`/clients/${client?.id}/notes`, {
          state: {
            clientName: client?.name,
            clientEmail: client?.email,
            clientPhone: client?.phone,
          },
        }),
    },
  ];

  const renderMetricsCards = () => {
    return (
      <>
        <div className="overview-card">
          <div className="overview-card__icon pending">
            <PendingFormsSvg />
          </div>
          <div className="overview-card__content">
            <div className="overview-card__label">Pending Forms</div>
            <div className="overview-card__value">
              {metricsLoading ? (
                <div className="metrics-loading">
                  <div className="loading-skeleton"></div>
                </div>
              ) : (
                clientMetricsMetadata?.pendingForms || "0"
              )}
            </div>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-card__icon appointments">
            <TotalAppointmentsSvg />
          </div>
          <div className="overview-card__content">
            <div className="overview-card__label">Total Appointments</div>
            <div className="overview-card__value">
              {metricsLoading ? (
                <div className="metrics-loading">
                  <div className="loading-skeleton"></div>
                </div>
              ) : (
                clientMetricsMetadata?.totalAppointments || "0"
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  if (loading) {
    return <LoadingSmall />;
  }

  if (error || !client) {
    return <div className="client-detail-page">No client found</div>;
  }

  return (
    <div className="client-detail-page">
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
            {renderMetricsCards()}

            <div className="overview-card contact-info-card">
              <div className="contact-info">
                <div className="contact-info__item">
                  <div className="contact-info__icon">
                    <Mail size={20} />
                  </div>
                  <div className="contact-info__content">
                    <div className="contact-info__label">Email Address</div>
                    <div className="contact-info__value">{client.email}</div>
                  </div>
                  <button
                    className="contact-info__action"
                    onClick={() => handleCopyToClipboard(client.email)}
                  >
                    <Copy size={16} />
                  </button>
                </div>

                {client.phone && (
                  <>
                    <div className="contact-info__divider"></div>
                    <div className="contact-info__item">
                      <div className="contact-info__icon">
                        <Phone size={20} />
                      </div>
                      <div className="contact-info__content">
                        <div className="contact-info__label">Phone Number</div>
                        <div className="contact-info__value">
                          {client.phone}
                        </div>
                      </div>
                      <button
                        className="contact-info__action"
                        onClick={() => handleCopyToClipboard(client.phone!)}
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
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
        <EditClientModal
          onClose={() => {
            setShowEditClient(false);
            fetchClientDetails();
          }}
          id={client?.id}
          initialFormData={{
            firstName: client?.name.split(" ")[0],
            lastName: client?.name.split(" ")[1] || "",
            email: client?.email,
            phone: client?.phone?.toString(),
          }}
        />
      )}

      {showSendConsentForm && (
        <SendConsentFormModal
          clientId={id}
          clientName={client?.name}
          onClose={() => setShowSendConsentForm(false)}
          onSuccess={() => {
            setShowSendConsentForm(false);
            setShowFormSentSuccess(true);
            setTimeout(() => setShowFormSentSuccess(false), 3000);
          }}
        />
      )}

      {showFormSentSuccess && (
        <div className="form-sent-success">
          <div className="form-sent-success__content">
            <Check size={20} />
            <p>Form sent successfully!</p>
          </div>
        </div>
      )}

      {showDeleteClient && (
        <DeleteModal
          onClose={() => setShowDeleteClient(false)}
          headerText="Delete Client"
          shorterText="Are you sure you want to delete this client?"
          handleDelete={async () => {
            try {
              await deleteCustomer(client?.id);
              setShowDeleteClient(false);
              navigate("/clients");
            } catch (err) {
              toast.error(err?.message || "Failed to delete client");
              setShowDeleteClient(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default ClientDetailPage;

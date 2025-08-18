"use client";
import { Calendar, Clock, FileText, MoreVertical, Trash2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AppointmentSvg,
  FormNotCompletedSvg,
  FormsCompletedSvg,
  SendConsentFormSvg,
} from "../../../assets/svgs/ClientsSvg";
import { ClientAppointmentData } from "../../../redux/types";
import {
  DeleteAppointment,
  getAppointmentsForCustomer,
} from "../../../services/artistServices";
import { formatAppointmentTime } from "../../../utils/utils";
import "./client-appointments.scss";
import SendConsentFormModal from "../../../components/clientsComp/details/SendConsentFormModal";
import DeleteModal from "../../../components/clientsComp/details/DeletClientModal";

const ClientAppointmentPage: React.FC = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<ClientAppointmentData[]>([]);
  const [loading, setLoading] = useState(false);
  const { clientName, clientEmail, clientPhone } = location.state || {};
  const [showSendConsentForm, setShowSendConsentForm] = useState(false);
  const [showDeleteAppointment, setShowDeleteAppointment] = useState(false);

  const onSendConsentForm = () => {
    setShowSendConsentForm(true);
  };

  const onViewForms = (appointmentId: string) => {
    navigate(`/clients/${id}/appointments/${appointmentId}/forms`);
  };

  const onDeleteAppointment = (appointmentId: string) => {
    DeleteAppointment(appointmentId).then(() => {
      setShowDeleteAppointment(false);
    });
  };

  useEffect(() => {
    setLoading(true);
    getAppointmentsForCustomer(id)
      .then((res) => {
        console.log("Appointments data:", res);
        setAppointments(res?.data?.appointments || []);
      })
      .catch((error) => {
        console.error("Error fetching appointments:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="client-appointment-page">
        <div className="container">
          <div className="loading">Loading appointments...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="client-appointment-page">
      <div className="container">
        {/* Header */}
        <div className="header">
          <div className="header-content">
            <h1>{clientName}'s Appointment</h1>
            <p>
              Check out all your appointments and forms with{" "}
              {clientName?.split(" ")[0]} right here!
            </p>
          </div>
          <button onClick={onSendConsentForm} className="send-consent-btn">
            <SendConsentFormSvg /> Send Consent Form
          </button>
        </div>

        {appointments.length === 0 ? (
          <div className="no-appointments">
            <p>No appointments found for this client.</p>
          </div>
        ) : (
          <div className="appointments-grid">
            {appointments.map((appointment) => {
              const primaryService = appointment.serviceDetails?.[0];
              const serviceName = primaryService?.service || "Unknown Service";

              const appointmentDate = formatAppointmentTime(appointment.date);
              const formFilledDate = appointment.allFormsCompleted
                ? `${appointmentDate}`
                : "Not completed yet";

              return (
                <div key={appointment.id} className="appointment-card">
                  <div className="card-header">
                    <div className="service-info">
                      <div className="service-icon">
                        <AppointmentSvg />
                      </div>
                      <div className="service-content">
                        <h3>{serviceName}</h3>

                        {appointment.allFormsCompleted ? (
                          <FormsCompletedSvg />
                        ) : (
                          <FormNotCompletedSvg />
                        )}
                      </div>
                    </div>
                    <div className="dropdown">
                      <button className="dropdown-trigger">
                        <MoreVertical size={16} />
                      </button>
                      <div className="dropdown-menu">
                        <button onClick={() => onViewForms(appointment.id)}>
                          <FileText size={16} />
                          View Forms
                        </button>
                        <button
                          onClick={() => onDeleteAppointment(appointment.id)}
                          className="delete-option"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="appointment-details">
                    <div className="detail-item">
                      <Calendar size={16} />
                      <span className="detail-label">Appointment Date</span>
                      <span className="detail-value">{appointmentDate}</span>
                    </div>

                    <div className="detail-item">
                      <Clock size={16} />
                      <span className="detail-label">Form Filled</span>
                      <span className="detail-value">{formFilledDate}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {showDeleteAppointment && (
          <DeleteModal
            onClose={() => setShowDeleteAppointment(false)}
            headerText="Delete Appointment"
            shorterText="Are you sure you want to delete this appointment?"
            handleDelete={() => onDeleteAppointment(appointments[0].id)}
          />
        )}
        {showSendConsentForm && (
          <SendConsentFormModal
            onClose={() => setShowSendConsentForm(false)}
            onSuccess={() => {
              setShowSendConsentForm(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ClientAppointmentPage;

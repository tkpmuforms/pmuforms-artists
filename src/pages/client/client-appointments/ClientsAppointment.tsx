"use client";
import type React from "react";
import { useEffect, useState } from "react";
import { Calendar, Clock, FileText, MoreVertical, Trash2 } from "lucide-react";
import "./client-appointments.scss";
import { useParams } from "react-router-dom";
import { getAppointmentsForCustomer } from "../../../services/artistServices";
import {
  AppointmentSvg,
  FormNotCompletedSvg,
  FormsCompletedSvg,
} from "../../../assets/svgs/ClientsSvg";

interface ServiceDetail {
  _id: string;
  id: number;
  service: string;
}

interface AppointmentData {
  _id: string;
  id: string;
  allFormsCompleted: boolean;
  customerId: string;
  artistId: string;
  date: string;
  services: number[];
  signed: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  formsToFillCount: number;
  serviceDetails: ServiceDetail[];
}

const ClientAppointmentPage: React.FC = () => {
  const { id } = useParams();
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [clientName] = useState("Linda Lovely");
  const [showSendConsentForm, setShowSendConsentForm] = useState(false);

  const onSendConsentForm = () => {
    setShowSendConsentForm(true);
  };

  const onViewForms = (appointmentId: string) => {
    // Handle view forms logic
    console.log("View forms for appointment:", appointmentId);
  };

  const onDeleteAppointment = (appointmentId: string) => {
    // Handle delete appointment logic
    console.log("Delete appointment:", appointmentId);
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Helper function to format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Helper function to get status
  const getAppointmentStatus = (appointment: AppointmentData) => {
    if (appointment.allFormsCompleted) {
      return "Forms Completed";
    } else {
      return "Forms Not Completed";
    }
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
              {clientName.split(" ")[0]} right here!
            </p>
          </div>
          <button onClick={onSendConsentForm} className="send-consent-btn">
            <FileText size={16} />
            Send Consent Form
          </button>
        </div>

        {/* Appointments Grid */}
        {appointments.length === 0 ? (
          <div className="no-appointments">
            <p>No appointments found for this client.</p>
          </div>
        ) : (
          <div className="appointments-grid">
            {appointments.map((appointment) => {
              const primaryService = appointment.serviceDetails?.[0];
              const serviceName = primaryService?.service || "Unknown Service";
              const status = getAppointmentStatus(appointment);
              const appointmentDate = formatDate(appointment.date);
              const appointmentTime = formatTime(appointment.date);
              const formFilledDate = appointment.allFormsCompleted
                ? `${appointmentDate} | ${appointmentTime}`
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
      </div>
    </div>
  );
};

export default ClientAppointmentPage;

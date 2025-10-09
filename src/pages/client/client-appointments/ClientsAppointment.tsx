"use client";
import type React from "react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { SendConsentFormSvg } from "../../../assets/svgs/ClientsSvg";
import DeleteModal from "../../../components/clientsComp/details/DeleteModal";
import SendConsentFormModal from "../../../components/clientsComp/details/SendConsentFormModal";
import { ClientAppointmentData } from "../../../redux/types";
import {
  DeleteAppointment,
  getAppointmentsForCustomer,
  getCustomerById,
} from "../../../services/artistServices";
import AppointmentCard from "../../../components/clientsComp/appointments/AppointmentCard";
import { LoadingSmall } from "../../../components/loading/Loading";
import "./client-appointments.scss";

const ClientAppointmentPage: React.FC = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<ClientAppointmentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [clientName, setClientName] = useState<string>("");
  const [showSendConsentForm, setShowSendConsentForm] = useState(false);
  const [showDeleteAppointment, setShowDeleteAppointment] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(
    null
  );

  const onSendConsentForm = () => {
    setShowSendConsentForm(true);
  };

  const onViewForms = (appointmentId: string) => {
    navigate(`/clients/${id}/appointments/${appointmentId}/forms`, {
      state: { clientName, appointments },
    });
  };

  const onDeleteAppointment = (appointmentId: string) => {
    setAppointmentToDelete(appointmentId);
    setShowDeleteAppointment(true);
  };

  const handleDeleteConfirm = () => {
    if (appointmentToDelete) {
      DeleteAppointment(appointmentToDelete).then(() => {
        setAppointments((prev) =>
          prev.filter((apt) => apt.id !== appointmentToDelete)
        );
        setShowDeleteAppointment(false);
        setAppointmentToDelete(null);
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const stateClientName = location.state?.clientName;

        if (!stateClientName) {
          const clientResponse = await getCustomerById(id);
          const fetchedClientName =
            clientResponse?.data?.customer?.name || "Client";
          setClientName(fetchedClientName);
        } else {
          setClientName(stateClientName);
        }

        const appointmentsResponse = await getAppointmentsForCustomer(id);

        setAppointments(appointmentsResponse?.data?.appointments || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, location.state]);

  if (loading) {
    return (
      <div className="client-appointment-page">
        <LoadingSmall />
      </div>
    );
  }

  return (
    <div className="client-appointment-page">
      <div className="container">
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
            {appointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onViewForms={onViewForms}
                onDeleteAppointment={onDeleteAppointment}
              />
            ))}
          </div>
        )}

        {showDeleteAppointment && (
          <DeleteModal
            onClose={() => {
              setShowDeleteAppointment(false);
              setAppointmentToDelete(null);
            }}
            headerText="Delete Appointment"
            shorterText="Are you sure you want to delete this appointment?"
            handleDelete={handleDeleteConfirm}
          />
        )}

        {showSendConsentForm && (
          <SendConsentFormModal
            clientId={id}
            clientName={clientName}
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

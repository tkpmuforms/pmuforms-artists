"use client";
import { FileText } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FilledForm } from "../../../redux/types";
import {
  getAppointmentsForCustomer,
  getCustomerById,
  getFilledFormsByAppointment,
} from "../../../services/artistServices";
import ClientFormsCard from "../../../components/clientsComp/filled-forms/ClientFormsCard";
import "./appointment-forms-page.scss";
import { LoadingSmall } from "../../../components/loading/Loading";

const ClientsFormsForAppointments: React.FC = () => {
  const { id, appointmentId } = useParams();
  const location = useLocation();
  const [forms, setForms] = useState<FilledForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [clientName, setClientName] = useState<string>("");
  const [appointments, setAppointments] = useState<any[]>([]);
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
    const fetchData = async () => {
      if (!appointmentId || !id) return;

      setLoading(true);
      try {
        const stateClientName = location.state?.clientName;
        const stateAppointments = location.state?.appointments;

        if (!stateClientName) {
          const clientResponse = await getCustomerById(id);
          const fetchedClientName =
            clientResponse?.data?.customer?.name || "Client";
          setClientName(fetchedClientName);
        } else {
          setClientName(stateClientName);
        }

        if (!stateAppointments) {
          const appointmentsResponse = await getAppointmentsForCustomer(id);
          setAppointments(appointmentsResponse?.data?.appointments || []);
        } else {
          setAppointments(stateAppointments);
        }

        const formsResponse = await getFilledFormsByAppointment(appointmentId);
        setForms(formsResponse.data?.filledForms || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setForms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [appointmentId, id, location.state]);

  const isAllformsCompleted = forms.every(
    (form) => form.status === "complete" || form.status === "completed"
  );

  if (loading) {
    return <LoadingSmall />;
  }

  return (
    <div className="appointment-forms-page">
      <div className="container">
        <div className="header">
          <div className="header-content">
            <h1>{clientName}'s Appointment Form</h1>
            <p>
              Check out all your appointments and forms with{" "}
              {clientName?.split(" ")[0]} right here!
            </p>
          </div>
          <button
            onClick={onSignForms}
            className="sign-forms-btn"
            disabled={forms.length === 0 || !isAllformsCompleted}
          >
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

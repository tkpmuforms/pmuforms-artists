"use client";
import { CheckCircle2, FileText, Files } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FilledForm } from "../../../redux/types";
import {
  getAppointmentById,
  getCustomerById,
  getFilledFormsByAppointment,
} from "../../../services/artistServices";
import ClientFormsCard from "../../../components/clientsComp/filled-forms/ClientFormsCard";
import "./appointment-forms-page.scss";
import { LoadingSmall } from "../../../components/loading/Loading";
import AppointmentPayments from "../../../components/payments/AppointmentPayments";

const ClientsFormsForAppointments: React.FC = () => {
  const { id, appointmentId } = useParams();
  const location = useLocation();
  const [forms, setForms] = useState<FilledForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [clientName, setClientName] = useState<string>("");
  // loaded fresh so a just-signed appointment never shows "Sign" again
  const [appointment, setAppointment] = useState<{
    signed: boolean;
    allFormsCompleted: boolean;
  } | null>(null);
  const navigate = useNavigate();

  const onViewForm = (formId: string) => {
    navigate(`/clients/${id}/appointments/${appointmentId}/forms/${formId}`);
  };

  const onSignForms = () => {
    navigate(`/clients/${id}/appointments/${appointmentId}/signature`, {
      state: { clientName },
    });
  };

  const onViewAllForms = () => {
    navigate(`/clients/${id}/appointments/${appointmentId}/forms/all`, {
      state: { clientName },
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!appointmentId || !id) return;

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

        const [formsResponse, appointmentResponse] = await Promise.all([
          getFilledFormsByAppointment(appointmentId),
          getAppointmentById(appointmentId),
        ]);
        setForms(formsResponse.data?.filledForms || []);
        setAppointment(appointmentResponse.data?.appointment ?? null);
      } catch (error) {
        console.error("Error fetching data:", error);
        setForms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [appointmentId, id, location.state]);

  const isAllformsCompleted =
    appointment?.allFormsCompleted ??
    forms.every(
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
          <div className="header-actions">
            {forms.length > 0 && (
              <button onClick={onViewAllForms} className="all-forms-btn">
                <Files size={16} />
                View Forms
              </button>
            )}
            {appointment?.signed ? (
              <span className="signed-chip">
                <CheckCircle2 size={16} />
                Signed
              </span>
            ) : (
              <button
                onClick={onSignForms}
                className="sign-forms-btn"
                disabled={forms.length === 0 || !isAllformsCompleted}
              >
                <FileText size={16} />
                Sign Forms
              </button>
            )}
          </div>
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

        {appointmentId && (
          <AppointmentPayments
            appointmentId={appointmentId}
            clientName={clientName}
          />
        )}
      </div>
    </div>
  );
};

export default ClientsFormsForAppointments;

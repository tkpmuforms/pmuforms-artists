"use client";
import {
  Calendar,
  CheckCircle2,
  FileText,
  Files,
  NotebookPen,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Appointment, FilledForm } from "../../../redux/types";
import {
  getAppointmentById,
  getCustomerById,
  getFilledFormsByAppointment,
} from "../../../services/artistServices";
import ClientFormsCard from "../../../components/clientsComp/filled-forms/ClientFormsCard";
import "./appointment-forms-page.scss";
import { LoadingSmall } from "../../../components/loading/Loading";
import AppointmentPayments from "../../../components/payments/AppointmentPayments";
import AppointmentProducts from "../../../components/inventoryComp/AppointmentProducts";
import { formServices, isFormFilled } from "../../../utils/appointmentForms";
import { formatAppointmentTime } from "../../../utils/utils";
import { useWhoDid } from "../../../utils/teamPeople";

const ClientsFormsForAppointments: React.FC = () => {
  const { id, appointmentId } = useParams();
  const location = useLocation();
  const [forms, setForms] = useState<FilledForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [clientName, setClientName] = useState<string>("");
  // loaded fresh so a just-signed appointment never shows "Sign" again
  const [appointment, setAppointment] = useState<Pick<
    Appointment,
    | "signed"
    | "allFormsCompleted"
    | "date"
    | "serviceDetails"
    | "completedAt"
    | "createdBy"
    | "performedBy"
  > | null>(null);
  const navigate = useNavigate();
  // with a team: who booked it and who signed it off
  const who = useWhoDid();
  const bookedBy = who.hasTeam ? who.label(appointment?.createdBy) : "";
  const signedBy =
    who.hasTeam && appointment?.signed ? who.label(appointment.performedBy) : "";

  const onViewForm = (formId: string) => {
    navigate(`/clients/${id}/appointments/${appointmentId}/forms/${formId}`);
  };

  const onSignForms = () => {
    navigate(`/clients/${id}/appointments/${appointmentId}/signature`, {
      state: { clientName },
    });
  };

  // all of the client's notes: the emails and photos for this appointment
  // are labelled with it there
  const onViewNotes = () => {
    navigate(`/clients/${id}/notes`, { state: { clientName } });
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
    forms.every((form) => isFormFilled(form.status));
  const filledCount = forms.filter((form) => isFormFilled(form.status)).length;
  const services = (appointment?.serviceDetails ?? []).filter(
    (s) => s?.service,
  );
  const firstName = clientName?.split(" ")[0];

  if (loading) {
    return <LoadingSmall />;
  }

  return (
    <div className="appointment-forms-page">
      <div className="container">
        <div className="header">
          <div className="header-content">
            <h1>Forms for {clientName}'s appointment</h1>
            <p>
              The forms {firstName || "your client"} needs to fill for this
              appointment.
            </p>
          </div>
          <div className="header-actions">
            <button onClick={onViewNotes} className="all-forms-btn">
              <NotebookPen size={16} />
              View notes
            </button>
            {forms.length > 0 && (
              <button onClick={onViewAllForms} className="all-forms-btn">
                <Files size={16} />
                View all forms
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

        {appointment && (
          <section className="appointment-summary" aria-label="Appointment">
            {appointment.date && (
              <div className="appointment-summary__item">
                <span className="appointment-summary__label">Date</span>
                <span className="appointment-summary__value">
                  <Calendar size={16} />
                  {formatAppointmentTime(appointment.date)}
                </span>
              </div>
            )}
            <div className="appointment-summary__item">
              <span className="appointment-summary__label">Services</span>
              {services.length ? (
                <ul className="appointment-summary__services">
                  {services.map((s) => (
                    <li key={s.id}>{s.service}</li>
                  ))}
                </ul>
              ) : (
                <span className="appointment-summary__value">
                  Not specified
                </span>
              )}
            </div>
            {forms.length > 0 && (
              <div className="appointment-summary__item">
                <span className="appointment-summary__label">Forms</span>
                <span className="appointment-summary__value">
                  {filledCount} of {forms.length} filled
                  {appointment.signed ? " · signed" : ""}
                </span>
              </div>
            )}
            {bookedBy && (
              <div className="appointment-summary__item">
                <span className="appointment-summary__label">Booked by</span>
                <span className="appointment-summary__value">{bookedBy}</span>
              </div>
            )}
            {signedBy && (
              <div className="appointment-summary__item">
                <span className="appointment-summary__label">Signed off by</span>
                <span className="appointment-summary__value">{signedBy}</span>
              </div>
            )}
          </section>
        )}

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
                services={formServices(form, services)}
              />
            ))}
          </div>
        )}

        {appointmentId && (
          <AppointmentProducts
            appointmentId={appointmentId}
            clientName={clientName}
            services={services}
            completed={!!appointment?.completedAt}
          />
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

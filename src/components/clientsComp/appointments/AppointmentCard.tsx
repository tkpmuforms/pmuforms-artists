import { Calendar, CheckCircle2, Clock, PenLine } from "lucide-react";
import type React from "react";
import {
  AppointmentSvg,
  FormNotCompletedSvg,
  FormsCompletedSvg,
} from "../../../assets/svgs/ClientsSvg";
import { ClientAppointmentData } from "../../../redux/types";
import { formatAppointmentTime } from "../../../utils/utils";
import "./appointment-card.scss";
import AppointmentActionsMenu, { type CareAction } from "./AppointmentActionsMenu";

export type { CareAction };

interface AppointmentCardProps {
  appointment: ClientAppointmentData;
  onViewForms: (appointmentId: string) => void;
  onDeleteAppointment: (appointmentId: string) => void;
  onShareFormLink?: (appointmentId: string) => void;
  onStartFilling?: (appointmentId: string) => void;
  onCareAction?: (appointmentId: string, action: CareAction) => void;
  /** Only passed when the artist has Square connected (payments need Square). */
  onRequestPayment?: (appointmentId: string) => void;
  onAddProducts?: (appointmentId: string) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onViewForms,
  onDeleteAppointment,
  onShareFormLink,
  onStartFilling,
  onCareAction,
  onRequestPayment,
  onAddProducts,
}) => {
  const primaryService = appointment.serviceDetails?.[0];
  const serviceName = primaryService?.service || "Unknown Service";
  const appointmentDate = formatAppointmentTime(appointment.date);
  const formFilledDate = appointment.allFormsCompleted
    ? `${appointmentDate}`
    : "Not completed yet";

  return (
    <div
      className="appointment-card"
      onClick={() => onViewForms(appointment.id)}
      role="button"
      style={{ cursor: "pointer" }}
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === "Enter") {
          onViewForms(appointment.id);
        }
      }}
    >
      <div className="card-header">
        <div className="service-info">
          <div className="service-icon">
            <AppointmentSvg />
          </div>
          <div className="service-content">
            <h3>{serviceName}</h3>
          </div>
          {appointment.completedAt && (
            <span className="completed-chip">
              <CheckCircle2 size={12} /> Completed
            </span>
          )}
          <div className="form-status">
            {appointment.signed ? (
              <span className="status-pill status-pill--signed">
                <PenLine size={12} /> Forms Signed
              </span>
            ) : appointment.allFormsCompleted ? (
              <FormsCompletedSvg />
            ) : (
              <FormNotCompletedSvg />
            )}
          </div>
        </div>
        <AppointmentActionsMenu
          signed={appointment.signed}
          completedAt={appointment.completedAt}
          label={`${serviceName} on ${appointmentDate}`}
          onViewForms={() => onViewForms(appointment.id)}
          onShareFormLink={
            onShareFormLink && (() => onShareFormLink(appointment.id))
          }
          onStartFilling={onStartFilling && (() => onStartFilling(appointment.id))}
          onCareAction={
            onCareAction && ((action) => onCareAction(appointment.id, action))
          }
          onRequestPayment={
            onRequestPayment && (() => onRequestPayment(appointment.id))
          }
          onAddProducts={onAddProducts && (() => onAddProducts(appointment.id))}
          onDelete={() => onDeleteAppointment(appointment.id)}
        />
      </div>

      <div className="appointment-details">
        <div className="detail-row">
          <div className="detail-item">
            <div className="detail-header">
              <Calendar size={16} />
              <span className="detail-label">Appointment Date</span>
            </div>
            <span className="detail-value">{appointmentDate}</span>
          </div>

          <div className="detail-item">
            <div className="detail-header">
              <Clock size={16} />
              <span className="detail-label">Form Filled</span>
            </div>
            <span className="detail-value">{formFilledDate}</span>
          </div>
        </div>
      </div>

      {/* the step after signing: the procedure itself */}
      {onCareAction && appointment.signed && !appointment.completedAt && (
        <div className="next-step" onClick={(e) => e.stopPropagation()}>
          <span>Forms signed. Procedure done?</span>
          <button onClick={() => onCareAction(appointment.id, "complete")}>
            Mark as complete
          </button>
        </div>
      )}
    </div>
  );
};

export default AppointmentCard;

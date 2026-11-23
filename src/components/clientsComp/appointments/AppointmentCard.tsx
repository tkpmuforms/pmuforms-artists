import {
  MessageCircleHeart,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  HeartPulse,
  Link2,
  MoreVertical,
  PenLine,
  Send,
  Trash2,
} from "lucide-react";
import type React from "react";
import {
  AppointmentSvg,
  FormNotCompletedSvg,
  FormsCompletedSvg,
} from "../../../assets/svgs/ClientsSvg";
import { ClientAppointmentData } from "../../../redux/types";
import { formatAppointmentTime } from "../../../utils/utils";
import "./appointment-card.scss";

interface AppointmentCardProps {
  appointment: ClientAppointmentData;
  onViewForms: (appointmentId: string) => void;
  onDeleteAppointment: (appointmentId: string) => void;
  onShareFormLink?: (appointmentId: string) => void;
  onStartFilling?: (appointmentId: string) => void;
  onCareAction?: (appointmentId: string, action: CareAction) => void;
  /** Only passed when the artist has Square connected (payments need Square). */
  onRequestPayment?: (appointmentId: string) => void;
}

export type CareAction = "complete" | "pre-care" | "aftercare" | "check-in";

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onViewForms,
  onDeleteAppointment,
  onShareFormLink,
  onStartFilling,
  onCareAction,
  onRequestPayment,
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
        {/* menu clicks must not also trigger the card's own click */}
        <div className="dropdown" onClick={(e) => e.stopPropagation()}>
          <button className="dropdown-trigger" aria-label="Appointment actions">
            <MoreVertical size={16} />
          </button>
          <div className="dropdown-menu">
            <button onClick={() => onViewForms(appointment.id)}>
              <FileText size={16} />
              View Forms
            </button>
            {/* signed appointments can't take new answers */}
            {!appointment.signed && onShareFormLink && (
              <button onClick={() => onShareFormLink(appointment.id)}>
                <Link2 size={16} />
                Share consent form link
              </button>
            )}
            {!appointment.signed && onStartFilling && (
              <button onClick={() => onStartFilling(appointment.id)}>
                <ExternalLink size={16} />
                Share consent forms
              </button>
            )}
            {onCareAction && (
              <button onClick={() => onCareAction(appointment.id, "pre-care")}>
                <Send size={16} />
                Send pre-care instructions
              </button>
            )}
            {onCareAction && (
              <button onClick={() => onCareAction(appointment.id, "aftercare")}>
                <HeartPulse size={16} />
                Send aftercare instructions
              </button>
            )}
            {onCareAction && (
              <button onClick={() => onCareAction(appointment.id, "check-in")}>
                <MessageCircleHeart size={16} />
                Send healing check-in
              </button>
            )}
            {onRequestPayment && (
              <button onClick={() => onRequestPayment(appointment.id)}>
                <CreditCard size={16} />
                Request payment
              </button>
            )}
            {/* actions that end the appointment, set apart at the bottom */}
            <div className="dropdown-divider" role="separator" />
            {onCareAction && !appointment.completedAt && (
              <button
                onClick={() => onCareAction(appointment.id, "complete")}
                className="complete-option"
                // the procedure comes after the client's forms are signed
                disabled={!appointment.signed}
                title={
                  appointment.signed ? undefined : "Sign the forms first"
                }
              >
                <CheckCircle2 size={16} />
                Mark as complete
              </button>
            )}
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

import { Calendar, Clock, FileText, MoreVertical, Trash2 } from "lucide-react";
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
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onViewForms,
  onDeleteAppointment,
}) => {
  const primaryService = appointment.serviceDetails?.[0];
  const serviceName = primaryService?.service || "Unknown Service";
  const appointmentDate = formatAppointmentTime(appointment.date);
  const formFilledDate = appointment.allFormsCompleted
    ? `${appointmentDate}`
    : "Not completed yet";

  return (
    <div className="appointment-card">
      <div className="card-header">
        <div className="service-info">
          <div className="service-icon">
            <AppointmentSvg />
          </div>
          <div className="service-content">
            <h3>{serviceName}</h3>
          </div>
          <div className="form-status">
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
    </div>
  );
};

export default AppointmentCard;

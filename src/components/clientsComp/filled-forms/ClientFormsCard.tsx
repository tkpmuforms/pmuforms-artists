import { Calendar, Clock } from "lucide-react";
import type React from "react";
import { AppointmentSvg } from "../../../assets/svgs/ClientsSvg";
import { FilledForm } from "../../../redux/types";
import { formatAppointmentTime } from "../../../utils/utils";
import "./client-forms-card.scss";

interface ClientFormsCardProps {
  form: FilledForm;
  onViewForm: (formId: string) => void;
}

const ClientFormsCard: React.FC<ClientFormsCardProps> = ({
  form,
  onViewForm,
}) => {
  const handleCardClick = () => {
    onViewForm(form.formTemplateId);
  };

  return (
    <div className="client-forms-card" onClick={handleCardClick}>
      <div className="card-header">
        <div className="form-info">
          <div className="form-icon">
            <AppointmentSvg />
          </div>
          <div className="form-content">
            <h3>{form.title}</h3>
          </div>
          <div className="status-badge">
            <span className={`badge ${form.status.toLowerCase()}`}>
              {form.status === "completed" ? "Forms Completed" : form.status}
            </span>
          </div>
        </div>
      </div>

      <div className="form-details">
        <div className="detail-row">
          <div className="detail-item">
            <div className="detail-header">
              <Calendar size={16} />
              <span className="detail-label">Appointment Date</span>
            </div>
            <span className="detail-value">
              {formatAppointmentTime(form.createdAt)}
            </span>
          </div>

          <div className="detail-item">
            <div className="detail-header">
              <Clock size={16} />
              <span className="detail-label">Form Filled</span>
            </div>
            <span className="detail-value">
              {formatAppointmentTime(form.updatedAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientFormsCard;

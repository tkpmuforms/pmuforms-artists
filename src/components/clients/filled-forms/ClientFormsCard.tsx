import { ChevronRight } from "lucide-react";
import type React from "react";
import { AppointmentSvg } from "../../../assets/svgs/ClientsSvg";
import { FilledForm } from "../../../redux/types";
import {
  formStatusLabel,
  isFormFilled,
} from "../../../utils/appointmentForms";
import { formatAppointmentTime } from "../../../utils/utils";
import "./client-forms-card.scss";

interface ClientFormsCardProps {
  form: FilledForm;
  onViewForm: (formId: string) => void;
  /** the services on this appointment the form is for */
  services?: string[];
}

const ClientFormsCard: React.FC<ClientFormsCardProps> = ({
  form,
  onViewForm,
  services = [],
}) => {
  const title = form.title || form.formTemplate?.title || "Form";
  const filled = isFormFilled(form.status);
  const status = formStatusLabel(form.status);

  return (
    <button
      type="button"
      className="client-forms-card"
      onClick={() => onViewForm(form.formTemplateId)}
      aria-label={`Open ${title}, ${status}`}
    >
      <div className="card-header">
        <div className="form-info">
          <div className="form-icon">
            <AppointmentSvg />
          </div>
          <div className="form-content">
            <h3>{title}</h3>
            <p className="form-for">
              {services.length
                ? `For ${services.join(", ")}`
                : "For this appointment"}
            </p>
          </div>
        </div>
      </div>

      <div className="status-section">
        <div className="divider"></div>
        <div className="status-badge">
          <span
            className={`badge ${filled ? "completed" : "incomplete"}`}
          >
            {status}
          </span>
        </div>
        <div className="divider"></div>
      </div>

      <div className="form-details">
        <div className="detail-row">
          <div className="detail-item">
            <span className="detail-label">Sent</span>
            <span className="detail-value">
              {formatAppointmentTime(form.createdAt)}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Filled</span>
            <span className="detail-value">
              {filled ? formatAppointmentTime(form.updatedAt) : "Not yet"}
            </span>
          </div>
        </div>
        <span className="view-form">
          {filled ? "View answers" : "View form"}
          <ChevronRight size={16} />
        </span>
      </div>
    </button>
  );
};

export default ClientFormsCard;

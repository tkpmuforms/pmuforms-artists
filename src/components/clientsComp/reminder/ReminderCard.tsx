import { Bell, Calendar } from "lucide-react";
import React from "react";
import { formatAppointmentTime } from "../../../utils/utils";

interface Reminder {
  id: string;
  type: "check-in" | "follow-up";
  sendAt: string;
  note: string;
  customerId: string;
}

interface ReminderCardProps {
  reminder: Reminder;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="reminder-card">
      <div className="reminder-card__header">
        <div className={`reminder-card__icon ${reminder.type}`}>
          {reminder.type === "check-in" ? (
            <Calendar size={24} />
          ) : (
            <Bell size={24} />
          )}
        </div>
        <div className="reminder-card__content">
          <div className="reminder-card__date">
            {formatAppointmentTime(reminder.sendAt)}
          </div>
          <div className="reminder-card__note">{reminder.note}</div>
        </div>
      </div>

      <div className="reminder-card__actions">
        <button className="edit-btn" onClick={() => onEdit(reminder.id)}>
          Edit
        </button>
        <button className="delete-btn" onClick={() => onDelete(reminder.id)}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default ReminderCard;

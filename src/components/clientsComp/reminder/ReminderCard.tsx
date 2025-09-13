import { Bell, Calendar } from "lucide-react";
import React from "react";

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
  // Helper function to format datetime string to display format
  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${day}/${month}/${year} - ${hours}:${minutes}`;
  };

  return (
    <div className="reminder-card">
      {/* Header section with icon and content */}
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
            {formatDateForDisplay(reminder.sendAt)}
          </div>
          <div className="reminder-card__note">{reminder.note}</div>
        </div>
      </div>

      {/* Actions at the bottom */}
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

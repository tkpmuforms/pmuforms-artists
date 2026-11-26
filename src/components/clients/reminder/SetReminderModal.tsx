import { X } from "lucide-react";
import { useState, useEffect } from "react";

interface SetReminderModalProps {
  onClose: () => void;
  onConfirm: (date: string, note: string) => void;
  type: "check-in" | "follow-up";
  initialDate?: string;
  initialNote?: string;
  isEditing?: boolean;
}

const SetReminderModal: React.FC<SetReminderModalProps> = ({
  onClose,
  onConfirm,
  type,
  initialDate = "",
  initialNote = "",
  isEditing = false,
}) => {
  const [date, setDate] = useState<string>("");
  const [note, setNote] = useState<string>("");

  useEffect(() => {
    if (initialDate) {
      const dateObj = new Date(initialDate);
      const formattedDate = dateObj.toISOString().slice(0, 16);
      setDate(formattedDate);
    } else {
      setDate("");
    }
    setNote(initialNote);
  }, [initialDate, initialNote]);

  const handleConfirm = () => {
    if (date) {
      onConfirm(date, note);
    }
  };

  const title = isEditing
    ? `Edit ${type === "check-in" ? "Check-in" : "Follow-up"} Reminder`
    : type === "check-in"
    ? "Set Check-in Reminder"
    : "Follow-up Reminder";

  const confirmButtonText = isEditing ? "Update Reminder" : "Confirm Reminder";

  return (
    <div className="reminder-modal">
      <div className="reminder-modal__overlay" onClick={onClose} />
      <div className="reminder-modal__content reminder-form">
        <button className="reminder-modal__close" onClick={onClose}>
          <X size={20} />
        </button>

        <h2>{title}</h2>
        <p>
          {isEditing
            ? "Update the date and note for this reminder."
            : "Choose a date to set a reminder."}
        </p>

        <div className="form-group">
          <label>Select Reminder Date & Time</label>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="datetime-input"
            placeholder="DD/MM/YYYY - 00:00"
          />
        </div>

        <div className="form-group">
          <label>Reminder Note (Optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="note-textarea"
            placeholder="Enter reminder note..."
            rows={4}
          />
        </div>

        <div className="reminder-modal__actions">
          <button className="reminder-modal__cancel" onClick={onClose}>
            Go Back
          </button>
          <button
            className="reminder-modal__confirm"
            onClick={handleConfirm}
            disabled={!date}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetReminderModal;

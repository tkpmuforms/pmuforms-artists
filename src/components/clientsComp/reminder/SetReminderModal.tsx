import { X } from "lucide-react";
import { useState } from "react";

interface SetReminderModalProps {
  onClose: () => void;
  onConfirm: (date: string, note: string) => void;
  type: "checkin" | "followup";
}

const SetReminderModal: React.FC<SetReminderModalProps> = ({
  onClose,
  onConfirm,
  type,
}) => {
  const [date, setDate] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const handleConfirm = () => {
    if (date) {
      onConfirm(date, note);
    }
  };

  const title =
    type === "checkin" ? "Set Check-in Reminder" : "Follow-up Reminder";

  return (
    <div className="reminder-modal">
      <div className="reminder-modal__overlay" onClick={onClose} />
      <div className="reminder-modal__content reminder-form">
        <button className="reminder-modal__close" onClick={onClose}>
          <X size={20} />
        </button>

        <h2>{title}</h2>
        <p>Choose a date to set a reminder.</p>

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
            Confirm Reminder
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetReminderModal;

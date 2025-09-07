import { X, Calendar, Bell } from "lucide-react";
import type React from "react";
import "./reminder-modal.scss";

interface SelectReminderTypeModalProps {
  onClose: () => void;
  onSelectType: (type: "check-in" | "follow-up") => void;
}

const SelectReminderTypeModal: React.FC<SelectReminderTypeModalProps> = ({
  onClose,
  onSelectType,
}) => {
  return (
    <div className="reminder-modal">
      <div className="reminder-modal__overlay" onClick={onClose} />
      <div className="reminder-modal__content">
        <button className="reminder-modal__close" onClick={onClose}>
          <X size={20} />
        </button>

        <h2>Select Reminder Type</h2>

        <div className="reminder-types">
          <button
            className="reminder-type-card"
            onClick={() => onSelectType("check-in")}
          >
            <div className="reminder-type-card__icon check-in">
              <Calendar size={24} />
            </div>
            <div className="reminder-type-card__content">
              <h3>Check In</h3>
              <p>
                Receive a reminder as a notification in the future when this
                client will check in
              </p>
            </div>
            <div className="reminder-type-card__arrow">
              <span>›</span>
            </div>
          </button>

          <button
            className="reminder-type-card"
            onClick={() => onSelectType("follow-up")}
          >
            <div className="reminder-type-card__icon follow-up">
              <Bell size={24} />
            </div>
            <div className="reminder-type-card__content">
              <h3>Follow-Up</h3>
              <p>
                Receive a reminder as a notification in the future to follow up
                on this client
              </p>
            </div>
            <div className="reminder-type-card__arrow">
              <span>›</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectReminderTypeModal;

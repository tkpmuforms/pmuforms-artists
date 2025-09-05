interface ReminderSuccessModalProps {
  onClose: () => void;
  clientName: string;
  reminderDate: string;
  onViewAppointments: () => void;
  onGoToDashboard: () => void;
}

const ReminderSuccessModal: React.FC<ReminderSuccessModalProps> = ({
  onClose,
  clientName,
  reminderDate,
  onViewAppointments,
  onGoToDashboard,
}) => {
  return (
    <div className="reminder-modal">
      <div className="reminder-modal__overlay" onClick={onClose} />
      <div className="reminder-modal__content success-modal">
        <div className="success-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="#22C55E" />
            <path
              d="M16 24L21 29L32 18"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2>Reminder Set Successfully</h2>
        <p>
          A Check-in Reminder for <strong>{clientName}</strong> has been set for{" "}
          <strong>{reminderDate}</strong>. You'll receive a notifications in
          future
        </p>

        <div className="reminder-modal__actions">
          <button
            className="reminder-modal__cancel"
            onClick={onViewAppointments}
          >
            View Client's Appointment
          </button>
          <button className="reminder-modal__confirm" onClick={onGoToDashboard}>
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderSuccessModal;

import { Bell, Calendar } from "lucide-react";
import { useState } from "react";
import "./client-reminder.scss";
import SelectReminderTypeModal from "../../../components/clientsComp/reminder/ReminderModalType";
import SetReminderModal from "../../../components/clientsComp/reminder/SetReminderModal";

interface Reminder {
  id: string;
  type: "checkin" | "followup";
  date: string;
  note: string;
  clientId: string;
}

const RemindersPage: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: "1",
      type: "checkin",
      date: "20/10/2022 - 03:00",
      note: "Get a new make up set before this client checks in and also find a new steriliser",
      clientId: "1",
    },
    {
      id: "2",
      type: "followup",
      date: "20/10/2022 - 03:00",
      note: "Get a new make up set before this client checks in and also find a new steriliser",
      clientId: "1",
    },
    {
      id: "3",
      type: "checkin",
      date: "20/10/2022 - 03:00",
      note: "Get a new make up set before this client checks in and also find a new steriliser",
      clientId: "1",
    },
  ]);

  const [showSelectType, setShowSelectType] = useState(false);
  const [showSetReminder, setShowSetReminder] = useState(false);
  const [selectedType, setSelectedType] = useState<
    "checkin" | "followup" | null
  >(null);

  const handleDeleteReminder = (id: string) => {
    setReminders(reminders.filter((r) => r.id !== id));
  };

  const handleEditReminder = (id: string) => {
    // Handle edit logic
    console.log("Edit reminder:", id);
  };

  const handleAddReminderClick = () => {
    setShowSelectType(true);
  };

  const handleTypeSelect = (type: "checkin" | "followup") => {
    setSelectedType(type);
    setShowSelectType(false);
    setShowSetReminder(true);
  };

  const handleReminderConfirm = (date: string, note: string) => {
    if (selectedType) {
      const newReminder: Reminder = {
        id: Date.now().toString(), // Simple ID generation
        type: selectedType,
        date: formatDateForDisplay(date),
        note: note || "",
        clientId: "1", // You might want to pass this as a prop
      };

      setReminders([...reminders, newReminder]);
    }

    // Reset modal states
    setShowSetReminder(false);
    setSelectedType(null);
  };

  const handleModalClose = () => {
    setShowSelectType(false);
    setShowSetReminder(false);
    setSelectedType(null);
  };

  // Helper function to format datetime-local input to display format
  const formatDateForDisplay = (dateTimeLocal: string): string => {
    if (!dateTimeLocal) return "";

    const date = new Date(dateTimeLocal);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${day}/${month}/${year} - ${hours}:${minutes}`;
  };

  return (
    <div className="reminders-page">
      <div className="reminders-page__header">
        <button className="back-button">
          <span>‹</span> Set Reminders
        </button>
      </div>

      <div className="reminders-page__content">
        <div className="reminders-header">
          <div>
            <h1>Reminders</h1>
            <p>Here are your reminders for check-ins and follow-ups.</p>
          </div>
          <button className="add-reminder-btn" onClick={handleAddReminderClick}>
            <span>+</span> Add a New Reminder
          </button>
        </div>

        {reminders.length > 0 ? (
          <div className="reminders-grid">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="reminder-card">
                <div className={`reminder-card__icon ${reminder.type}`}>
                  {reminder.type === "checkin" ? (
                    <Calendar size={24} />
                  ) : (
                    <Bell size={24} />
                  )}
                </div>
                <div className="reminder-card__content">
                  <div className="reminder-card__date">{reminder.date}</div>
                  <div className="reminder-card__note">{reminder.note}</div>
                </div>
                <div className="reminder-card__actions">
                  <button
                    className="edit-btn"
                    onClick={() => handleEditReminder(reminder.id)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteReminder(reminder.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state__icon">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="32" fill="#F1F5F9" />
                <path
                  d="M28 28H36M28 36H36M24 20H40C41.1046 20 42 20.8954 42 22V42C42 43.1046 41.1046 44 40 44H24C22.8954 44 22 43.1046 22 42V22C22 20.8954 22.8954 20 24 20Z"
                  stroke="#64748B"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3>No reminder set yet</h3>
            <p>
              When you add set a reminder to this client, they will be visible
              here
            </p>
          </div>
        )}
      </div>

      {/* Modal Components */}
      {showSelectType && (
        <SelectReminderTypeModal
          onClose={handleModalClose}
          onSelectType={handleTypeSelect}
        />
      )}

      {showSetReminder && selectedType && (
        <SetReminderModal
          onClose={handleModalClose}
          onConfirm={handleReminderConfirm}
          type={selectedType}
        />
      )}
    </div>
  );
};

export default RemindersPage;

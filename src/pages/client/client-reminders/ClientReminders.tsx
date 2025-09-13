import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReminderCard from "../../../components/clientsComp/reminder/ReminderCard";
import SelectReminderTypeModal from "../../../components/clientsComp/reminder/ReminderModalType";
import SetReminderModal from "../../../components/clientsComp/reminder/SetReminderModal";
import "./client-reminder.scss";
import {
  createReminder,
  deleteReminder,
  getRemindersByCustomer,
  updateReminder,
} from "../../../services/artistServices";
import toast from "react-hot-toast";
import DeleteModal from "../../../components/clientsComp/details/DeleteModal";

interface Reminder {
  id: string;
  type: "check-in" | "follow-up";
  sendAt: string;
  note: string;
  customerId: string;
}

const RemindersPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSelectType, setShowSelectType] = useState(false);
  const [showSetReminder, setShowSetReminder] = useState(false);
  const [selectedType, setSelectedType] = useState<
    "check-in" | "follow-up" | null
  >(null);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [showDeleteReminder, setShowDeleteReminder] = useState(false);
  // Add state to track which reminder to delete
  const [reminderToDelete, setReminderToDelete] = useState<string | null>(null);

  // Fetch reminders on component mount
  useEffect(() => {
    if (id) {
      fetchReminders();
    }
  }, [id]);

  const fetchReminders = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await getRemindersByCustomer(id);
      setReminders(response.data?.reminders || []);
    } catch (err) {
      console.error("Error fetching reminders:", err);
      toast.error("Failed to fetch reminders");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReminder = async () => {
    if (!reminderToDelete) return;

    try {
      await deleteReminder(reminderToDelete);
      setReminders(reminders.filter((r) => r.id !== reminderToDelete));
      toast.success("Reminder deleted successfully");
      setShowDeleteReminder(false);
      setReminderToDelete(null);
    } catch (err) {
      console.error("Error deleting reminder:", err);
      toast.error("Failed to delete reminder");
    }
  };

  const handleEditReminder = (reminderId: string) => {
    const reminder = reminders.find((r) => r.id === reminderId);
    if (reminder) {
      setEditingReminder(reminder);
      setSelectedType(reminder.type);
      setShowSetReminder(true);
    }
  };

  // Updated delete handler to set the reminder ID and show modal
  const handleDeleteReminderClick = (reminderId: string) => {
    setReminderToDelete(reminderId);
    setShowDeleteReminder(true);
  };

  const handleAddReminderClick = () => {
    setEditingReminder(null);
    setShowSelectType(true);
  };

  const handleTypeSelect = (type: "check-in" | "follow-up") => {
    setSelectedType(type);
    setShowSelectType(false);
    setShowSetReminder(true);
  };

  const handleReminderConfirm = async (date: string, note: string) => {
    if (!selectedType || !id) return;

    try {
      if (editingReminder) {
        // Update existing reminder - include type and customerId
        const updateData = {
          sendAt: date,
          note: note || "",
          type: selectedType, // Add this line
          customerId: id, // Add this line
        };

        await updateReminder(editingReminder.id, updateData);

        setReminders(
          reminders.map((r) =>
            r.id === editingReminder.id
              ? { ...r, sendAt: date, note: note || "", type: selectedType }
              : r
          )
        );
        toast.success("Reminder updated successfully");
      } else {
        // Create new reminder
        const reminderData = {
          sendAt: date,
          type: selectedType,
          customerId: id,
          note: note || "",
        };

        const response = await createReminder(reminderData);

        // Add the new reminder to the list
        if (response.data) {
          setReminders([...reminders, response.data]);
        } else {
          await fetchReminders();
        }
        toast.success("Reminder created successfully");
      }
    } catch (err) {
      console.error("Error saving reminder:", err);
      if (editingReminder) {
        toast.error("Failed to update reminder");
      } else {
        toast.error("Failed to create reminder");
      }
    }

    // Reset modal states
    setShowSetReminder(false);
    setSelectedType(null);
    setEditingReminder(null);
  };

  const handleModalClose = () => {
    setShowSelectType(false);
    setShowSetReminder(false);
    setSelectedType(null);
    setEditingReminder(null);
  };

  // Updated close handler for delete modal
  const handleDeleteModalClose = () => {
    setShowDeleteReminder(false);
    setReminderToDelete(null);
  };

  if (loading) {
    return (
      <div className="reminders-page">
        <div className="reminders-page__content">
          <div className="loading-state">
            <p>Loading reminders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reminders-page">
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
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onEdit={handleEditReminder}
                onDelete={handleDeleteReminderClick} // Updated to use the new handler
              />
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
          initialDate={editingReminder?.sendAt}
          initialNote={editingReminder?.note}
          isEditing={!!editingReminder}
        />
      )}

      {showDeleteReminder && (
        <DeleteModal
          onClose={handleDeleteModalClose} // Updated to use the new close handler
          headerText="Delete Reminder"
          shorterText="Are you sure you want to delete this reminder?"
          handleDelete={handleDeleteReminder} // This now uses the correct reminder ID
        />
      )}
    </div>
  );
};

export default RemindersPage;

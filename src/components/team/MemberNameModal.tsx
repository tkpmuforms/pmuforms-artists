import { X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import toast from "react-hot-toast";
import { teamErrorText, updateMyTeamName } from "../../services/teamServices";
import { validateOwnerName } from "../../utils/ownerDetails";
import "../profileComp/edit-business-information-modal.scss";

interface MemberNameModalProps {
  initial: { firstName: string; lastName: string };
  businessName?: string;
  /** without it the dialog can't be closed: a name is needed first */
  onClose?: () => void;
  onSaved: (name: { firstName: string; lastName: string }) => void;
}

/** A team member's own name, shown on the notes and records they add. */
const MemberNameModal: React.FC<MemberNameModalProps> = ({
  initial,
  businessName,
  onClose,
  onSaved,
}) => {
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});
  const [saving, setSaving] = useState(false);
  const required = !onClose;

  const save = async () => {
    const found = {
      firstName: validateOwnerName(firstName),
      lastName: validateOwnerName(lastName),
    };
    if (found.firstName || found.lastName) {
      setErrors(found);
      return;
    }
    setSaving(true);
    try {
      const { data } = await updateMyTeamName({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      toast.success("Your name is saved");
      onSaved(data.me);
    } catch (error) {
      toast.error(teamErrorText(error, "Couldn't save your name. Please try again."));
      setSaving(false);
    }
  };

  const field = (
    id: "firstName" | "lastName",
    label: string,
    value: string,
    set: (v: string) => void,
  ) => (
    <div className="form-group">
      <label htmlFor={`member-${id}`}>{label}</label>
      <input
        id={`member-${id}`}
        type="text"
        className="form-input"
        value={value}
        onChange={(e) => {
          set(e.target.value);
          setErrors((prev) => ({ ...prev, [id]: undefined }));
        }}
        aria-invalid={!!errors[id]}
        style={errors[id] ? { borderColor: "#f56565" } : undefined}
        disabled={saving}
        autoComplete={id === "firstName" ? "given-name" : "family-name"}
      />
      {errors[id] && (
        <div style={{ color: "#f56565", fontSize: 12, marginTop: 4 }}>{errors[id]}</div>
      )}
    </div>
  );

  return (
    <div className="edit-business-information-modal">
      <div className="edit-business-information-modal__overlay" onClick={onClose} />
      <div
        className="edit-business-information-modal__content"
        role="dialog"
        aria-label="Your name"
      >
        {onClose && (
          <button
            className="edit-business-information-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        )}
        <h2>{required ? "Add your name" : "Your name"}</h2>
        <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: 14 }}>
          {required
            ? `Welcome${businessName ? ` to ${businessName}` : ""}! Your name shows on the notes you add and the appointments you sign off, so the team knows who did what.`
            : "Shown on the notes you add and the appointments you sign off."}
        </p>
        <div className="edit-business-information-modal__form">
          <div className="form-row">
            {field("firstName", "First Name *", firstName, setFirstName)}
            {field("lastName", "Last Name *", lastName, setLastName)}
          </div>
        </div>
        <button
          className="edit-business-information-modal__save"
          onClick={save}
          disabled={saving}
        >
          {saving ? "Saving..." : required ? "Continue" : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default MemberNameModal;

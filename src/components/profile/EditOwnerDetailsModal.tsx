import { X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import toast from "react-hot-toast";
import { updateMyProfile } from "../../services/artistServices";
import {
  apiErrorText,
  formatUSPhone,
  type OwnerDetails,
  type OwnerDetailsErrors,
  toE164USPhone,
  validateOwnerDetails,
} from "../../utils/ownerDetails";
import "./edit-business-information-modal.scss";

interface EditOwnerDetailsModalProps {
  initial: OwnerDetails;
  /** the sign-in email: shown, not editable */
  email?: string;
  onClose: () => void;
  onSaved: (details: OwnerDetails) => void;
}

/** The owner's own name and phone, separate from the business's. */
const EditOwnerDetailsModal: React.FC<EditOwnerDetailsModalProps> = ({
  initial,
  email,
  onClose,
  onSaved,
}) => {
  const [details, setDetails] = useState<OwnerDetails>({
    ...initial,
    phoneNumber: formatUSPhone(initial.phoneNumber),
  });
  const [errors, setErrors] = useState<OwnerDetailsErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const change = (field: keyof OwnerDetails, value: string) => {
    setDetails((prev) => ({
      ...prev,
      [field]: field === "phoneNumber" ? formatUSPhone(value) : value,
    }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSave = async () => {
    const found = validateOwnerDetails(details);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setIsSaving(true);
    const phone = toE164USPhone(details.phoneNumber);
    try {
      await updateMyProfile({
        firstName: details.firstName.trim(),
        lastName: details.lastName.trim(),
        ...(phone ? { phoneNumber: phone } : {}),
      });
      toast.success("Owner's details saved");
      onSaved({
        firstName: details.firstName.trim(),
        lastName: details.lastName.trim(),
        phoneNumber: phone,
      });
    } catch (error) {
      const message = apiErrorText(
        error,
        "Couldn't save the owner's details. Please try again.",
      );
      if (/phone/i.test(message)) {
        setErrors((prev) => ({ ...prev, phoneNumber: message }));
      }
      toast.error(message);
      setIsSaving(false);
    }
  };

  const field = (
    id: keyof OwnerDetails,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <div className="form-group">
      <label htmlFor={`owner-${id}`}>{label}</label>
      <input
        id={`owner-${id}`}
        value={details[id]}
        onChange={(e) => change(id, e.target.value)}
        className="form-input"
        aria-invalid={!!errors[id]}
        style={errors[id] ? { borderColor: "#f56565" } : undefined}
        disabled={isSaving}
        {...props}
      />
      {errors[id] && (
        <div style={{ color: "#f56565", fontSize: 12, marginTop: 4 }}>
          {errors[id]}
        </div>
      )}
    </div>
  );

  return (
    <div className="edit-business-information-modal">
      <div
        className="edit-business-information-modal__overlay"
        onClick={onClose}
      />
      <div
        className="edit-business-information-modal__content"
        role="dialog"
        aria-label="Edit owner's details"
      >
        <button
          className="edit-business-information-modal__close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h2>Edit Owner's Details</h2>

        <div className="edit-business-information-modal__form">
          <div className="form-row">
            {field("firstName", "First Name *", { type: "text" })}
            {field("lastName", "Last Name *", { type: "text" })}
          </div>
          <div className="form-row">
            {field("phoneNumber", "Owner's Phone Number (USA)", {
              type: "tel",
              placeholder: "(123) 456-7890",
            })}
            <div className="form-group">
              <label htmlFor="owner-email">Owner's Email</label>
              <input
                id="owner-email"
                type="email"
                value={email || ""}
                className="form-input"
                disabled
                style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
              />
            </div>
          </div>
        </div>

        <button
          className="edit-business-information-modal__save"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default EditOwnerDetailsModal;

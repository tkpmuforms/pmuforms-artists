import type React from "react";
import { useState } from "react";
import { X } from "lucide-react";
import { deleteMe } from "../../services/artistServices";
import { getApiErrorMessage } from "../../utils/apiError";
import "./delete-account-modal.scss";

/** what the owner types to confirm */
export const DELETE_CONFIRM_WORD = "DELETE";

export const DELETE_ACCOUNT_POINTS = [
  "Your business, services and forms",
  "Appointments, signed forms, notes and photos",
  "Your clients and everything you have for them",
  "Inventory, reminders and payment requests",
  "Your team's access",
];

interface DeleteAccountModalProps {
  onClose: () => void;
  /** signs out once the account is gone */
  onDeleted: () => void;
  /** subscribed through the App Store or Google Play, which we can't cancel */
  storeSubscription?: boolean;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  onClose,
  onDeleted,
  storeSubscription,
}) => {
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const confirmed = confirm.trim().toUpperCase() === DELETE_CONFIRM_WORD;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!confirmed || deleting) return;
    setDeleting(true);
    setError("");
    try {
      await deleteMe();
    } catch (err) {
      setDeleting(false);
      setError(
        getApiErrorMessage(
          err,
          "Something went wrong. Please try again, or contact support@pmuforms.com.",
        ),
      );
      return;
    }
    onDeleted();
  };

  const close = () => {
    if (!deleting) onClose();
  };

  return (
    <div className="delete-account-modal">
      <div className="delete-account-modal__overlay" onClick={close} />
      <div
        className="delete-account-modal__content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
      >
        <button
          type="button"
          className="delete-account-modal__close"
          onClick={close}
          aria-label="Close"
          disabled={deleting}
        >
          <X size={20} />
        </button>

        <h2 id="delete-account-title">Delete your account?</h2>
        <p>This permanently deletes, and can't be undone:</p>
        <ul>
          {DELETE_ACCOUNT_POINTS.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <p>
          Your subscription is cancelled right away.
          {storeSubscription &&
            " You subscribed through the App Store or Google Play, so also cancel it in your store subscription settings."}
        </p>
        <p className="delete-account-modal__warning">
          If your state requires you to keep client records, download or print
          your signed forms first.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="delete-account-confirm">
            Type {DELETE_CONFIRM_WORD} to confirm
          </label>
          <input
            id="delete-account-confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={DELETE_CONFIRM_WORD}
            autoComplete="off"
            disabled={deleting}
          />
          {error && (
            <p className="delete-account-modal__error" role="alert">
              {error}
            </p>
          )}
          <div className="delete-account-modal__actions">
            <button
              type="button"
              className="delete-account-modal__cancel"
              onClick={close}
              disabled={deleting}
            >
              Keep my account
            </button>
            <button
              type="submit"
              className="delete-account-modal__delete"
              disabled={!confirmed || deleting}
            >
              {deleting ? "Deleting…" : "Delete my account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteAccountModal;

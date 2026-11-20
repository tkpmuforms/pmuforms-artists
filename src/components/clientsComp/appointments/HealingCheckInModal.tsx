"use client";

import { X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  ClientMessage,
  cancelScheduledMessage,
  getClientMessages,
  scheduleCheckIn,
} from "../../../services/artistServices";
import { getApiErrorMessage } from "../../../utils/formLinks";
import { formatSendAt } from "../../../utils/notes";
import HealingCheckInFields from "./HealingCheckInFields";
import { useHealingCheckIn } from "./useHealingCheckIn";
import "./care-message-modal.scss";

interface HealingCheckInModalProps {
  appointmentId: string;
  clientName: string;
  onClose: () => void;
  onDone: () => void;
}

/**
 * Schedules a "how is it healing?" email for later. The artist picks when
 * first, then writes the message or has AI write it, and can ask the client
 * to send back a photo.
 */
const HealingCheckInModal: React.FC<HealingCheckInModalProps> = ({
  appointmentId,
  clientName,
  onClose,
  onDone,
}) => {
  const firstName = clientName?.split(" ")[0] || "your client";
  const checkIn = useHealingCheckIn(appointmentId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ClientMessage[]>([]);

  useEffect(() => {
    getClientMessages(appointmentId)
      .then(({ data }) =>
        setHistory(
          data.messages.filter(
            (m) =>
              m.type === "healing-check-in" &&
              ["scheduled", "sent", "failed"].includes(m.status),
          ),
        ),
      )
      .catch(() => setHistory([]));
  }, [appointmentId]);

  const handleSchedule = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const { data } = await scheduleCheckIn(appointmentId, checkIn.payload());
      toast.success(
        `Check-in scheduled for ${formatSendAt(data.message.sendAt)}`,
      );
      onDone();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not schedule the check-in."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (messageId: string) => {
    try {
      await cancelScheduledMessage(appointmentId, messageId);
      setHistory((prev) => prev.filter((m) => m.id !== messageId));
      toast.success("Check-in cancelled");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not cancel the check-in."));
    }
  };

  const shownError = error ?? checkIn.error;

  return (
    <div className="care-message-modal">
      <div className="care-message-modal__overlay" onClick={onClose} />
      <div
        className="care-message-modal__content"
        role="dialog"
        aria-label="Send healing check-in"
      >
        <button
          className="care-message-modal__close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="care-message-modal__header">
          <h2>Send healing check-in</h2>
          <p>
            Check in on how {firstName} is healing. It's emailed at the time
            you choose, and saved in {firstName}'s notes.
          </p>
        </div>

        {history.length > 0 && (
          <ul className="check-in__history" aria-label="Check-ins">
            {history.map((m) => (
              <li key={m.id}>
                <div>
                  <strong>
                    {m.status === "scheduled"
                      ? `Scheduled for ${formatSendAt(m.sendAt)}`
                      : m.status === "sent"
                        ? `Sent ${formatSendAt(m.sentAt)}`
                        : `Failed to send ${formatSendAt(m.sendAt)}`}
                  </strong>
                  <span>{m.subject}</span>
                  {!!m.photoUrls?.length && (
                    <span className="check-in__photos">
                      {m.photoUrls.map((url, i) => (
                        <a key={url} href={url} target="_blank" rel="noreferrer">
                          <img src={url} alt={`Healing photo ${i + 1}`} />
                        </a>
                      ))}
                    </span>
                  )}
                </div>
                {m.status === "scheduled" && (
                  <button type="button" onClick={() => handleCancel(m.id)}>
                    Cancel
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <HealingCheckInFields checkIn={checkIn} firstName={firstName} />

        {shownError && <p className="care-message-modal__error">{shownError}</p>}

        <div className="care-message-modal__footer">
          <button
            type="button"
            className="care-message-modal__secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="care-message-modal__primary"
            onClick={handleSchedule}
            disabled={submitting || !checkIn.ready}
          >
            {submitting ? "Scheduling..." : "Schedule check-in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HealingCheckInModal;

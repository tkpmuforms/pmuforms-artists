import { Camera, Sparkles } from "lucide-react";
import type React from "react";
import { DelayUnit } from "../../../services/artistServices";
import { formatSendAt } from "../../../utils/notes";
import { HealingCheckInState } from "./useHealingCheckIn";
import "./care-message-modal.scss";

const UNITS: DelayUnit[] = ["days", "weeks", "months"];

interface HealingCheckInFieldsProps {
  checkIn: HealingCheckInState;
  firstName: string;
}

/** When it goes out, then the message, and the photo request. */
const HealingCheckInFields: React.FC<HealingCheckInFieldsProps> = ({
  checkIn,
  firstName,
}) => {
  const {
    amount,
    setAmount,
    unit,
    setUnit,
    limit,
    timingValid,
    requestPhoto,
    setRequestPhoto,
    subject,
    setSubject,
    message,
    setMessage,
    edited,
    draft,
    writing,
    writeWithAi,
  } = checkIn;

  return (
    <div className="care-message-modal__body">
      <div className="care-message-modal__field">
        <span id="check-in-when">When should the check-in go out?</span>
        <div className="check-in__when" aria-labelledby="check-in-when">
          <span className="check-in__in">In</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={limit}
            placeholder="e.g. 3"
            aria-label="How many"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <select
            aria-label="Days, weeks or months"
            value={unit}
            onChange={(e) => setUnit(e.target.value as DelayUnit)}
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        {amount && !timingValid ? (
          <small className="check-in__hint check-in__hint--error">
            Choose between 1 and {limit} {unit}.
          </small>
        ) : draft?.sendAt && timingValid ? (
          <small className="check-in__hint">
            Goes out {formatSendAt(draft.sendAt)} (always during the day for{" "}
            {firstName}).
          </small>
        ) : (
          <small className="check-in__hint">
            Set when it goes out first, then write the message.
          </small>
        )}
      </div>

      {timingValid && (
        <>
          <label className="care-message-modal__toggle">
            <input
              type="checkbox"
              checked={requestPhoto}
              onChange={(e) => setRequestPhoto(e.target.checked)}
            />
            <Camera size={16} />
            Ask {firstName} to send a photo of how it's healing
          </label>

          <div className="care-message-modal__meta">
            <span>
              To: <strong>{draft?.to ?? "no email on file"}</strong>
            </span>
            {draft?.source === "ai" && !edited && (
              <span className="care-message-modal__badge">
                <Sparkles size={12} />
                Written by AI, please review
              </span>
            )}
          </div>

          {draft?.aiFailed && (
            <p className="care-message-modal__note">
              AI couldn't write this one, so this is a standard message. You
              can edit it or try again.
            </p>
          )}

          {draft?.aiAvailable && (
            <div className="care-message-modal__ai-actions">
              <button type="button" onClick={writeWithAi} disabled={writing}>
                <Sparkles size={14} />
                {writing
                  ? "Writing..."
                  : draft.source === "ai"
                    ? "Rewrite with AI"
                    : "Write with AI"}
              </button>
            </div>
          )}

          <label className="care-message-modal__field">
            <span>Check-in subject</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </label>

          <label className="care-message-modal__field">
            <span>Check-in message</span>
            <textarea
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
          {requestPhoto && (
            <small className="check-in__hint">
              A "Share a Healing Photo" button is added below your message.
              Photos {firstName} sends show up in their notes.
            </small>
          )}
        </>
      )}
    </div>
  );
};

export default HealingCheckInFields;

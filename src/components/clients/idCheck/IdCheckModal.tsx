import { useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import toast from "react-hot-toast";
import { recordIdCheck } from "../../../services/artistServices";
import { getApiErrorMessage } from "../../../utils/apiError";
import {
  ID_TYPE_LABELS,
  type IdCheck,
  type IdCheckType,
} from "../../../utils/idCheck";
import "./id-check.scss";

interface IdCheckModalProps {
  appointmentId: string;
  clientName?: string;
  onClose: () => void;
  onSaved: (check: IdCheck | null) => void;
}

/**
 * Records that the artist looked at the client's ID in person. There is no
 * field for the number, date of birth or a photo, on purpose.
 */
const IdCheckModal: React.FC<IdCheckModalProps> = ({
  appointmentId,
  clientName,
  onClose,
  onSaved,
}) => {
  const [idType, setIdType] = useState<IdCheckType | "">("");
  const [over18, setOver18] = useState(false);
  const [saving, setSaving] = useState(false);
  const firstName = clientName?.trim().split(/\s+/)[0] || "the client";

  const save = async () => {
    if (!idType) return;
    setSaving(true);
    try {
      const res = await recordIdCheck(appointmentId, { idType, over18 });
      toast.success("ID check recorded");
      onSaved(res?.data?.appointment?.idCheck ?? null);
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Couldn't save the ID check."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="id-check-modal">
      <div className="id-check-modal__overlay" onClick={onClose} />
      <div
        className="id-check-modal__content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="id-check-title"
      >
        <button
          type="button"
          className="id-check-modal__close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>
        <h2 id="id-check-title">Record ID check</h2>
        <p className="id-check-modal__description">
          Look at {firstName}'s ID in person, then record what you checked.
        </p>
        <p className="id-check-modal__warning">
          <ShieldCheck size={16} aria-hidden />
          <span>
            Don't photograph, scan or upload the ID, and don't write down its
            number. This record is all you need.
          </span>
        </p>

        <label className="id-check-modal__label" htmlFor="id-check-type">
          Type of ID
        </label>
        <select
          id="id-check-type"
          className="id-check-modal__select"
          value={idType}
          onChange={(e) => setIdType(e.target.value as IdCheckType)}
        >
          <option value="" disabled>
            Choose one
          </option>
          {(Object.keys(ID_TYPE_LABELS) as IdCheckType[]).map((t) => (
            <option key={t} value={t}>
              {ID_TYPE_LABELS[t]}
            </option>
          ))}
        </select>

        <label className="id-check-modal__check">
          <input
            type="checkbox"
            checked={over18}
            onChange={(e) => setOver18(e.target.checked)}
          />
          <span>The ID shows {firstName} is 18 or older</span>
        </label>

        <button
          type="button"
          className="id-check-modal__save"
          disabled={!idType || saving}
          onClick={save}
        >
          {saving ? "Saving…" : "Save ID check"}
        </button>
      </div>
    </div>
  );
};

export default IdCheckModal;

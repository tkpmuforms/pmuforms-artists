import type React from "react";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  type BatchDetail,
  holdBatch,
  releaseBatch,
} from "../../services/inventoryServices";
import { getApiErrorMessage } from "../../utils/formLinks";
import InventoryModal from "./InventoryModal";

export type HoldAction = "quarantine" | "recall" | "release";

const COPY: Record<HoldAction, { title: string; body: string; button: string; placeholder: string }> = {
  quarantine: {
    title: "Quarantine this batch?",
    body: "It can't be used on clients until you release it. Use this while you check on a concern.",
    button: "Quarantine",
    placeholder: "e.g. Seal looked broken",
  },
  recall: {
    title: "Recall this batch?",
    body: "It will be blocked from use on clients permanently. Its stock, history and the clients who received it stay on record.",
    button: "Recall batch",
    placeholder: "e.g. Manufacturer recall notice #123",
  },
  release: {
    title: "Release from quarantine?",
    body: "It can be used on clients again (as long as it hasn't expired).",
    button: "Release",
    placeholder: "e.g. Checked with the supplier",
  },
};

const HoldBatchModal: React.FC<{
  batch: BatchDetail;
  action: HoldAction;
  onClose: () => void;
  onDone: (batch: BatchDetail) => void;
}> = ({ batch, action, onClose, onDone }) => {
  const [reason, setReason] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = COPY[action];

  const save = async () => {
    if (!reason.trim()) return setError("Add a reason. It's kept on the batch's history.");
    setSaving(true);
    setError(null);
    try {
      const { data } =
        action === "release"
          ? await releaseBatch(batch.id, reason.trim())
          : await holdBatch(batch.id, {
              status: action === "recall" ? "recalled" : "quarantined",
              reason: reason.trim(),
            });
      toast.success(
        action === "recall" ? "Batch recalled" : action === "release" ? "Batch released" : "Batch quarantined",
      );
      onDone(data.batch);
    } catch (e) {
      setError(getApiErrorMessage(e, "Couldn't update the batch."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <InventoryModal
      title={copy.title}
      subtitle={`Lot ${batch.lotNumber} · ${batch.productName ?? ""}`}
      onClose={onClose}
      footer={
        <>
          <button className="inv-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className={`inv-btn ${action === "recall" ? "inv-btn--danger-solid" : "inv-btn--primary"}`}
            onClick={save}
            disabled={saving || (action === "recall" && !understood)}
          >
            {saving ? "Saving…" : copy.button}
          </button>
        </>
      }
    >
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{copy.body}</p>
      <label className="inv-field">
        <span>Reason</span>
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={copy.placeholder} autoFocus />
      </label>
      {action === "recall" && (
        <label className="inv-check">
          <input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} />
          I understand a recall can't be undone.
        </label>
      )}
      {error && <p className="inv-error">{error}</p>}
    </InventoryModal>
  );
};

export default HoldBatchModal;

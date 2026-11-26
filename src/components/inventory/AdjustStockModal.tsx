import type React from "react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  type BatchDetail,
  type ManualTxnType,
  adjustBatch,
  newRequestId,
} from "../../services/inventoryServices";
import { getApiErrorMessage } from "../../utils/formLinks";
import { formatQty, isAmount } from "../../utils/inventory";
import InventoryModal from "./InventoryModal";
import Field from "./Field";

const TYPES: { id: ManualTxnType; label: string; hint: string; removesOnly?: boolean }[] = [
  { id: "wasted", label: "Wasted / discarded", hint: "Spilled, contaminated or thrown away.", removesOnly: true },
  { id: "returned-to-supplier", label: "Returned to supplier", hint: "Sent back to the supplier.", removesOnly: true },
  { id: "correction", label: "Correction", hint: "Fixing a count that was entered wrong." },
  { id: "adjustment", label: "Adjustment", hint: "Anything else, e.g. after a stock count." },
];

/** Records a manual stock change. Every change is kept with its reason. */
const AdjustStockModal: React.FC<{
  batch: BatchDetail;
  onClose: () => void;
  onDone: (batch: BatchDetail) => void;
}> = ({ batch, onClose, onDone }) => {
  const [type, setType] = useState<ManualTxnType>("wasted");
  const [direction, setDirection] = useState<"add" | "remove">("remove");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(newRequestId());

  const meta = TYPES.find((t) => t.id === type)!;
  const removes = meta.removesOnly || direction === "remove";
  const valid = isAmount(quantity) && Number(quantity) > 0;
  // exact enough for a preview; the server does the real (integer) math
  const after = valid
    ? Math.round((Number(batch.currentQty) + (removes ? -1 : 1) * Number(quantity)) * 1000) / 1000
    : null;

  const save = async () => {
    if (!valid) return setError("Enter an amount above zero, up to 3 decimals.");
    if (after !== null && after < 0) {
      return setError(`Only ${formatQty(batch.currentQty, batch.unit)} is in this batch.`);
    }
    if (!reason.trim()) return setError("Add a reason. It's kept with the change.");
    setSaving(true);
    setError(null);
    try {
      const { data } = await adjustBatch(batch.id, {
        type,
        direction: removes ? "remove" : "add",
        quantity: quantity.trim(),
        reason: reason.trim(),
        notes: notes.trim() || undefined,
        requestId: requestId.current,
      });
      toast.success("Stock updated");
      onDone(data.batch);
    } catch (e) {
      setError(getApiErrorMessage(e, "Couldn't update the stock."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <InventoryModal
      title="Adjust stock"
      subtitle={`Lot ${batch.lotNumber} · ${formatQty(batch.currentQty, batch.unit)} in stock`}
      onClose={onClose}
      footer={
        <>
          <button className="inv-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="inv-btn inv-btn--primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save change"}
          </button>
        </>
      }
    >
      <Field label="What happened?">
        <select value={type} onChange={(e) => setType(e.target.value as ManualTxnType)}>
          {TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <span className="inv-field__hint">{meta.hint}</span>
      </Field>
      {!meta.removesOnly && (
        <div className="inv-field">
          <span>Direction</span>
          <div className="inv-segmented" role="group" aria-label="Direction">
            <button type="button" aria-pressed={direction === "remove"} onClick={() => setDirection("remove")}>
              Remove stock
            </button>
            <button type="button" aria-pressed={direction === "add"} onClick={() => setDirection("add")}>
              Add stock
            </button>
          </div>
        </div>
      )}
      <Field label={<>Quantity ({batch.unit})</>}>
        <input value={quantity} onChange={(e) => setQuantity(e.target.value)} inputMode="decimal" autoFocus />
        {after !== null && (
          <span className="inv-field__hint">
            {after < 0 ? "More than is in stock." : `Leaves ${formatQty(String(after), batch.unit)}.`}
          </span>
        )}
      </Field>
      <label className="inv-field">
        <span>Reason</span>
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Bottle dropped" />
      </label>
      <label className="inv-field">
        <span>Notes (optional)</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      {error && <p className="inv-error">{error}</p>}
    </InventoryModal>
  );
};

export default AdjustStockModal;

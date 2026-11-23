import type React from "react";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  type Supplier,
  createSupplier,
  updateSupplier,
} from "../../services/inventoryServices";
import { getApiErrorMessage } from "../../utils/formLinks";
import InventoryModal from "./InventoryModal";

interface SupplierModalProps {
  supplier?: Supplier;
  onClose: () => void;
  onSaved: (s: Supplier) => void;
}

const empty = (v?: string) => (v?.trim() ? v.trim() : undefined);

const SupplierModal: React.FC<SupplierModalProps> = ({ supplier, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: supplier?.name ?? "",
    contact: supplier?.contact ?? "",
    email: supplier?.email ?? "",
    phone: supplier?.phone ?? "",
    website: supplier?.website ?? "",
    notes: supplier?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    if (!form.name.trim()) {
      setError("Enter the supplier's name.");
      return;
    }
    setSaving(true);
    setError(null);
    const data = {
      name: form.name.trim(),
      contact: empty(form.contact),
      email: empty(form.email),
      phone: empty(form.phone),
      website: empty(form.website),
      notes: empty(form.notes),
    };
    try {
      const { data: res } = supplier
        ? await updateSupplier(supplier.id, data)
        : await createSupplier(data);
      toast.success(supplier ? "Supplier saved" : "Supplier added");
      onSaved(res.supplier);
    } catch (e) {
      setError(getApiErrorMessage(e, "Couldn't save the supplier."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <InventoryModal
      title={supplier ? "Edit supplier" : "Add supplier"}
      onClose={onClose}
      footer={
        <>
          <button className="inv-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="inv-btn inv-btn--primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <div className="inv-grid">
        <label className="inv-field inv-span-2">
          <span>Name</span>
          <input value={form.name} onChange={set("name")} autoFocus />
        </label>
        <label className="inv-field">
          <span>Contact</span>
          <input value={form.contact} onChange={set("contact")} />
        </label>
        <label className="inv-field">
          <span>Phone</span>
          <input value={form.phone} onChange={set("phone")} />
        </label>
        <label className="inv-field">
          <span>Email</span>
          <input type="email" value={form.email} onChange={set("email")} />
        </label>
        <label className="inv-field">
          <span>Website</span>
          <input value={form.website} onChange={set("website")} placeholder="https://" />
        </label>
        <label className="inv-field inv-span-2">
          <span>Notes</span>
          <textarea value={form.notes} onChange={set("notes")} />
        </label>
      </div>
      {error && <p className="inv-error">{error}</p>}
    </InventoryModal>
  );
};

export default SupplierModal;

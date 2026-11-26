import type React from "react";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  type Manufacturer,
  createManufacturer,
  updateManufacturer,
} from "../../services/inventoryServices";
import { getApiErrorMessage } from "../../utils/formLinks";
import InventoryModal from "./InventoryModal";
import Field from "./Field";

interface ManufacturerModalProps {
  manufacturer?: Manufacturer;
  onClose: () => void;
  onSaved: (m: Manufacturer) => void;
}

const empty = (v?: string) => (v?.trim() ? v.trim() : undefined);

/** Add or edit a manufacturer, including where registration info applies. */
const ManufacturerModal: React.FC<ManufacturerModalProps> = ({
  manufacturer,
  onClose,
  onSaved,
}) => {
  const [form, setForm] = useState({
    name: manufacturer?.name ?? "",
    address: manufacturer?.address ?? "",
    country: manufacturer?.country ?? "",
    website: manufacturer?.website ?? "",
    contact: manufacturer?.contact ?? "",
    supportEmail: manufacturer?.supportEmail ?? "",
    registrationInfo: manufacturer?.registrationInfo ?? "",
    rpName: manufacturer?.responsiblePerson?.name ?? "",
    rpAddress: manufacturer?.responsiblePerson?.address ?? "",
    rpContact: manufacturer?.responsiblePerson?.contact ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    if (!form.name.trim()) {
      setError("Enter the manufacturer's name.");
      return;
    }
    setSaving(true);
    setError(null);
    const data = {
      name: form.name.trim(),
      address: empty(form.address),
      country: empty(form.country),
      website: empty(form.website),
      contact: empty(form.contact),
      supportEmail: empty(form.supportEmail),
      registrationInfo: empty(form.registrationInfo),
      responsiblePerson:
        form.rpName || form.rpAddress || form.rpContact
          ? {
              name: empty(form.rpName),
              address: empty(form.rpAddress),
              contact: empty(form.rpContact),
            }
          : undefined,
    };
    try {
      const { data: res } = manufacturer
        ? await updateManufacturer(manufacturer.id, data)
        : await createManufacturer(data);
      toast.success(manufacturer ? "Manufacturer saved" : "Manufacturer added");
      onSaved(res.manufacturer);
    } catch (e) {
      setError(getApiErrorMessage(e, "Couldn't save the manufacturer."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <InventoryModal
      title={manufacturer ? "Edit manufacturer" : "Add manufacturer"}
      onClose={onClose}
      wide
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
        <label className="inv-field inv-span-2">
          <span>Address</span>
          <input value={form.address} onChange={set("address")} />
        </label>
        <label className="inv-field">
          <span>Country</span>
          <input value={form.country} onChange={set("country")} />
        </label>
        <label className="inv-field">
          <span>Website</span>
          <input value={form.website} onChange={set("website")} placeholder="https://" />
        </label>
        <label className="inv-field">
          <span>Contact</span>
          <input value={form.contact} onChange={set("contact")} placeholder="Name or phone" />
        </label>
        <label className="inv-field">
          <span>Support email</span>
          <input type="email" value={form.supportEmail} onChange={set("supportEmail")} />
        </label>
        <Field className="inv-span-2" label="Registration information (where applicable)">
          <input
            value={form.registrationInfo}
            onChange={set("registrationInfo")}
            placeholder="e.g. FDA facility registration number"
          />
          <span className="inv-field__hint">
            A facility registration is not FDA approval of the products made there.
          </span>
        </Field>
      </div>
      <h3 style={{ margin: "8px 0 0", fontSize: 15 }}>Responsible person (where applicable)</h3>
      <div className="inv-grid">
        <label className="inv-field">
          <span>Name</span>
          <input value={form.rpName} onChange={set("rpName")} />
        </label>
        <label className="inv-field">
          <span>Contact</span>
          <input value={form.rpContact} onChange={set("rpContact")} />
        </label>
        <label className="inv-field inv-span-2">
          <span>Address</span>
          <input value={form.rpAddress} onChange={set("rpAddress")} />
        </label>
      </div>
      {error && <p className="inv-error">{error}</p>}
    </InventoryModal>
  );
};

export default ManufacturerModal;

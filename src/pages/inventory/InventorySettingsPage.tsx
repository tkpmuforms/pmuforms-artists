import { Archive, ArchiveRestore, Pencil, Plus } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import InventoryGate from "../../components/inventoryComp/InventoryGate";
import ManufacturerModal from "../../components/inventoryComp/ManufacturerModal";
import SupplierModal from "../../components/inventoryComp/SupplierModal";
import ChecklistEditor from "../../components/inventoryComp/compliance/ChecklistEditor";
import "../../components/inventoryComp/inventory.scss";
import {
  type Category,
  type Manufacturer,
  type Supplier,
  getCategories,
  getInventorySettings,
  getManufacturers,
  getSuppliers,
  setManufacturerArchived,
  setSupplierArchived,
  updateInventorySettings,
} from "../../services/inventoryServices";
import { getApiErrorMessage } from "../../utils/formLinks";
import Field from "../../components/inventoryComp/Field";

type Tab = "general" | "manufacturers" | "suppliers" | "checklists";

const TABS: [Tab, string][] = [
  ["general", "General"],
  ["manufacturers", "Manufacturers"],
  ["suppliers", "Suppliers"],
  ["checklists", "Document checklists"],
];

const InventorySettingsPage: React.FC = () => (
  <InventoryGate>
    <InventorySettingsView />
  </InventoryGate>
);

const InventorySettingsView: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as Tab) || "general";

  return (
    <div className="inv-page" style={{ maxWidth: 900 }}>
      <div className="inv-tabs" role="tablist">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setParams({ tab: id }, { replace: true })}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "general" && <GeneralTab />}
      {tab === "manufacturers" && <ManufacturersTab />}
      {tab === "suppliers" && <SuppliersTab />}
      {tab === "checklists" && <ChecklistsTab />}
    </div>
  );
};

// ----------------------------------------------------------------- general

const GeneralTab: React.FC = () => {
  const [days, setDays] = useState("");
  const [saved, setSaved] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getInventorySettings()
      .then(({ data }) => {
        const text = data.settings.expiryWarningDays.join(", ");
        setDays(text);
        setSaved(text);
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    const parts = days
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);
    const numbers = parts.map(Number);
    if (
      !parts.length ||
      parts.length > 5 ||
      numbers.some((n) => !Number.isInteger(n) || n < 1 || n > 365)
    ) {
      setError("Enter up to 5 whole numbers of days between 1 and 365, e.g. 90, 60, 30.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { data } = await updateInventorySettings({ expiryWarningDays: numbers });
      const text = data.settings.expiryWarningDays.join(", ");
      setDays(text);
      setSaved(text);
      toast.success("Settings saved");
    } catch (e) {
      setError(getApiErrorMessage(e, "Couldn't save the settings."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="inv-card">
      <h3>Expiration warnings</h3>
      <Field style={{ maxWidth: 360 }} label="Warn before expiration (days)">
        <input value={days} onChange={(e) => setDays(e.target.value)} placeholder="90, 60, 30" />
        <span className="inv-field__hint">
          A batch shows as "Expiring soon" within the largest of these.
        </span>
      </Field>
      {error && <p className="inv-error">{error}</p>}
      <div className="inv-modal__footer" style={{ justifyContent: "flex-start" }}>
        <button
          className="inv-btn inv-btn--primary"
          onClick={save}
          disabled={saving || days === saved}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </section>
  );
};

// ------------------------------------------------------------ directories

function useDirectory<T extends { id: string; archivedAt?: string | null }>(
  fetch: (includeArchived: boolean) => Promise<T[]>,
) {
  const [showArchived, setShowArchived] = useState(false);
  const [rows, setRows] = useState<T[] | null>(null);
  const load = useCallback(
    () =>
      fetch(showArchived)
        .then(setRows)
        .catch(() => setRows([])),
    [fetch, showArchived],
  );
  useEffect(() => {
    load();
  }, [load]);
  return { rows, load, showArchived, setShowArchived };
}

const fetchManufacturers = (all: boolean) =>
  getManufacturers(all).then(({ data }) => data.manufacturers);
const fetchSuppliers = (all: boolean) => getSuppliers(all).then(({ data }) => data.suppliers);

const ManufacturersTab: React.FC = () => {
  const { rows, load, showArchived, setShowArchived } = useDirectory<Manufacturer>(fetchManufacturers);
  const [editing, setEditing] = useState<Manufacturer | "new" | null>(null);

  const toggle = async (m: Manufacturer) => {
    try {
      await setManufacturerArchived(m.id, !m.archivedAt);
      load();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Couldn't update the manufacturer."));
    }
  };

  return (
    <section className="inv-card">
      <div className="inv-card__head">
        <h3>Manufacturers</h3>
        <div className="inv-head__actions">
          <label className="inv-check">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            Show archived
          </label>
          <button className="inv-btn inv-btn--sm" onClick={() => setEditing("new")}>
            <Plus size={14} /> Add
          </button>
        </div>
      </div>
      <DirectoryTable
        rows={rows}
        empty="No manufacturers yet."
        columns={[
          ["Name", (m) => m.name],
          ["Country", (m) => m.country ?? "—"],
          ["Contact", (m) => m.supportEmail ?? m.contact ?? "—"],
        ]}
        onEdit={(m) => setEditing(m)}
        onToggle={toggle}
      />
      {editing && (
        <ManufacturerModal
          manufacturer={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </section>
  );
};

const SuppliersTab: React.FC = () => {
  const { rows, load, showArchived, setShowArchived } = useDirectory<Supplier>(fetchSuppliers);
  const [editing, setEditing] = useState<Supplier | "new" | null>(null);

  const toggle = async (s: Supplier) => {
    try {
      await setSupplierArchived(s.id, !s.archivedAt);
      load();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Couldn't update the supplier."));
    }
  };

  return (
    <section className="inv-card">
      <div className="inv-card__head">
        <h3>Suppliers</h3>
        <div className="inv-head__actions">
          <label className="inv-check">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            Show archived
          </label>
          <button className="inv-btn inv-btn--sm" onClick={() => setEditing("new")}>
            <Plus size={14} /> Add
          </button>
        </div>
      </div>
      <DirectoryTable
        rows={rows}
        empty="No suppliers yet."
        columns={[
          ["Name", (s) => s.name],
          ["Contact", (s) => s.contact ?? "—"],
          ["Email / phone", (s) => s.email ?? s.phone ?? "—"],
        ]}
        onEdit={(s) => setEditing(s)}
        onToggle={toggle}
      />
      {editing && (
        <SupplierModal
          supplier={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </section>
  );
};

function DirectoryTable<T extends { id: string; name: string; archivedAt?: string | null }>({
  rows,
  empty,
  columns,
  onEdit,
  onToggle,
}: {
  rows: T[] | null;
  empty: string;
  columns: [string, (row: T) => React.ReactNode][];
  onEdit: (row: T) => void;
  onToggle: (row: T) => void;
}) {
  if (rows === null) return <div className="inv-loading">Loading…</div>;
  if (!rows.length) return <p className="inv-small">{empty}</p>;
  return (
    <div className="inv-table-wrap">
      <table className="inv-table inv-table--cards">
        <thead>
          <tr>
            {columns.map(([label]) => (
              <th key={label}>{label}</th>
            ))}
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map(([label, cell], i) => (
                <td key={label} data-label={label} className={i === 0 ? "inv-strong" : undefined}>
                  {cell(row)}
                  {i === 0 && row.archivedAt && (
                    <span className="inv-badge inv-badge--grey" style={{ marginLeft: 8 }}>
                      Archived
                    </span>
                  )}
                </td>
              ))}
              <td data-label="" style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                <button className="inv-btn inv-btn--link" onClick={() => onEdit(row)} aria-label={`Edit ${row.name}`}>
                  <Pencil size={14} />
                </button>
                <button
                  className="inv-btn inv-btn--link"
                  onClick={() => onToggle(row)}
                  aria-label={`${row.archivedAt ? "Restore" : "Archive"} ${row.name}`}
                  title={row.archivedAt ? "Restore" : "Archive"}
                >
                  {row.archivedAt ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// -------------------------------------------------------------- checklists

const ChecklistsTab: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("pmu-pigments");

  useEffect(() => {
    getCategories()
      .then(({ data }) => setCategories(data.categories))
      .catch(() => {});
  }, []);

  const category = categories.find((c) => c.id === categoryId);

  return (
    <>
      <section className="inv-card">
        <h3>Recommended documents by category</h3>
        <p className="inv-muted" style={{ marginTop: 0 }}>
          Each product's passport counts its documents against its category's
          list, e.g. "Product documentation: 8 of 10 requested items provided".
        </p>
        <label className="inv-field" style={{ maxWidth: 360 }}>
          <span>Category</span>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </section>
      {category && (
        <ChecklistEditor key={category.id} categoryId={category.id} categoryName={category.name} />
      )}
    </>
  );
};

export default InventorySettingsPage;

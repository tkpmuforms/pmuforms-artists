import { Info, Plus, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  getChecklist,
  resetChecklist,
  setChecklist,
  type Checklist,
} from "../../../services/inventoryServices";
import { getApiErrorMessage } from "../../../utils/formLinks";
import { Badge } from "../StatusBadge";
import { useComplianceCatalog } from "./useComplianceCatalog";
import "./compliance.scss";

export interface ChecklistEditorProps {
  categoryId: string;
  categoryName: string;
}

type Level = "product" | "batch";
interface Item {
  docType: string;
  level: Level;
}

const LEVEL_LABELS: Record<Level, string> = {
  product: "Per product",
  batch: "Per batch",
};

/** Edits which documents are recommended for a product category. */
const ChecklistEditor: React.FC<ChecklistEditorProps> = ({ categoryId, categoryName }) => {
  const { catalog } = useComplianceCatalog();
  const [checklist, setLoaded] = useState<Checklist | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newType, setNewType] = useState("");
  const [newLevel, setNewLevel] = useState<Level>("product");
  const [saving, setSaving] = useState(false);

  const apply = (data: Checklist) => {
    setLoaded(data);
    setItems(data.items.map(({ docType, level }) => ({ docType, level })));
  };

  useEffect(() => {
    let alive = true;
    setLoaded(null);
    getChecklist(categoryId)
      .then(({ data }) => alive && apply(data.checklist))
      .catch((e) => alive && setError(getApiErrorMessage(e, "Could not load this checklist.")));
    return () => {
      alive = false;
    };
  }, [categoryId]);

  const types = catalog?.documentTypes ?? [];
  const labelOf = (id: string) => types.find((t) => t.id === id)?.label ?? id;
  const newTypeDef = types.find((t) => t.id === newType);
  const levelChoices: Level[] = newTypeDef?.levels ?? ["product", "batch"];
  const chosenLevel = levelChoices.includes(newLevel) ? newLevel : levelChoices[0];
  const exists = items.some((i) => i.docType === newType && i.level === chosenLevel);

  const dirty =
    !!checklist &&
    JSON.stringify(items) !==
      JSON.stringify(checklist.items.map(({ docType, level }) => ({ docType, level })));

  const add = () => {
    if (!newType || exists) return;
    setItems((list) => [...list, { docType: newType, level: chosenLevel }]);
    setNewType("");
  };

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await setChecklist(categoryId, items);
      apply(data.checklist);
      toast.success(`Saved the list for ${categoryName}`);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not save the checklist."));
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    setSaving(true);
    try {
      const { data } = await resetChecklist(categoryId);
      apply(data.checklist);
      toast.success(`${categoryName} is back to the default list`);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not reset the checklist."));
    } finally {
      setSaving(false);
    }
  };

  if (error) return <p className="inv-error">{error}</p>;
  if (!checklist) return <p className="inv-muted">Loading…</p>;

  return (
    <div className="cp" aria-label={`Recommended documents for ${categoryName}`}>
      <div className="cp__summary">
        <strong>{categoryName}</strong>
        <Badge tone={checklist.isDefault ? "grey" : "purple"}>
          {checklist.isDefault ? "Using the default list" : "Customized"}
        </Badge>
      </div>
      <div className="inv-banner inv-banner--info">
        <Info size={18} />
        <p>
          These are recommendations. Anything missing shows as "Not provided" on the
          product's passport and in the "X of Y provided" count. It never blocks
          receiving stock or using a product.
        </p>
      </div>

      {items.length ? (
        <ul className="cp-checklist">
          {items.map((item) => (
            <li key={`${item.docType}-${item.level}`}>
              <span>
                {labelOf(item.docType)}{" "}
                <span className="inv-small">· {LEVEL_LABELS[item.level]}</span>
              </span>
              <button
                type="button"
                className="inv-btn inv-btn--sm inv-btn--link"
                onClick={() =>
                  setItems((list) =>
                    list.filter((i) => !(i.docType === item.docType && i.level === item.level)),
                  )
                }
                aria-label={`Remove ${labelOf(item.docType)} (${LEVEL_LABELS[item.level]})`}
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="inv-muted">No documents requested for this category.</p>
      )}

      <div className="cp-checklist__add">
        <label className="inv-field">
          <span>Document</span>
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            aria-label="Document to request"
          >
            <option value="">Choose a document…</option>
            {(catalog?.sections ?? []).map((section) => {
              const inSection = types.filter((t) => t.section === section.id);
              if (!inSection.length) return null;
              return (
                <optgroup key={section.id} label={section.label}>
                  {inSection.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </label>
        <label className="inv-field">
          <span>Requested</span>
          <select
            value={chosenLevel}
            onChange={(e) => setNewLevel(e.target.value as Level)}
            aria-label="Requested per"
          >
            {levelChoices.map((l) => (
              <option key={l} value={l}>
                {LEVEL_LABELS[l]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="inv-btn"
          onClick={add}
          disabled={!newType || exists}
          title={exists ? "Already on the list" : undefined}
        >
          <Plus size={16} /> Add
        </button>
      </div>

      <div className="inv-head__actions">
        <button
          type="button"
          className="inv-btn inv-btn--primary"
          onClick={save}
          disabled={saving || !dirty}
        >
          {saving ? "Saving…" : "Save list"}
        </button>
        <button
          type="button"
          className="inv-btn"
          onClick={reset}
          disabled={saving || checklist.isDefault}
        >
          Reset to default
        </button>
      </div>
    </div>
  );
};

export default ChecklistEditor;

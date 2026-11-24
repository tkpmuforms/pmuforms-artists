import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FormType, Service } from "../../redux/types";
import {
  type ApiForm,
  BLANK_DRAFT,
  type BuilderField,
  type BuilderSection,
  FIELD_KIND_LABELS,
  type FieldKind,
  type FormDraft,
  apiMessage,
  createCustomForm,
} from "../../services/formBuilderServices";
import "./form-builder.scss";

const FORM_TYPE_OPTIONS: { value: FormType; label: string }[] = [
  { value: "consent", label: "Consent or intake form (clients fill in and sign)" },
  { value: "care", label: "Aftercare instructions" },
  { value: "pre-care", label: "Pre-care instructions (emailed before the visit)" },
];

// list keys that survive reordering
let nextKey = 0;
const key = () => `k${++nextKey}`;
type Field = BuilderField & { key: string };
type Section = Omit<BuilderSection, "fields"> & { key: string; fields: Field[] };

const withKeys = (sections: BuilderSection[]): Section[] =>
  sections.map((section) => ({
    ...section,
    key: key(),
    fields: section.fields.map((field) => ({ ...field, key: key() })),
  }));

const blankQuestion = (kind: FieldKind = "text"): Field => ({
  key: key(),
  title: "",
  kind,
  required: false,
});

const move = <T,>(list: T[], from: number, to: number) => {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

interface FormBuilderProps {
  draft: FormDraft;
  /** the services the artist offers, to choose from */
  services: Service[];
  initialServiceIds?: number[];
  /** things to check, from a scan */
  notes?: string[];
  source: "scratch" | "scan";
  onSaved: (form: ApiForm) => void;
  onCancel: () => void;
}

/**
 * Builds a form from scratch, or checks and fixes one read from a paper
 * form, then saves it as the artist's own form.
 */
const FormBuilder: React.FC<FormBuilderProps> = ({
  draft,
  services,
  initialServiceIds = [],
  notes = [],
  source,
  onSaved,
  onCancel,
}) => {
  const [title, setTitle] = useState(draft.title);
  const [type, setType] = useState<FormType>(draft.type);
  const [serviceIds, setServiceIds] = useState<number[]>(initialServiceIds);
  const [sections, setSections] = useState<Section[]>(() =>
    withKeys(draft.sections.length ? draft.sections : BLANK_DRAFT.sections),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dirty = useRef(source === "scan");
  const saved = useRef(false);

  // a scanned or half-built form shouldn't vanish on an accidental reload
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty.current && !saved.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const touch = () => {
    dirty.current = true;
    setError("");
  };

  const updateSection = (index: number, change: Partial<Section>) => {
    touch();
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...change } : s)),
    );
  };

  const updateField = (
    sectionIndex: number,
    fieldIndex: number,
    change: Partial<Field>,
  ) => {
    touch();
    setSections((prev) =>
      prev.map((s, i) =>
        i === sectionIndex
          ? {
              ...s,
              fields: s.fields.map((f, j) =>
                j === fieldIndex ? { ...f, ...change } : f,
              ),
            }
          : s,
      ),
    );
  };

  const setFields = (sectionIndex: number, fields: Field[]) =>
    updateSection(sectionIndex, { fields });

  const toggleService = (id: number) => {
    touch();
    setServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const questionCount = sections.reduce(
    (count, s) => count + s.fields.filter((f) => f.title.trim()).length,
    0,
  );

  const save = async () => {
    if (!title.trim()) {
      setError("Give the form a title.");
      return;
    }
    if (questionCount === 0) {
      setError("Add at least one question or some text.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { data } = await createCustomForm({
        title: title.trim(),
        type,
        services: serviceIds,
        source,
        sections: sections.map((section) => ({
          title: section.title.trim(),
          clientInformation: !!section.clientInformation,
          fields: section.fields
            .filter((f) => f.title.trim())
            .map((f) => ({
              title: f.title.trim(),
              kind: f.kind,
              required: f.kind === "paragraph" ? false : !!f.required,
              ...(f.autofill ? { autofill: f.autofill } : {}),
            })),
        })),
      });
      saved.current = true;
      onSaved(data.form);
    } catch (err) {
      setError(apiMessage(err, "Couldn't save the form. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="form-builder">
      {notes.length > 0 && (
        <div className="form-builder__notes" role="note">
          <strong>Check these before you save</strong>
          <ul>
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      {source === "scan" && (
        <p className="form-builder__hint">
          Here's what we read from your photos. Compare it with your paper form
          and fix anything that's off. Nothing is saved until you create the
          form.
        </p>
      )}

      <div className="form-builder__card">
        <label className="form-builder__label">
          Form title
          <input
            value={title}
            maxLength={150}
            placeholder="e.g. Brow Consent Form"
            onChange={(e) => {
              touch();
              setTitle(e.target.value);
            }}
          />
        </label>

        <label className="form-builder__label">
          Kind of form
          <select
            value={type}
            onChange={(e) => {
              touch();
              setType(e.target.value as FormType);
            }}
          >
            {FORM_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="form-builder__services">
          <legend>Services it's for</legend>
          {services.length ? (
            <div className="form-builder__chips">
              {services.map((service) => {
                const on = serviceIds.includes(service.id);
                return (
                  <button
                    type="button"
                    key={service.id}
                    className={`form-builder__chip${on ? " form-builder__chip--on" : ""}`}
                    aria-pressed={on}
                    onClick={() => toggleService(service.id)}
                  >
                    {service.service}
                  </button>
                );
              })}
            </div>
          ) : null}
          <p className="form-builder__small">
            {serviceIds.length
              ? "Clients booking these services get this form."
              : "Not on a service yet. Clients only get it once it's on a service; you can add it later."}
          </p>
        </fieldset>
      </div>

      {sections.map((section, sectionIndex) => (
        <section
          key={section.key}
          className="form-builder__card form-builder__section"
          aria-label={`Section ${sectionIndex + 1}`}
        >
          <div className="form-builder__section-head">
            <input
              className="form-builder__section-title"
              aria-label="Section title"
              placeholder={`Section ${sectionIndex + 1} title`}
              value={section.title}
              maxLength={300}
              onChange={(e) => updateSection(sectionIndex, { title: e.target.value })}
            />
            <div className="form-builder__tools">
              <button
                type="button"
                aria-label="Move section up"
                disabled={sectionIndex === 0}
                onClick={() => {
                  touch();
                  setSections((prev) => move(prev, sectionIndex, sectionIndex - 1));
                }}
              >
                <ArrowUp size={16} />
              </button>
              <button
                type="button"
                aria-label="Move section down"
                disabled={sectionIndex === sections.length - 1}
                onClick={() => {
                  touch();
                  setSections((prev) => move(prev, sectionIndex, sectionIndex + 1));
                }}
              >
                <ArrowDown size={16} />
              </button>
              <button
                type="button"
                aria-label="Delete section"
                disabled={sections.length === 1}
                onClick={() => {
                  touch();
                  setSections((prev) => prev.filter((_, i) => i !== sectionIndex));
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {type === "consent" && (
            <label className="form-builder__check">
              <input
                type="checkbox"
                checked={!!section.clientInformation}
                onChange={(e) =>
                  updateSection(sectionIndex, { clientInformation: e.target.checked })
                }
              />
              This section collects the client's details (we fill in their name,
              date of birth, address and phone for them)
            </label>
          )}

          <ol className="form-builder__fields">
            {section.fields.map((field, fieldIndex) => (
              <li key={field.key} className="form-builder__field">
                <textarea
                  aria-label={
                    field.kind === "paragraph" ? "Text to read" : "Question"
                  }
                  placeholder={
                    field.kind === "paragraph"
                      ? "Instructions or a statement to read"
                      : "Question or label, e.g. Date of birth"
                  }
                  rows={field.kind === "paragraph" || field.title.length > 80 ? 3 : 1}
                  value={field.title}
                  onChange={(e) =>
                    updateField(sectionIndex, fieldIndex, { title: e.target.value })
                  }
                />
                <div className="form-builder__field-row">
                  <select
                    aria-label="Answer type"
                    value={field.kind}
                    onChange={(e) =>
                      updateField(sectionIndex, fieldIndex, {
                        kind: e.target.value as FieldKind,
                        // a recognised field only makes sense as what it was
                        autofill: undefined,
                        required:
                          e.target.value === "signature" ? true : field.required,
                      })
                    }
                  >
                    {Object.entries(FIELD_KIND_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {field.kind !== "paragraph" && (
                    <label className="form-builder__check form-builder__check--inline">
                      <input
                        type="checkbox"
                        checked={field.kind === "signature" || !!field.required}
                        disabled={field.kind === "signature"}
                        onChange={(e) =>
                          updateField(sectionIndex, fieldIndex, {
                            required: e.target.checked,
                          })
                        }
                      />
                      Required
                    </label>
                  )}
                  <div className="form-builder__tools">
                    <button
                      type="button"
                      aria-label="Move up"
                      disabled={fieldIndex === 0}
                      onClick={() =>
                        setFields(sectionIndex, move(section.fields, fieldIndex, fieldIndex - 1))
                      }
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      disabled={fieldIndex === section.fields.length - 1}
                      onClick={() =>
                        setFields(sectionIndex, move(section.fields, fieldIndex, fieldIndex + 1))
                      }
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete"
                      onClick={() =>
                        setFields(
                          sectionIndex,
                          section.fields.filter((_, j) => j !== fieldIndex),
                        )
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <div className="form-builder__add">
            <button
              type="button"
              onClick={() => setFields(sectionIndex, [...section.fields, blankQuestion()])}
            >
              <Plus size={16} /> Question
            </button>
            <button
              type="button"
              onClick={() =>
                setFields(sectionIndex, [...section.fields, blankQuestion("paragraph")])
              }
            >
              <Plus size={16} /> Text to read
            </button>
          </div>
        </section>
      ))}

      <button
        type="button"
        className="form-builder__add-section"
        onClick={() => {
          touch();
          setSections((prev) => [
            ...prev,
            { key: key(), title: "", fields: [blankQuestion()] },
          ]);
        }}
      >
        <Plus size={16} /> Add section
      </button>

      <div className="form-builder__footer">
        {error && (
          <p className="form-builder__error" role="alert">
            {error}
          </p>
        )}
        <div className="form-builder__footer-buttons">
          <button type="button" className="form-builder__secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="form-builder__primary"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Creating…" : "Create form"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;

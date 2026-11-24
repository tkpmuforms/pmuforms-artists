import { BookOpen, Check, FilePlus2, ScanLine, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { FormType, Service } from "../../redux/types";
import { getArtistForms } from "../../services/artistServices";
import {
  type ApiForm,
  FORM_TYPE_LABELS,
  addServiceToForm,
  apiMessage,
  getFormLibrary,
  isOwnForm,
  rootOf,
} from "../../services/formBuilderServices";
import "./service-forms.scss";

interface Choice {
  form: ApiForm;
  /** the artist edited it or made it */
  mine: boolean;
}

interface AddFormToServiceModalProps {
  service: Service;
  /** forms already on the service */
  attached: ApiForm[];
  onAdded: () => void;
  onClose: () => void;
}

const TYPE_FILTERS: ("all" | FormType)[] = ["all", "consent", "care", "pre-care"];

const AddFormToServiceModal: React.FC<AddFormToServiceModalProps> = ({
  service,
  attached,
  onAdded,
  onClose,
}) => {
  const navigate = useNavigate();
  const [view, setView] = useState<"choose" | "library">("choose");
  const [choices, setChoices] = useState<Choice[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | FormType>("all");
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (view !== "library" || choices) return;
    Promise.all([getArtistForms(), getFormLibrary()])
      .then(([mine, library]) => {
        const own: ApiForm[] = mine.data?.forms ?? [];
        // the artist's version wins over the library original
        const byRoot = new Map<string, Choice>();
        for (const form of own) {
          byRoot.set(rootOf(form), {
            form,
            mine: !!form.artistId,
          });
        }
        for (const form of library.data?.forms ?? []) {
          if (!byRoot.has(form.id)) byRoot.set(form.id, { form, mine: false });
        }
        setChoices(
          Array.from(byRoot.values()).sort(
            (a, b) =>
              Number(b.mine) - Number(a.mine) ||
              a.form.title.localeCompare(b.form.title),
          ),
        );
      })
      .catch(() => setLoadError("Couldn't load the forms. Please try again."));
  }, [view, choices]);

  const onService = useMemo(() => new Set(attached.map(rootOf)), [attached]);

  const shown = (choices ?? []).filter(
    ({ form }) =>
      // ones just added stay, marked Added
      (!onService.has(rootOf(form)) || added.has(rootOf(form))) &&
      (typeFilter === "all" || form.type === typeFilter) &&
      (!search.trim() ||
        form.title.toLowerCase().includes(search.trim().toLowerCase())),
  );

  const add = async (form: ApiForm) => {
    setAdding(form.id);
    setError("");
    try {
      await addServiceToForm(form.id, service.id);
      setAdded((prev) => new Set(prev).add(rootOf(form)));
      onAdded();
    } catch (err) {
      setError(apiMessage(err, `Couldn't add "${form.title}". Please try again.`));
    } finally {
      setAdding(null);
    }
  };

  const build = (mode: "scratch" | "scan") =>
    navigate(`/forms/new?mode=${mode}&service=${service.id}`);

  return (
    <div className="service-forms-modal" role="dialog" aria-modal="true" aria-labelledby="add-form-title">
      <div className="service-forms-modal__overlay" onClick={onClose} />
      <div className="service-forms-modal__content">
        <button type="button" className="service-forms-modal__close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
        <h2 id="add-form-title">Add a form to {service.service}</h2>

        {view === "choose" && (
          <div className="service-forms-modal__choices">
            <button type="button" onClick={() => setView("library")}>
              <BookOpen size={22} aria-hidden="true" />
              <strong>Choose from our forms</strong>
              <span>Consent, aftercare and pre-care forms ready to use, plus your own.</span>
            </button>
            <button type="button" onClick={() => build("scan")}>
              <ScanLine size={22} aria-hidden="true" />
              <strong>Scan a paper form</strong>
              <span>Take photos of the form you use now; we turn it into a digital one.</span>
            </button>
            <button type="button" onClick={() => build("scratch")}>
              <FilePlus2 size={22} aria-hidden="true" />
              <strong>Start from scratch</strong>
              <span>Write your own questions, checkboxes and signature line.</span>
            </button>
          </div>
        )}

        {view === "library" && (
          <>
            <div className="service-forms-modal__search">
              <Search size={18} aria-hidden="true" />
              <input
                placeholder="Search forms"
                aria-label="Search forms"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="service-forms-modal__filters" role="group" aria-label="Kind of form">
              {TYPE_FILTERS.map((t) => (
                <button
                  type="button"
                  key={t}
                  aria-pressed={typeFilter === t}
                  onClick={() => setTypeFilter(t)}
                >
                  {t === "all" ? "All" : FORM_TYPE_LABELS[t]}
                </button>
              ))}
            </div>

            {error && (
              <p className="service-forms__error" role="alert">
                {error}
              </p>
            )}

            {loadError ? (
              <p className="service-forms__error" role="alert">
                {loadError}
              </p>
            ) : !choices ? (
              <p className="service-forms__muted">Loading forms…</p>
            ) : shown.length === 0 ? (
              <p className="service-forms__muted">
                {search ? `No forms match "${search}".` : "Every form is already on this service."}
              </p>
            ) : (
              <ul className="service-forms-modal__list" aria-label="Forms you can add">
                {shown.map(({ form, mine }) => {
                  const done = added.has(rootOf(form));
                  return (
                    <li key={form.id}>
                      <div className="service-forms-modal__info">
                        <span className="service-forms-modal__name">{form.title}</span>
                        <span className="service-forms__type">{FORM_TYPE_LABELS[form.type] ?? form.type}</span>
                        {mine && (
                          <span className="service-forms__badge">
                            {isOwnForm(form) ? "Yours" : "Edited by you"}
                          </span>
                        )}
                      </div>
                      <a
                        href={`/forms/preview/${encodeURIComponent(form.id)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="service-forms__link"
                      >
                        Preview
                      </a>
                      <button
                        type="button"
                        className="service-forms__add"
                        disabled={done || adding !== null}
                        onClick={() => add(form)}
                        aria-label={done ? `${form.title} added` : `Add ${form.title}`}
                      >
                        {done ? (
                          <>
                            <Check size={16} /> Added
                          </>
                        ) : adding === form.id ? (
                          "Adding…"
                        ) : (
                          "Add"
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="service-forms-modal__footer">
              <button type="button" className="service-forms__secondary" onClick={() => setView("choose")}>
                Back
              </button>
              <button type="button" className="service-forms__primary" onClick={onClose}>
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddFormToServiceModal;

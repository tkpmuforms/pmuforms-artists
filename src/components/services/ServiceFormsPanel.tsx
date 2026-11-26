import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Service } from "../../redux/types";
import {
  type ApiForm,
  FORM_TYPE_LABELS,
  apiMessage,
  getFormsForService,
  isOwnForm,
  removeServiceFromForm,
} from "../../services/formBuilderServices";
import AddFormToServiceModal from "./AddFormToServiceModal";
import "./service-forms.scss";

const TYPE_ORDER = { consent: 0, "pre-care": 1, care: 2 } as const;

/** The forms clients booking one service get, and adding or removing them. */
const ServiceFormsPanel: React.FC<{ service: Service }> = ({ service }) => {
  const [forms, setForms] = useState<ApiForm[] | null>(null);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => {
    getFormsForService(service.id)
      .then(({ data }) => {
        setForms(
          [...(data.forms ?? [])].sort(
            (a, b) =>
              (TYPE_ORDER[a.type] ?? 9) - (TYPE_ORDER[b.type] ?? 9) ||
              a.title.localeCompare(b.title),
          ),
        );
        setError("");
      })
      .catch(() => setError("Couldn't load the forms for this service."));
  }, [service.id]);

  useEffect(load, [load]);

  const remove = async (form: ApiForm) => {
    setRemoving(true);
    try {
      await removeServiceFromForm(form.id, service.id);
      setConfirming(null);
      load();
    } catch (err) {
      setError(apiMessage(err, "Couldn't remove the form. Please try again."));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="service-forms">
      {error && (
        <p className="service-forms__error" role="alert">
          {error}
        </p>
      )}

      {!forms && !error && <p className="service-forms__muted">Loading forms…</p>}

      {forms && forms.length === 0 && (
        <p className="service-forms__muted">
          No forms yet. Clients booking {service.service} won't get any forms
          until you add one.
        </p>
      )}

      {forms && forms.length > 0 && (
        <ul className="service-forms__list" aria-label={`Forms for ${service.service}`}>
          {forms.map((form) => (
            <li key={form.id} className="service-forms__item">
              {confirming === form.id ? (
                <div className="service-forms__confirm">
                  <span>
                    Remove <strong>{form.title}</strong> from {service.service}?
                    Clients booking it won't get this form. It stays on any other
                    services.
                  </span>
                  <div>
                    <button
                      type="button"
                      className="service-forms__danger"
                      disabled={removing}
                      onClick={() => remove(form)}
                    >
                      {removing ? "Removing…" : "Remove"}
                    </button>
                    <button
                      type="button"
                      className="service-forms__secondary"
                      disabled={removing}
                      onClick={() => setConfirming(null)}
                    >
                      Keep
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="service-forms__info">
                    <span className="service-forms__name">{form.title}</span>
                    <span className="service-forms__type">
                      {FORM_TYPE_LABELS[form.type] ?? form.type}
                    </span>
                    {form.artistId && (
                      <span className="service-forms__badge">
                        {isOwnForm(form) ? "Yours" : "Edited by you"}
                      </span>
                    )}
                  </div>
                  <div className="service-forms__actions">
                    <Link
                      className="service-forms__link"
                      to={`/forms/preview/${encodeURIComponent(form.id)}`}
                    >
                      Preview
                    </Link>
                    <Link
                      className="service-forms__link"
                      to={`/forms/edit/${encodeURIComponent(form.id)}`}
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="service-forms__link service-forms__link--danger"
                      aria-label={`Remove ${form.title}`}
                      onClick={() => setConfirming(form.id)}
                    >
                      Remove
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        className="service-forms__add-form"
        onClick={() => setAdding(true)}
      >
        <Plus size={16} /> Add a form
      </button>

      {adding && (
        <AddFormToServiceModal
          service={service}
          attached={forms ?? []}
          onAdded={load}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  );
};

export default ServiceFormsPanel;

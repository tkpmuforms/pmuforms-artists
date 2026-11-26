import { ChevronDown, ListPlus, Pencil, Plus, Trash2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import UpdateServicesModal from "../../components/profile/UpdateServicesModal";
import ServiceFormsPanel from "../../components/services/ServiceFormsPanel";
import useAuth from "../../context/useAuth";
import { setUser } from "../../redux/auth";
import { Service } from "../../redux/types";
import { getAuthMe } from "../../services/artistServices";
import {
  apiMessage,
  createCustomService,
  deleteCustomService,
  renameCustomService,
} from "../../services/formBuilderServices";
import "./services-page.scss";

/** same as the API: services an artist creates are numbered from here */
const CUSTOM_SERVICE_ID_BASE = 100_000;
const isCustom = (service: Service) =>
  service.custom || Number(service.id) >= CUSTOM_SERVICE_ID_BASE;

const ServicesPage: React.FC = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const [params] = useSearchParams();
  const [showUpdateServices, setShowUpdateServices] = useState(false);
  const [open, setOpen] = useState<number | null>(() => {
    const id = Number(params.get("open"));
    return params.get("open") && Number.isFinite(id) ? id : null;
  });
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [renaming, setRenaming] = useState<number | null>(null);
  const [renameTo, setRenameTo] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const registeredServices: Service[] = user?.services || [];

  const refreshUser = async () => {
    try {
      const response = await getAuthMe();
      dispatch(setUser(response?.data?.user));
    } catch {
      // the list catches up on the next load
    }
  };

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) {
      setFormError("Give the service a name.");
      return;
    }
    setBusy(true);
    setFormError("");
    try {
      const { data } = await createCustomService(name);
      await refreshUser();
      toast.success(`${data.service.service} added. Now add its forms.`);
      setCreating(false);
      setNewName("");
      setOpen(data.service.id);
    } catch (err) {
      setFormError(apiMessage(err, "Couldn't add the service. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const rename = async (event: React.FormEvent, service: Service) => {
    event.preventDefault();
    const name = renameTo.trim();
    if (!name) return;
    setBusy(true);
    try {
      await renameCustomService(service.id, name);
      await refreshUser();
      setRenaming(null);
    } catch (err) {
      toast.error(apiMessage(err, "Couldn't rename the service."));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (service: Service) => {
    setBusy(true);
    try {
      await deleteCustomService(service.id);
      await refreshUser();
      toast.success(`${service.service} removed`);
      setDeleting(null);
      if (open === service.id) setOpen(null);
    } catch (err) {
      toast.error(apiMessage(err, "Couldn't remove the service."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="services-page">
      <div className="services-page__container">
        <div className="services-page__header">
          <p>
            Each service has the forms clients get when they book it. Open a
            service to add forms from our library, build your own, or scan the
            paper form you use now.
          </p>
        </div>

        <div className="services-page__toolbar">
          <button className="edit-button" onClick={() => setShowUpdateServices(true)}>
            <ListPlus size={16} />
            {registeredServices.length > 0 ? "Choose from our list" : "Add Services"}
          </button>
          <button
            className="services-page__outline-btn"
            onClick={() => {
              setCreating((v) => !v);
              setFormError("");
            }}
            aria-expanded={creating}
          >
            <Plus size={16} />
            Create your own service
          </button>
        </div>

        {creating && (
          <form className="services-page__create" onSubmit={create}>
            <label htmlFor="new-service-name">Service name</label>
            <div className="services-page__create-row">
              <input
                id="new-service-name"
                value={newName}
                maxLength={80}
                placeholder="e.g. Brow Touch-Up, Freckles, Hairline Strokes"
                onChange={(e) => {
                  setNewName(e.target.value);
                  setFormError("");
                }}
                autoFocus
              />
              <button type="submit" className="services-page__primary" disabled={busy}>
                {busy ? "Adding…" : "Add service"}
              </button>
            </div>
            {formError && (
              <p className="services-page__error" role="alert">
                {formError}
              </p>
            )}
            <p className="services-page__small">
              Only you see services you create. Clients can book them like any
              other service.
            </p>
          </form>
        )}

        <div className="services-page__content">
          {registeredServices.length === 0 ? (
            <div className="no-services">
              No services added yet. Choose from our list or create your own.
            </div>
          ) : (
            <ul className="services-page__list" aria-label="Your services">
              {registeredServices.map((service) => {
                const expanded = open === service.id;
                const custom = isCustom(service);
                const panelId = `service-panel-${service.id}`;
                return (
                  <li key={service.id} className="services-page__service">
                    {renaming === service.id ? (
                      <form
                        className="services-page__rename"
                        onSubmit={(e) => rename(e, service)}
                      >
                        <input
                          aria-label="New name"
                          value={renameTo}
                          maxLength={80}
                          onChange={(e) => setRenameTo(e.target.value)}
                          autoFocus
                        />
                        <button type="submit" className="services-page__primary" disabled={busy}>
                          Save
                        </button>
                        <button
                          type="button"
                          className="services-page__text-btn"
                          onClick={() => setRenaming(null)}
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        className="services-page__service-head"
                        aria-expanded={expanded}
                        aria-controls={panelId}
                        onClick={() => setOpen(expanded ? null : service.id)}
                      >
                        <span className="services-page__service-name">
                          {service.service}
                          {custom && <span className="services-page__badge">Yours</span>}
                        </span>
                        <span className="services-page__service-hint">
                          {expanded ? "Hide forms" : "Forms"}
                          <ChevronDown
                            size={18}
                            className={expanded ? "services-page__chevron--open" : ""}
                          />
                        </span>
                      </button>
                    )}

                    {expanded && (
                      <div id={panelId} className="services-page__panel">
                        <ServiceFormsPanel service={service} />

                        {custom && renaming !== service.id && (
                          <div className="services-page__custom-actions">
                            {deleting === service.id ? (
                              <div className="services-page__confirm">
                                <span>
                                  Stop offering {service.service}? Past
                                  appointments keep it, and its forms stay on
                                  your Forms page.
                                </span>
                                <button
                                  type="button"
                                  className="services-page__danger"
                                  disabled={busy}
                                  onClick={() => remove(service)}
                                >
                                  Remove service
                                </button>
                                <button
                                  type="button"
                                  className="services-page__text-btn"
                                  onClick={() => setDeleting(null)}
                                >
                                  Keep
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="services-page__text-btn"
                                  onClick={() => {
                                    setRenaming(service.id);
                                    setRenameTo(service.service);
                                  }}
                                >
                                  <Pencil size={14} /> Rename
                                </button>
                                <button
                                  type="button"
                                  className="services-page__text-btn services-page__text-btn--danger"
                                  onClick={() => setDeleting(service.id)}
                                >
                                  <Trash2 size={14} /> Remove service
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {showUpdateServices && (
        <UpdateServicesModal
          onClose={() => setShowUpdateServices(false)}
          onGoBack={() => setShowUpdateServices(false)}
          noGoBack={true}
        />
      )}
    </div>
  );
};

export default ServicesPage;

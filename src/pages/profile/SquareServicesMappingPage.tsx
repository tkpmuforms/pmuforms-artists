"use client";

import { BriefcaseBusiness, ChevronDown } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { LoadingSmall } from "../../components/loading/Loading";
import useAuth from "../../context/useAuth";
import { Service } from "../../redux/types";
import {
  getSquareMappings,
  getSquareServices,
  saveSquareMappings,
  SquareMappingRequest,
} from "../../services/artistServices";
import "./square-services-mapping.scss";
import "../../components/inventory/inventory.scss";
import SubscriptionModal from "../../components/dashboard/SubScriptionModal";
import { isArtistSubscribed } from "../../utils/subscriptionUtils";
import { getApiErrorMessage } from "../../utils/apiError";

// Shape returned by GET /api/integrations/square/services
// (see pmuforms-api src/integrations/square/square.mapper.ts)
interface RawSquareService {
  externalServiceId?: string;
  externalVariationId?: string;
  name?: string;
  description?: string | null;
  price?: { amount?: number; currency?: string } | null;
  durationMinutes?: number | null;
}

interface SquareService {
  // Unique per row: a Square item can have several variations.
  id: string;
  serviceId: string;
  variationId: string;
  name: string;
  description?: string;
  price?: number;
  currency: string;
  durationMinutes?: number;
}

interface MappingState {
  pmuServiceId: number | null;
  enabled: boolean;
}

export interface SquareServiceMapping {
  squareServiceId: string;
  squareVariationId: string;
  pmuServiceId: number | null;
  enabled: boolean;
}

export interface SquareServiceMappingPayload {
  mappings: SquareServiceMapping[];
}

// New rows start switched on, so every Square service has to be either
// mapped or deliberately switched off before saving.
const DEFAULT_MAPPING: MappingState = { pmuServiceId: null, enabled: true };

const normalizeSquareServices = (data: unknown): SquareService[] => {
  const list: RawSquareService[] = Array.isArray(data)
    ? data
    : Array.isArray((data as { services?: unknown })?.services)
      ? (data as { services: RawSquareService[] }).services
      : [];

  return list
    .filter((raw) => raw?.externalVariationId || raw?.externalServiceId)
    .map((raw) => {
      const serviceId = String(
        raw.externalServiceId ?? raw.externalVariationId,
      );
      const variationId = String(raw.externalVariationId ?? serviceId);
      return {
        id: variationId,
        serviceId,
        variationId,
        name: raw.name || "Untitled service",
        description: raw.description || undefined,
        price:
          typeof raw.price?.amount === "number"
            ? raw.price.amount / 100
            : undefined,
        currency: raw.price?.currency || "USD",
        durationMinutes:
          typeof raw.durationMinutes === "number"
            ? raw.durationMinutes
            : undefined,
      };
    });
};

const formatPrice = (price: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
    }).format(price);
  } catch {
    return `${price} ${currency}`;
  }
};

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
  if (mins > 0) parts.push(`${mins} minute${mins > 1 ? "s" : ""}`);
  return parts.join(" ");
};

const SquareServicesMapping: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const registeredServices: Service[] = user?.services || [];

  const [squareServices, setSquareServices] = useState<SquareService[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mappings, setMappings] = useState<Record<string, MappingState>>({});
  const [showErrors, setShowErrors] = useState(false);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const registeredIds = new Set(
      (user?.services || []).map((service) => service.id),
    );

    Promise.all([getSquareServices(), getSquareMappings()])
      .then(([servicesResponse, mappingsResponse]) => {
        const services = normalizeSquareServices(servicesResponse?.data);
        const saved: SquareMappingRequest[] =
          mappingsResponse?.data?.mappings ?? [];
        const savedByVariation = new Map(
          saved.map((mapping) => [mapping.squareVariationId, mapping]),
        );

        // Once the artist has saved, rows missing from the saved set were
        // deliberately switched off (unmapped rows are not stored), so they
        // load switched off instead of demanding a mapping again.
        const hasSaved = saved.length > 0;
        const initial: Record<string, MappingState> = {};
        for (const service of services) {
          const match = savedByVariation.get(service.variationId);
          if (match) {
            const stillOffered = registeredIds.has(match.pmuServiceId);
            initial[service.id] = {
              pmuServiceId: stillOffered ? match.pmuServiceId : null,
              enabled: match.enabled,
            };
          } else if (hasSaved) {
            initial[service.id] = { pmuServiceId: null, enabled: false };
          }
        }

        setSquareServices(services);
        setMappings(initial);
        setBusinessName(
          servicesResponse?.data?.integration?.externalAccountName || null,
        );
      })
      .catch((error) => {
        console.error("Error loading Square mappings:", error);
        setLoadError(
          getApiErrorMessage(
            error,
            "We couldn't load your Square services. Make sure Square is connected, then try again.",
          ),
        );
      })
      .finally(() => setLoading(false));
    // user.services only seeds the initial state; edits are kept afterwards
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const payload: SquareServiceMappingPayload = useMemo(
    () => ({
      mappings: squareServices.map((service) => {
        const mapping = mappings[service.id] || DEFAULT_MAPPING;
        return {
          squareServiceId: service.serviceId,
          squareVariationId: service.variationId,
          pmuServiceId: mapping.pmuServiceId,
          enabled: mapping.enabled,
        };
      }),
    }),
    [squareServices, mappings],
  );

  const isInvalid = (mapping: SquareServiceMapping) =>
    mapping.enabled && mapping.pmuServiceId === null;

  const unmappedCount = payload.mappings.filter(isInvalid).length;
  const mappedCount = payload.mappings.filter(
    (mapping) => mapping.enabled && mapping.pmuServiceId !== null,
  ).length;

  const handleMappingChange = (squareServiceId: string, value: string) => {
    const pmuServiceId = value === "" ? null : Number(value);
    setMappings((prev) => {
      const current = prev[squareServiceId] || DEFAULT_MAPPING;
      return {
        ...prev,
        [squareServiceId]: {
          pmuServiceId,
          enabled:
            current.pmuServiceId === null && pmuServiceId !== null
              ? true
              : current.enabled,
        },
      };
    });
  };

  const handleToggle = (squareServiceId: string) => {
    setMappings((prev) => {
      const current = prev[squareServiceId] || DEFAULT_MAPPING;
      return {
        ...prev,
        [squareServiceId]: { ...current, enabled: !current.enabled },
      };
    });
  };

  const handleSave = () => {
    if (saving) return;

    if (registeredServices.length === 0) {
      toast.error("Add your services first, then map them to Square.");
      return;
    }

    if (unmappedCount > 0) {
      setShowErrors(true);
      toast.error(
        `Map ${unmappedCount} more service${
          unmappedCount > 1 ? "s" : ""
        }, or switch ${unmappedCount > 1 ? "them" : "it"} off.`,
      );
      const firstInvalid = payload.mappings.find(isInvalid);
      if (firstInvalid) {
        document
          .getElementById(`square-mapping-${firstInvalid.squareVariationId}`)
          ?.focus();
      }
      return;
    }

    if (mappedCount === 0) {
      toast.error("Map at least one Square service before saving.");
      return;
    }

    setShowErrors(false);

    // Only rows with a chosen service are stored; switched-off rows without
    // one are simply left out.
    const request: SquareMappingRequest[] = payload.mappings
      .filter((mapping) => mapping.pmuServiceId !== null)
      .map((mapping) => ({
        pmuServiceId: mapping.pmuServiceId as number,
        squareServiceId: mapping.squareServiceId,
        squareVariationId: mapping.squareVariationId,
        enabled: mapping.enabled,
      }));

    setSaving(true);
    saveSquareMappings(request)
      .then(() => {
        toast.success("Service mappings saved");
      })
      .catch((error) => {
        console.error("Error saving Square mappings:", error);
        toast.error(
          getApiErrorMessage(
            error,
            "Could not save your mappings. Please try again.",
          ),
        );
      })
      .finally(() => setSaving(false));
  };

  const renderBody = () => {
    if (loading) {
      return <LoadingSmall height="300px" />;
    }

    if (loadError) {
      return (
        <div className="square-mapping__empty">
          <p>{loadError}</p>
          <button
            type="button"
            className="square-mapping__secondary-btn"
            onClick={() => navigate("/integrations")}
          >
            Back to Integrations
          </button>
        </div>
      );
    }

    if (squareServices.length === 0) {
      return (
        <div className="square-mapping__empty">
          <p>No appointment services were found in your Square account.</p>
        </div>
      );
    }

    return (
      <>
        <div className="square-mapping__rows">
          {squareServices.map((service, index) => {
            const mapping = payload.mappings[index];
            const hasError = showErrors && isInvalid(mapping);
            const meta = [
              service.price !== undefined
                ? formatPrice(service.price, service.currency)
                : null,
              service.durationMinutes
                ? formatDuration(service.durationMinutes)
                : null,
            ].filter(Boolean);

            return (
              <div
                key={service.id}
                className={`square-mapping__row ${
                  hasError ? "square-mapping__row--error" : ""
                } ${!mapping.enabled ? "square-mapping__row--off" : ""}`}
              >
                <div className="square-mapping__service">
                  <h3>{service.name}</h3>
                  {service.description && (
                    <p className="square-mapping__service-description">
                      {service.description}
                    </p>
                  )}
                  {meta.length > 0 && (
                    <p className="square-mapping__service-meta">
                      {meta.join(" · ")}
                    </p>
                  )}
                </div>

                <div className="square-mapping__field">
                  <label htmlFor={`square-mapping-${service.id}`}>
                    Maps to
                  </label>
                  <div
                    className={`square-mapping__select-wrap ${
                      mapping.pmuServiceId === null
                        ? "square-mapping__select-wrap--empty"
                        : ""
                    } ${hasError ? "square-mapping__select-wrap--error" : ""}`}
                  >
                    {mapping.pmuServiceId !== null && (
                      <span
                        className="square-mapping__select-dot"
                        aria-hidden="true"
                      />
                    )}
                    <select
                      id={`square-mapping-${service.id}`}
                      className="square-mapping__select"
                      value={
                        mapping.pmuServiceId === null
                          ? ""
                          : String(mapping.pmuServiceId)
                      }
                      onChange={(event) =>
                        handleMappingChange(service.id, event.target.value)
                      }
                      aria-invalid={hasError}
                    >
                      <option value="">
                        {mapping.enabled
                          ? "Select a service"
                          : "Optional - No Mapping"}
                      </option>
                      {registeredServices.map((pmuService) => (
                        <option key={pmuService.id} value={pmuService.id}>
                          {pmuService.service}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="square-mapping__select-chevron"
                      size={18}
                      aria-hidden="true"
                    />
                  </div>
                  {hasError && (
                    <span className="square-mapping__error" role="alert">
                      Choose a service, or switch this off to skip it.
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={mapping.enabled}
                  aria-label={`Sync bookings for ${service.name}`}
                  className={`square-mapping__toggle ${
                    mapping.enabled ? "square-mapping__toggle--on" : ""
                  }`}
                  onClick={() => handleToggle(service.id)}
                >
                  <span className="square-mapping__toggle-knob" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="square-mapping__footer">
          <p
            className={`square-mapping__summary ${
              unmappedCount > 0 ? "square-mapping__summary--pending" : ""
            }`}
            aria-live="polite"
          >
            {unmappedCount > 0
              ? `${unmappedCount} service${
                  unmappedCount > 1 ? "s" : ""
                } still need${unmappedCount > 1 ? "" : "s"} a mapping`
              : `All set · ${mappedCount} of ${squareServices.length} services mapped`}
          </p>
          <button
            type="button"
            className="square-mapping__save-btn"
            onClick={handleSave}
            aria-disabled={unmappedCount > 0 || mappedCount === 0 || saving}
            aria-busy={saving}
          >
            {saving ? "Saving..." : "Save Mapping"}
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="square-mapping">
      <div className="square-mapping__banner">
        <div className="square-mapping__banner-icon" aria-hidden="true">
          <BriefcaseBusiness size={28} />
        </div>
        <div className="square-mapping__banner-body">
          <span className="square-mapping__banner-label">Square Business</span>
          {businessName && (
            <h2 className="square-mapping__banner-title">{businessName}</h2>
          )}
          <p>
            Map each of your registered services to a Square Appointment. This
            helps us send the right consent forms to your customers when they
            book.
          </p>
        </div>
      </div>

      {showHelp && (
        <div className="square-mapping__help" role="note">
          <p>
            <strong>How it works:</strong> each row is a service from your
            Square account. Pick which of your registered services it matches
            and turn it on. When a client books that Square service, we create
            the client and appointment in PMU Forms and send the consent form
            for the matched service. Turned-off services are ignored.
          </p>
        </div>
      )}

      <h2 className="square-mapping__section-title">My PMU Forms services</h2>
      {registeredServices.length > 0 ? (
        <div className="square-mapping__chips">
          {registeredServices.map((service) => (
            <span key={service.id} className="square-mapping__chip">
              <span className="square-mapping__chip-dot" />
              {service.service}
            </span>
          ))}
        </div>
      ) : (
        <div className="square-mapping__empty square-mapping__empty--inline">
          <p>You have no registered services yet.</p>
          <button
            type="button"
            className="square-mapping__secondary-btn"
            onClick={() => navigate("/services")}
          >
            Add Services
          </button>
        </div>
      )}

      <div className="square-mapping__section-row">
        <h2 className="square-mapping__section-title">
          My Square appointment services
        </h2>
        <button
          type="button"
          className="square-mapping__link-btn"
          onClick={() => setShowHelp((prev) => !prev)}
          aria-expanded={showHelp}
        >
          {showHelp ? "Hide help" : "Learn more"}
        </button>
      </div>
      {renderBody()}
    </div>
  );
};

/** Matching services is part of the paid plan. */
const SquareServicesMappingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showPlans, setShowPlans] = useState(false);
  if (isArtistSubscribed(user)) return <SquareServicesMapping />;
  return (
    <div className="square-mapping-page">
      <div className="inv-card inv-gate">
        <h2>Match your Square services</h2>
        <p>
          Matching your Square services to your PMU Forms services is part of a
          PMU Forms subscription.
        </p>
        <button
          className="inv-btn inv-btn--primary"
          onClick={() => setShowPlans(true)}
        >
          See plans
        </button>{" "}
        <button className="inv-btn" onClick={() => navigate("/integrations")}>
          Back to Integrations
        </button>
      </div>
      {showPlans && <SubscriptionModal onClose={() => setShowPlans(false)} />}
    </div>
  );
};

export default SquareServicesMappingPage;

"use client";

import { Calendar, Search, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppointmentCard from "../../components/dashboard/AppointmentCard";
import AppointmentActionsMenu from "../../components/clients/appointments/AppointmentActionsMenu";
import { useAppointmentActions } from "../../components/clients/appointments/useAppointmentActions";
import { LoadingSmall } from "../../components/loading/Loading";
import useAuth from "../../context/useAuth";
import {
  Appointment as AppointmentType,
  Service,
} from "../../redux/types";
import {
  type AppointmentFilters,
  getArtistAppointmentsPaginated,
  getCustomerById,
} from "../../services/artistServices";
import { formatAppointmentTime } from "../../utils/utils";
import "./appointment.scss";

interface AppointmentsResponse {
  metadata: {
    total: number;
    currentPage: number;
    perPage: number;
    lastPage: number;
    firstPage: number;
  };
  appointments: AppointmentType[];
}

type When = "all" | "upcoming" | "past";
type Status = "" | "pending" | "signed" | "completed";

const WHEN_OPTIONS: [When, string][] = [
  ["all", "All"],
  ["upcoming", "Upcoming"],
  ["past", "Past"],
];

const STATUS_OPTIONS: [Status, string][] = [
  ["", "Any status"],
  ["pending", "Forms pending"],
  ["signed", "Forms signed"],
  ["completed", "Completed"],
];

const perPage = 12;

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
};

/** what the API filters on, from what's chosen on the page */
const toApiFilters = (
  search: string,
  when: When,
  status: Status,
  service: string,
): AppointmentFilters => ({
  search: search.trim() || undefined,
  status: status || undefined,
  service: service ? Number(service) : undefined,
  ...(when === "upcoming"
    ? { from: startOfToday(), sort: "asc" as const }
    : when === "past"
      ? { to: startOfToday() }
      : {}),
});

const statusOf = (appointment: AppointmentType) =>
  appointment.completedAt
    ? { label: "Completed", tone: "completed" as const }
    : appointment.signed
      ? { label: "Forms signed", tone: "signed" as const }
      : { label: "Forms pending", tone: "pending" as const };

const Appointment: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const services: Service[] = user?.services || [];
  // filters live in the address, so Back from a client keeps them
  const [params, setParams] = useSearchParams();
  const when = (["upcoming", "past"].includes(params.get("when") ?? "")
    ? params.get("when")
    : "all") as When;
  const status = (STATUS_OPTIONS.some(([v]) => v && v === params.get("status"))
    ? params.get("status")
    : "") as Status;
  const service = params.get("service") ?? "";
  const query = params.get("q") ?? "";
  const currentPage = Math.max(1, Number(params.get("page")) || 1);

  const [searchText, setSearchText] = useState(query);
  const [appointments, setAppointments] = useState<AppointmentType[]>([]);
  const [customers, setCustomers] = useState<
    Record<string, { name: string; avatar?: string }>
  >({});
  const [loading, setLoading] = useState(true);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [metadata, setMetadata] = useState({ total: 0, lastPage: 1 });
  // only the newest request may show its results
  const requestId = useRef(0);

  // the same ⋯ menu as the client's appointments
  const { handlersFor, modals } = useAppointmentActions({
    onDeleted: (appointmentId) => {
      setAppointments((prev) => prev.filter((apt) => apt.id !== appointmentId));
      setMetadata((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    },
    onCompleted: (appointmentId, completedAt) =>
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId ? { ...apt, completedAt } : apt,
        ),
      ),
  });

  const update = (changes: Record<string, string>, keepPage = false) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(changes)) {
          if (value && !(key === "when" && value === "all")) next.set(key, value);
          else next.delete(key);
        }
        if (!keepPage) next.delete("page");
        return next;
      },
      { replace: true },
    );
  };

  // search as they type, after a short pause
  useEffect(() => {
    if (searchText.trim() === query.trim()) return;
    const timer = setTimeout(() => update({ q: searchText.trim() }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  const fetchCustomersData = async (appointmentsList: AppointmentType[]) => {
    // the API sends names; look up any it didn't (older API)
    const uniqueCustomerIds = [
      ...new Set(
        appointmentsList
          .filter((apt) => !apt.customer?.info?.client_name)
          .map((apt) => apt.customerId),
      ),
    ].filter((id) => id && !customers[id]) as string[];

    if (uniqueCustomerIds.length === 0) return;

    try {
      const customerResponses = await Promise.all(
        uniqueCustomerIds.map((customerId) =>
          getCustomerById(customerId).catch((error) => {
            console.error(`Error fetching customer ${customerId}:`, error);
            return null;
          }),
        ),
      );
      const customerMap = customerResponses.reduce(
        (acc, response, index) => {
          const customer = response?.data?.customer;
          if (customer) {
            acc[uniqueCustomerIds[index]] = {
              name: customer.info?.client_name || "Unknown Client",
              avatar: customer.info?.avatar_url,
            };
          }
          return acc;
        },
        {} as Record<string, { name: string; avatar?: string }>,
      );
      setCustomers((prev) => ({ ...prev, ...customerMap }));
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    getArtistAppointmentsPaginated(
      currentPage,
      perPage,
      toApiFilters(query, when, status, service),
    )
      .then((response) => {
        if (id !== requestId.current) return;
        const data: AppointmentsResponse = response.data;
        setAppointments(data?.appointments ?? []);
        setMetadata({
          total: data?.metadata?.total ?? 0,
          lastPage: data?.metadata?.lastPage ?? 1,
        });
        void fetchCustomersData(data?.appointments ?? []);
      })
      .catch((error) => {
        if (id !== requestId.current) return;
        console.error("Error fetching appointments:", error);
        toast.error("Failed to fetch appointments");
      })
      .finally(() => {
        if (id !== requestId.current) return;
        setLoading(false);
        setLoadedOnce(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, query, when, status, service]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= metadata.lastPage) {
      update({ page: String(page) }, true);
    }
  };

  const openForms = (appointment: AppointmentType) =>
    navigate(
      `/clients/${appointment.customerId}/appointments/${appointment.id}/forms`,
      {
        // a real name saves the forms page a lookup
        state: {
          clientName:
            appointment.customer?.info?.client_name ||
            customers[appointment.customerId]?.name,
        },
      },
    );

  const nameOf = (appointment: AppointmentType) =>
    appointment.customer?.info?.client_name ||
    customers[appointment.customerId]?.name ||
    "Unknown Client";

  const avatarOf = (appointment: AppointmentType) => {
    const avatar =
      appointment.customer?.info?.avatar_url ||
      customers[appointment.customerId]?.avatar;
    if (avatar) return avatar;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      nameOf(appointment),
    )}&background=A858F0&color=fff&size=40`;
  };

  const filtering = !!(query || status || service || when !== "all");

  const clearFilters = () => {
    setSearchText("");
    setParams(new URLSearchParams(), { replace: true });
  };

  const renderPagination = () => {
    if (metadata.lastPage <= 1) return null;
    const atStart = currentPage === 1;
    const atEnd = currentPage === metadata.lastPage;

    return (
      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-arrow"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={atStart}
          aria-label="Previous page"
          style={{ opacity: atStart ? 0.4 : 1 }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>
        <span className="pagination-text">
          Page {currentPage} of {metadata.lastPage}
        </span>
        <button
          type="button"
          className="pagination-arrow"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={atEnd}
          aria-label="Next page"
          style={{ opacity: atEnd ? 0.4 : 1 }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
          </svg>
        </button>
      </div>
    );
  };

  const countText = loading && !loadedOnce
    ? "Loading…"
    : filtering
      ? `${metadata.total} matching appointment${metadata.total === 1 ? "" : "s"}`
      : `Total: ${metadata.total} appointment${metadata.total === 1 ? "" : "s"}`;

  return (
    <div className="appointments">
      <div className="appointments__header">
        <div className="appointments__title-section">
          <h1>All Appointments</h1>
          <p aria-live="polite">{countText}</p>
        </div>

        <div className="appointments__actions">
          <div className="appointments__search">
            <Search size={20} />
            <input
              type="search"
              placeholder="Search by client or service"
              aria-label="Search by client or service"
              value={searchText}
              maxLength={100}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="appointments__filters" role="group" aria-label="Filters">
        <div className="appointments__segmented" role="radiogroup" aria-label="When">
          {WHEN_OPTIONS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={when === value}
              className={when === value ? "is-active" : ""}
              onClick={() => update({ when: value })}
            >
              {label}
            </button>
          ))}
        </div>

        <select
          aria-label="Status"
          value={status}
          onChange={(e) => update({ status: e.target.value })}
        >
          {STATUS_OPTIONS.map(([value, label]) => (
            <option key={value || "any"} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          aria-label="Service"
          value={service}
          onChange={(e) => update({ service: e.target.value })}
        >
          <option value="">All services</option>
          {services.map((s) => (
            <option key={s.id} value={String(s.id)}>
              {s.service}
            </option>
          ))}
        </select>

        {filtering && (
          <button
            type="button"
            className="appointments__clear"
            onClick={clearFilters}
          >
            <X size={16} /> Clear filters
          </button>
        )}
      </div>

      <div
        className={`appointments__content${loading && loadedOnce ? " is-refreshing" : ""}`}
        aria-busy={loading}
      >
        {loading && !loadedOnce ? (
          <div className="appointments__loading">
            <LoadingSmall />
          </div>
        ) : appointments.length === 0 ? (
          <div className="appointments__empty">
            <Calendar size={48} />
            {filtering ? (
              <>
                <h3>No appointments match</h3>
                <p>Try another name or service, or clear the filters.</p>
              </>
            ) : (
              <>
                <h3>No appointments found</h3>
                <p>You haven't scheduled any appointments yet</p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="appointments__grid">
              {appointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  name={nameOf(appointment)}
                  avatar={avatarOf(appointment)}
                  time={formatAppointmentTime(appointment.date)}
                  services={(appointment.serviceDetails ?? []).map(
                    (s) => s.service,
                  )}
                  status={statusOf(appointment)}
                  onViewForms={() => openForms(appointment)}
                  actions={
                    <AppointmentActionsMenu
                      signed={appointment.signed}
                      completedAt={appointment.completedAt}
                      label={`${nameOf(appointment)}'s appointment`}
                      onViewForms={() => openForms(appointment)}
                      {...handlersFor({
                        appointmentId: appointment.id,
                        customerId: appointment.customerId,
                        clientName: nameOf(appointment),
                        services: appointment.serviceDetails,
                      })}
                    />
                  }
                />
              ))}
            </div>
            {renderPagination()}
          </>
        )}
      </div>
      {modals}
    </div>
  );
};

export default Appointment;

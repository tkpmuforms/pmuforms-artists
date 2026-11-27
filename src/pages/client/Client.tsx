import { Plus, Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import { CircularProgress } from "@mui/material";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AddClientModal from "../../components/clients/AddClientModal";
import ClientCard from "../../components/clients/ClientCard";
import ClientSearchModal from "../../components/clients/ClientSearchModal";
import { LoadingSmall } from "../../components/loading/Loading";
import PlanUsageMeter from "../../components/plans/PlanUsageMeter";
import { Client, CustomerResponse } from "../../redux/types";
import {
  ClientActivity,
  ClientFilters,
  ClientSort,
  searchCustomers,
} from "../../services/artistServices";
import useAuth from "../../context/useAuth";
import { generateColor, generateInitials } from "../../utils/utils";
import "./clients-page.scss";

const ACTIVITY_OPTIONS: { value: ClientActivity | ""; label: string }[] = [
  { value: "", label: "All clients" },
  { value: "upcoming", label: "Upcoming appointment" },
  { value: "lapsed", label: "Not back in 6+ months" },
  { value: "new", label: "New this month" },
  { value: "never", label: "Never booked" },
  { value: "no-upcoming", label: "Nothing booked" },
];

const SORT_OPTIONS: { value: ClientSort; label: string }[] = [
  { value: "name", label: "Name A–Z" },
  { value: "recent", label: "Newest clients" },
  { value: "last-visit", label: "Last visit" },
  { value: "next", label: "Next appointment" },
];

const ClientsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const services = user?.services ?? [];
  // filters live in the address, so coming back to the page keeps them
  const [params, setParams] = useSearchParams();
  const activity = (ACTIVITY_OPTIONS.find((o) => o.value === params.get("activity"))
    ?.value || undefined) as ClientActivity | undefined;
  const serviceParam = params.get("service");
  const service =
    serviceParam !== null && serviceParam !== "" && !isNaN(Number(serviceParam))
      ? Number(serviceParam)
      : undefined;
  const formsPending = params.get("forms") === "pending";
  const sort: ClientSort =
    SORT_OPTIONS.find((o) => o.value === params.get("sort"))?.value ?? "name";
  const filters: ClientFilters = { activity, service, formsPending, sort };
  const filterKey = JSON.stringify(filters);
  const filtering = !!(activity || service !== undefined || formsPending);
  const setParam = (key: string, value: string) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
    setCurrentPage(1);
  };
  const clearFilters = () => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        ["activity", "service", "forms"].forEach((key) => next.delete(key));
        return next;
      },
      { replace: true },
    );
    setCurrentPage(1);
  };
  const [showSearch, setShowSearch] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  // Starter's usage meter loads again after a client is added
  const [usageKey, setUsageKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalClients, setTotalClients] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const latestRequest = useRef(0);

  const convertToClient = (
    customer: CustomerResponse["customers"][0],
  ): Client => {
    const clientName =
      customer?.name?.trim() ||
      customer?.info?.client_name?.trim() ||
      "No name provided";
    return {
      id: customer?.id,
      name: clientName,
      email: customer?.email || "No email provided",
      initials: generateInitials(clientName),
      color: generateColor(clientName),
      summary: customer?.summary,
    };
  };

  const fetchCustomers = async (page: number = 1, searchName?: string) => {
    const requestId = ++latestRequest.current;

    try {
      setLoading(true);
      setTotalClients(null);
      setError(null);

      const response = await searchCustomers(
        searchName,
        page,
        itemsPerPage,
        filters,
      );
      const data: CustomerResponse = response?.data;

      // A newer search/page request has superseded this response.
      if (requestId !== latestRequest.current) return;

      const convertedClients = data?.customers?.map(convertToClient) ?? [];
      setClients(convertedClients);
      setTotalClients(data?.metadata?.total ?? 0);
      setTotalPages(Math.ceil((data?.metadata?.total ?? 0) / itemsPerPage));
    } catch (err) {
      if (requestId !== latestRequest.current) return;
      console.error("Error fetching customers:", err);
      setError("Failed to load clients. Please try again.");
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCustomers(currentPage, searchQuery.trim() || undefined);
    }, 300);

    return () => clearTimeout(timeoutId);
    // filterKey stands for the filters object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, searchQuery, filterKey]);

  const handleSearchFocus = () => {
    setShowSearch(true);
  };

  const handleClientClick = (clientId: string) => {
    navigate(`/clients/${clientId}`);
  };

  const handleAddClientSuccess = () => {
    setShowAddClient(false);
    setUsageKey((key) => key + 1);
    fetchCustomers(currentPage);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
  };

  if (loading && clients.length === 0) {
    return <LoadingSmall />;
  }

  return (
    <div className="clients-page">
      <div className="clients-page__header">
        <div className="clients-page__title-section">
          <h1>Your Clients</h1>
          <p>Clients who fill out your forms will appear here</p>
        </div>
        <button
          className="clients-page__add-btn"
          onClick={() => setShowAddClient(true)}
        >
          <Plus size={16} />
          Add a New Client
        </button>
      </div>

      <PlanUsageMeter refreshKey={usageKey} className="clients-page__plan-usage" />

      <div className="clients-page__search">
        <div className="search-input-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search name, email, phone number"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            onFocus={handleSearchFocus}
            className="search-input"
          />
        </div>
      </div>

      <div
        className="clients-page__filters"
        role="group"
        aria-label="Filter clients"
      >
        <div className="clients-page__chips">
          {ACTIVITY_OPTIONS.map((option) => {
            const active = (activity ?? "") === option.value;
            return (
              <button
                key={option.value || "all"}
                type="button"
                aria-pressed={active}
                className={`clients-page__chip ${
                  active ? "clients-page__chip--active" : ""
                }`}
                onClick={() => setParam("activity", option.value)}
              >
                {option.label}
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={formsPending}
            className={`clients-page__chip clients-page__chip--warn ${
              formsPending ? "clients-page__chip--active" : ""
            }`}
            onClick={() => setParam("forms", formsPending ? "" : "pending")}
          >
            Forms pending
          </button>
        </div>
        <div className="clients-page__selects">
          {services.length > 0 && (
            <select
              aria-label="Service booked"
              value={service ?? ""}
              onChange={(e) => setParam("service", e.target.value)}
            >
              <option value="">Any service</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.service}
                </option>
              ))}
            </select>
          )}
          <select
            aria-label="Sort clients"
            value={sort}
            onChange={(e) =>
              setParam("sort", e.target.value === "name" ? "" : e.target.value)
            }
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                Sort: {o.label}
              </option>
            ))}
          </select>
          {filtering && (
            <button
              type="button"
              className="clients-page__clear"
              onClick={clearFilters}
            >
              <X size={14} />
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="clients-page__stats">
        <span>
          {filtering ? "Matching clients" : "Total Clients"}:{" "}
          {totalClients === null ? (
            <CircularProgress
              size={14}
              sx={{ color: "#8e2d8e" }}
              aria-label="Loading total clients"
            />
          ) : (
            totalClients
          )}
        </span>
        {/* {searchQuery && (
          <span>
            {" "}
            • Showing {clients.length} results for "{searchQuery}"
          </span>
        )} */}
      </div>

      {error && (
        <div className="clients-page__error">
          <p>{error}</p>
          <button
            onClick={() =>
              fetchCustomers(currentPage, searchQuery || undefined)
            }
          >
            Retry
          </button>
        </div>
      )}

      {clients.length === 0 && !loading ? (
        <div className="clients-page__empty">
          <p>
            {searchQuery
              ? `No clients found matching "${searchQuery}"`
              : filtering
                ? "No clients match these filters."
                : "No clients found. Add your first client to get started!"}
          </p>
          {filtering && (
            <button
              type="button"
              className="clients-page__clear"
              onClick={clearFilters}
            >
              <X size={14} />
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="clients-page__grid">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onClick={() => handleClientClick(client.id)}
            />
          ))}
        </div>
      )}

      {loading && clients.length > 0 && (
        <div className="clients-page__loading-more">
          <LoadingSmall />
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="clients-page__pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn pagination-btn--prev"
            aria-label="Previous page"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="pagination-info">
            <span className="pagination-current">{currentPage}</span>
            <span className="pagination-separator">/</span>
            <span className="pagination-total">{totalPages}</span>
          </div>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn pagination-btn--next"
            aria-label="Next page"
          >
            <ChevronRight size={20} />
          </button>
          <div className="pagination-per-page">
            <label htmlFor="items-per-page">Show:</label>
            <select
              id="items-per-page"
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="per-page-select"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      )}

      {showSearch && <ClientSearchModal onClose={() => setShowSearch(false)} />}

      {showAddClient && (
        <AddClientModal
          onClose={() => setShowAddClient(false)}
          onSuccess={handleAddClientSuccess}
        />
      )}
    </div>
  );
};

export default ClientsPage;

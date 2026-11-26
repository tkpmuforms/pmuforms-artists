"use client";

import { Plus, Search, X } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import FormCard from "../../components/forms/FormCard";
import { Loading } from "../../components/loading/Loading";
import Pagination from "../../components/pagination/Pagination";
import { Form, FormType } from "../../redux/types";
import { getArtistForms } from "../../services/artistServices";
import { transformFormData } from "../../utils/utils";
import "./forms-page.scss";
import UpdateServicesModal from "../../components/profile/UpdateServicesModal";
import useAuth from "../../context/useAuth";
import {
  FORM_SOURCES,
  FormSort,
  FormSource,
  countByType,
  matchesFilters,
  servicesOf,
  sortForms,
  sourceOf,
} from "../../utils/formFilters";

const SOURCE_BADGES: Partial<Record<FormSource, string>> = {
  mine: "Made by you",
  edited: "Edited",
};

const FORM_TABS: { type: FormType; label: string }[] = [
  { type: "consent", label: "Consent" },
  { type: "pre-care", label: "Pre-care" },
  { type: "care", label: "Aftercare" },
];

const FORMS_PER_PAGE = 12;

const FormsPage: React.FC = () => {
  const { user } = useAuth();
  const artistServices = useMemo(() => user?.services ?? [], [user?.services]);
  // filters live in the address, so going back to the page keeps them
  const [params, setParams] = useSearchParams();
  const activeTab: FormType =
    FORM_TABS.find((t) => t.type === params.get("type"))?.type ?? "consent";
  const searchTerm = params.get("q") ?? "";
  const service = params.get("service") ?? "";
  const source: FormSource =
    FORM_SOURCES.find((s) => s.value === params.get("source"))?.value ?? "all";
  const sort: FormSort = params.get("sort") === "az" ? "az" : "recent";

  const setParam = (key: string, value: string, fallback = "") => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value && value !== fallback) next.set(key, value);
        else next.delete(key);
        // a new tab or filter starts again from the first page
        if (key !== "page") next.delete("page");
        return next;
      },
      { replace: true },
    );
  };
  const clearFilters = () =>
    setParams(
      (prev) => {
        const next = new URLSearchParams();
        if (prev.get("type")) next.set("type", prev.get("type")!);
        return next;
      },
      { replace: true },
    );

  const [showAddMoreServicesModal, setShowAddMoreServicesModal] =
    useState(false);
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const filters = { search: searchTerm, service, source };
  const hasFilters = !!(searchTerm.trim() || service || source !== "all");
  // every type's matches, so each tab can say how many it has
  const matching = forms.filter((form) =>
    matchesFilters(form, filters, artistServices),
  );
  const tabCounts = countByType(matching);
  const filteredForms = sortForms(
    matching.filter((form) => form.type === activeTab),
    sort,
  );
  const inTab = forms.filter((form) => form.type === activeTab);
  const unassignedCount = inTab.filter(
    (form) => servicesOf(form, artistServices).length === 0,
  ).length;
  const serviceCount = (id: number) =>
    inTab.filter((form) =>
      servicesOf(form, artistServices).some((s) => s.id === id),
    ).length;
  const tabLabel =
    FORM_TABS.find((t) => t.type === activeTab)?.label.toLowerCase() ?? "";
  const pages = Math.max(1, Math.ceil(filteredForms.length / FORMS_PER_PAGE));
  const page = Math.min(Math.max(Number(params.get("page")) || 1, 1), pages);
  const pageForms = filteredForms.slice(
    (page - 1) * FORMS_PER_PAGE,
    page * FORMS_PER_PAGE,
  );
  const goToPage = (next: number) => {
    setParam("page", String(next), "1");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const fetchForms = async () => {
      try {
        setLoading(true);
        const response = await getArtistForms();
        if (response && response.data && response.data.forms) {
          const transformedForms = response.data.forms.map(transformFormData);
          setForms(transformedForms);
        } else {
          toast.error("No forms data received");
        }
      } catch (err) {
        console.error("Error fetching forms:", err);
        toast.error("Failed to fetch forms. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, []);

  const handlePreview = (formId: string) => {
    navigate(`/forms/preview/${formId}`);
  };
  const handleEdit = (formId: string) => {
    navigate(`/forms/edit/${formId}`);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="forms-page">
      <div className="forms-page__content">
        <div className="forms-page__title-section">
          <div>
            <h1>Preview Forms</h1>
            <p>Preview and manage all forms</p>
          </div>
          <div className="forms-page__title-actions">
            <button
              className="forms-page__create-btn"
              onClick={() => navigate("/forms/new")}
            >
              <Plus size={16} />
              Create a Form
            </button>
            <button
              className="forms-page__create-btn forms-page__create-btn--outline"
              onClick={() => setShowAddMoreServicesModal(true)}
            >
              <Plus size={16} />
              Unlock More Forms
            </button>
          </div>
        </div>

        <div className="forms-page__search">
          <div className="forms-page__search-input">
            <Search size={20} />
            <input
              type="search"
              aria-label="Search forms by title or service"
              placeholder="Search by form title or service..."
              value={searchTerm}
              onChange={(e) => setParam("q", e.target.value)}
            />
          </div>
          <div className="forms-page__selects">
            <select
              aria-label="Where the form came from"
              value={source}
              onChange={(e) => setParam("source", e.target.value, "all")}
            >
              {FORM_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              aria-label="Sort forms"
              value={sort}
              onChange={(e) => setParam("sort", e.target.value, "recent")}
            >
              <option value="recent">Recently updated</option>
              <option value="az">Title A–Z</option>
            </select>
          </div>
        </div>

        <div className="forms-page__tabs" role="tablist" aria-label="Form type">
          {FORM_TABS.map((tab) => (
            <button
              key={tab.type}
              role="tab"
              aria-selected={activeTab === tab.type}
              className={`forms-page__tab ${
                activeTab === tab.type ? "forms-page__tab--active" : ""
              }`}
              onClick={() => setParam("type", tab.type, "consent")}
            >
              {tab.label} ({tabCounts[tab.type] ?? 0})
            </button>
          ))}
        </div>

        {(artistServices.length > 0 || unassignedCount > 0) && (
          <div
            className="forms-page__service-chips"
            role="group"
            aria-label="Filter by service"
          >
            <button
              type="button"
              aria-pressed={!service}
              className={`forms-page__chip ${!service ? "forms-page__chip--active" : ""}`}
              onClick={() => setParam("service", "")}
            >
              All services
            </button>
            {artistServices.map((s) => {
              const active = service === String(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={active}
                  className={`forms-page__chip ${active ? "forms-page__chip--active" : ""}`}
                  onClick={() => setParam("service", active ? "" : String(s.id))}
                >
                  {s.service}
                  <span className="forms-page__chip-count">{serviceCount(s.id)}</span>
                </button>
              );
            })}
            {unassignedCount > 0 && (
              <button
                type="button"
                aria-pressed={service === "none"}
                className={`forms-page__chip forms-page__chip--muted ${
                  service === "none" ? "forms-page__chip--active" : ""
                }`}
                onClick={() => setParam("service", service === "none" ? "" : "none")}
              >
                Not on a service
                <span className="forms-page__chip-count">{unassignedCount}</span>
              </button>
            )}
          </div>
        )}

        {hasFilters && (
          <div className="forms-page__result-bar" aria-live="polite">
            <span>
              {filteredForms.length} of {inTab.length} {tabLabel} forms
            </span>
            <button type="button" className="forms-page__clear" onClick={clearFilters}>
              <X size={14} />
              Clear filters
            </button>
          </div>
        )}

        {activeTab === "pre-care" && (
          <p className="forms-page__tab-hint">
            Pre-care instructions are emailed to clients about 3 days before
            their appointment, so they arrive ready. Edit a form to make it
            your own.
          </p>
        )}

        <div className="forms-page__grid">
          {filteredForms.length > 0 ? (
            pageForms.map((form) => (
              <FormCard
                key={form.id}
                {...form}
                serviceNames={servicesOf(form, artistServices).map(
                  (s) => s.service,
                )}
                sourceLabel={SOURCE_BADGES[sourceOf(form)]}
                onPreview={() => handlePreview(form.id)}
                onEdit={() => handleEdit(form.id)}
              />
            ))
          ) : hasFilters ? (
            <div className="forms-page__empty">
              <p>No {tabLabel} forms match these filters.</p>
              <button className="forms-page__create-btn" onClick={clearFilters}>
                <X size={16} />
                Clear filters
              </button>
            </div>
          ) : (
            <div className="forms-page__empty">
              <p>No {tabLabel} forms found.</p>
              <button
                className="forms-page__create-btn"
                onClick={() => setShowAddMoreServicesModal(true)}
              >
                <Plus size={16} />
                Unlock More {FORM_TABS.find((t) => t.type === activeTab)?.label}{" "}
                Forms
              </button>
            </div>
          )}
        </div>
        <Pagination page={page} pages={pages} onChange={goToPage} />
      </div>

      {showAddMoreServicesModal && (
        <UpdateServicesModal
          onClose={() => setShowAddMoreServicesModal(false)}
          onGoBack={() => setShowAddMoreServicesModal(false)}
        />
      )}
    </div>
  );
};

export default FormsPage;

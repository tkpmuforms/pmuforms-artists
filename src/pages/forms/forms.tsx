"use client";

import { Plus, Search } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import FormCard from "../../components/formsComp/FormCard";
import { Loading } from "../../components/loading/Loading";
import { Form, FormType } from "../../redux/types";
import { getArtistForms } from "../../services/artistServices";
import { transformFormData } from "../../utils/utils";
import "./forms-page.scss";
import UpdateServicesModal from "../../components/profileComp/UpdateServicesModal";

const FORM_TABS: { type: FormType; label: string }[] = [
  { type: "consent", label: "Consent" },
  { type: "pre-care", label: "Pre-care" },
  { type: "care", label: "Aftercare" },
];

const FormsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FormType>("consent");
  const [showAddMoreServicesModal, setShowAddMoreServicesModal] =
    useState(false);
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const filteredForms = forms.filter((form) => {
    const matchesTab = form.type === activeTab;
    const matchesSearch =
      searchTerm === "" ||
      form.title?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

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
          <button
            className="forms-page__create-btn"
            onClick={() => setShowAddMoreServicesModal(true)}
          >
            <Plus size={16} />
            Unlock More Forms
          </button>
        </div>

        <div className="forms-page__search">
          <div className="forms-page__search-input">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search forms by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="forms-page__tabs">
          {FORM_TABS.map((tab) => (
            <button
              key={tab.type}
              className={`forms-page__tab ${
                activeTab === tab.type ? "forms-page__tab--active" : ""
              }`}
              onClick={() => setActiveTab(tab.type)}
            >
              {tab.label} ({forms.filter((f) => f.type === tab.type).length})
            </button>
          ))}
        </div>

        {activeTab === "pre-care" && (
          <p className="forms-page__tab-hint">
            Pre-care instructions are emailed to clients about 3 days before
            their appointment, so they arrive ready. Edit a form to make it
            your own.
          </p>
        )}

        <div className="forms-page__grid">
          {filteredForms.length > 0 ? (
            filteredForms.map((form) => (
              <FormCard
                key={form.id}
                {...form}
                onPreview={() => handlePreview(form.id)}
                onEdit={() => handleEdit(form.id)}
              />
            ))
          ) : (
            <div className="forms-page__empty">
              <p>
                No {FORM_TABS.find((t) => t.type === activeTab)?.label.toLowerCase()}{" "}
                forms found
                {searchTerm ? ` matching "${searchTerm}"` : ""}.
              </p>
              <button
                className="forms-page__create-btn"
                onClick={() => setShowAddMoreServicesModal(true)}
              >
                <Plus size={16} />
                Unlock Your Forms
                {activeTab?.charAt(0).toUpperCase() + activeTab.slice(1)} Form
              </button>
            </div>
          )}
        </div>
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

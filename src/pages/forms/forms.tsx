"use client";

import { Plus } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import FormCard from "../../components/formsComp/FormCard";
import { Loading } from "../../components/loading/Loading";
import { Form } from "../../redux/types";
import { getArtistForms } from "../../services/artistServices";
import { transformFormData } from "../../utils/utils";
import "./forms-page.scss";
import UpdateServicesModal from "../../components/profileComp/UpdateServicesModal";

const FormsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"consent" | "care">("consent");
  const [showAddMoreServicesModal, setShowAddMoreServicesModal] =
    useState(false);
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const filteredForms = forms.filter((form) => form.type === activeTab);

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
            onClick={() => {}}
          >
            <Plus size={16} />
            Unlock More Forms
          </button>
        </div>

        <div className="forms-page__tabs">
          <button
            className={`forms-page__tab ${
              activeTab === "consent" ? "forms-page__tab--active" : ""
            }`}
            onClick={() => setActiveTab("consent")}
          >
            Consent ({forms.filter((f) => f.type === "consent").length})
          </button>
          <button
            className={`forms-page__tab ${
              activeTab === "care" ? "forms-page__tab--active" : ""
            }`}
            onClick={() => setActiveTab("care")}
          >
            Care ({forms.filter((f) => f.type === "care").length})
          </button>
        </div>

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
              <p>No {activeTab} forms found.</p>
              <button
                className="forms-page__create-btn"
                onClick={() => setShowAddMoreServicesModal(true)}
              >
                <Plus size={16} />
                Create a New{" "}
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Form
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

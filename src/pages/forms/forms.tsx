"use client";

import { Plus } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import AddFieldModal from "../../components/formsComp/AddFieldModal";
import DeleteConfirmModal from "../../components/formsComp/DeleteConfirmModal";
import FormCard from "../../components/formsComp/FormCard";
import { getArtistForms } from "../../services/artistServices";
import "./forms-page.scss";
import { Form } from "../../redux/types";
import { formatLastUpdated, formatUsedFor } from "../../utils/utils";
import { FormsIconSvg } from "../../assets/svgs/formsSvg";
import { Loading } from "../../components/loading/Loading";

const FormsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"consent" | "care">("consent");
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [showEditParagraphModal, setShowEditParagraphModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditServicesModal, setShowEditServicesModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState<
    "save" | "discard" | null
  >(null);
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const transformFormData = (apiForm: any): Form => {
    return {
      id: apiForm.id || apiForm._id,
      title: apiForm.title,
      lastUpdated: formatLastUpdated(apiForm.updatedAt),
      usedFor: formatUsedFor(apiForm.services || []),
      type: apiForm.type as "consent" | "care",
      services: apiForm.services || [],
      createdAt: apiForm.createdAt,
      updatedAt: apiForm.updatedAt,
    };
  };

  // Filter forms based on active tab
  const filteredForms = forms.filter((form) => form.type === activeTab);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getArtistForms();

        if (response && response.data && response.data.forms) {
          const transformedForms = response.data.forms.map(transformFormData);
          setForms(transformedForms);
        } else {
          setError("No forms data received");
        }
      } catch (err) {
        console.error("Error fetching forms:", err);
        setError("Failed to load forms");
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="forms-page">
        <div className="forms-page__content">
          <div className="forms-page__error">
            Error: {error}
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </div>
    );
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
            onClick={() => setShowAddFieldModal(true)}
          >
            <Plus size={16} />
            Create a New Form
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
                onPreview={() => console.log("Preview", form.id)}
                onEdit={() => setShowEditParagraphModal(true)}
              />
            ))
          ) : (
            <div className="forms-page__empty">
              <p>No {activeTab} forms found.</p>
              <button
                className="forms-page__create-btn"
                onClick={() => setShowAddFieldModal(true)}
              >
                <Plus size={16} />
                Create a New{" "}
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Form
              </button>
            </div>
          )}
        </div>
      </div>

      {showAddFieldModal && (
        <AddFieldModal onClose={() => setShowAddFieldModal(false)} />
      )}

      {/* {showEditParagraphModal && (
        <EditParagraphModal
          onClose={() => setShowEditParagraphModal(false)}
          onSave={() => setShowConfirmationModal("save")}
          onDelete={() => setShowDeleteModal(true)}
        />
      )} */}

      {showDeleteModal && (
        <DeleteConfirmModal
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => {
            setShowDeleteModal(false);
            console.log("Deleted");
          }}
        />
      )}

      {/* {showEditServicesModal && (
        <EditServicesModal onClose={() => setShowEditServicesModal(false)} />
      )} */}

      {/* {showConfirmationModal && (
        <ConfirmationModal
          type={showConfirmationModal}
          onClose={() => setShowConfirmationModal(null)}
          onConfirm={() => {
            setShowConfirmationModal(null);
            if (showConfirmationModal === "save") {
              setShowEditParagraphModal(false);
            }
          }}
        />
      )} */}
    </div>
  );
};

export default FormsPage;

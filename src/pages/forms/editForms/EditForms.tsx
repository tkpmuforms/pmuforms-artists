import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { LoadingSmall } from "../../../components/loading/Loading";
import EditFormServices from "../../../components/formsComp/EditFormsServices";
import RenderEditFormsFields from "../../../components/formsComp/RenderEditForms";
import ServicesSection from "../../../components/formsComp/ServiceSection";
import AddFieldModal from "../../../components/formsComp/AddFieldModal";
import FieldInputModal from "../../../components/formsComp/FieldInputModal";
import useAuth from "../../../context/useAuth";
import { Section, Service, SingleForm } from "../../../redux/types";
import {
  deleteFormSectionData,
  getFormById,
  getServices,
  updateFormSectionData,
  updateFormServices,
  addFormSectionData,
} from "../../../services/artistServices";
import "./edit-forms.scss";
import DeleteConfirmModal from "../../../components/formsComp/DeleteConfirmModal";
import EditParagraphModal from "../../../components/formsComp/EditParagraphModal";

interface EditFormsProps {
  onClose?: () => void;
  formId?: string;
}

interface addFormSectionDataPayload {
  line: string;
  title: string;
  type?: string;
  required?: boolean;
  after: string;
}

type SaveState = "idle" | "saving" | "saved" | "error";

/** a form as the API sends it */
interface ApiFormData {
  id?: string;
  _id?: string;
  type: SingleForm["type"];
  title: string;
  sections?: Section[];
  services?: number[];
}

/** The API's form, ready to show: the artist's business name filled in. */
const toSingleForm = (
  formData: ApiFormData,
  businessName?: string
): SingleForm =>
  JSON.parse(
    JSON.stringify({
      id: formData.id || formData._id,
      type: formData.type,
      title: formData.title,
      sections: (formData.sections ?? []).map((section: Section) => ({
        ...section,
        _id: section._id || section.id,
      })),
      services: formData.services || [],
    }).replace(
      /\(?\{\{user\.businessName\}\}\)?/g,
      businessName || "Your Business Name"
    )
  );

interface FieldType {
  type: string;
  title: string;
  label?: string;
  [key: string]: any;
}
const EditForms: React.FC<EditFormsProps> = ({ formId, onClose }) => {
  const { formId: paramFormId } = useParams<{ formId?: string }>();
  const formTemplateId = formId || paramFormId;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<SingleForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [showEditParagraphModal, setShowEditParagraphModal] = useState(false);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [showFieldInputModal, setShowFieldInputModal] = useState(false);
  const [selectedFieldType, setSelectedFieldType] = useState<FieldType | null>(
    null
  );
  const [currentAfterFieldId, setCurrentAfterFieldId] = useState("");
  const [addingField, setAddingField] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [highlightId, setHighlightId] = useState<string | null>(null);
  // the form (and business name) on screen, so moving to a new version's
  // address doesn't fetch it again and flash the loading screen
  const shownKey = useRef<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setServicesLoading(true);
        const response = await getServices();

        const services: Service[] = response.data.services.map(
          (service: Service) => ({
            _id: service._id,
            id: service.id,
            service: service.service,
          })
        );

        setAllServices(services);
      } catch (error) {
        toast.error("Failed to fetch services. Please try again.");
      } finally {
        setServicesLoading(false);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    const fetchForm = async () => {
      if (!formTemplateId) return;
      if (shownKey.current === `${formTemplateId}|${user?.businessName}`) return;

      try {
        setLoading(true);

        const response = await getFormById(formTemplateId);

        if (response?.data?.form) {
          const updatedForm = toSingleForm(response.data.form, user?.businessName);
          shownKey.current = `${updatedForm.id}|${user?.businessName}`;
          setForm(updatedForm);
        } else {
          console.error("No form data found in response");
          toast.error("No form data found");
          setForm(null);
        }
      } catch (error) {
        console.error("Error fetching form:", error);
        setForm(null);
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formTemplateId, user?.businessName]);

  // bring a field that was just added into view, briefly highlighted
  useEffect(() => {
    if (!highlightId) return;
    const frame = requestAnimationFrame(() => {
      document
        .querySelector(`[data-field-id="${highlightId}"]`)
        ?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    });
    const timer = setTimeout(() => setHighlightId(null), 2500);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [highlightId]);

  /**
   * Every change saves a new version of the form with a new id. Show that
   * version and move the address to it, so the next change builds on it.
   */
  const showVersion = (formData: ApiFormData) => {
    const next = toSingleForm(formData, user?.businessName);
    shownKey.current = `${next.id}|${user?.businessName}`;
    setForm(next);
    if (paramFormId && next.id !== paramFormId) {
      navigate(`/forms/edit/${encodeURIComponent(next.id)}`, { replace: true });
    }
    return next;
  };

  const handleEditField = (field: any) => {
    setShowEditParagraphModal(true);
    setEditingField(field);
  };

  const handleDeleteField = (field: any) => {
    if (!form || !field) return;

    setSaveState("saving");
    deleteFormSectionData(form.id, field.sectionId, field.id)
      .then((response) => {
        if (response?.data?.form?.id) {
          showVersion(response.data.form);
        } else {
          const updatedForm = { ...form };
          updatedForm.sections = updatedForm.sections.map((section) => {
            if (
              section.id === field.sectionId ||
              section._id === field.sectionId
            ) {
              return {
                ...section,
                data: section.data.filter((f) => f.id !== field.id),
              };
            }
            return section;
          });
          setForm(updatedForm);
        }

        setShowConfirmDeleteModal(false);
        setSaveState("saved");
        toast.success("Field deleted successfully");
      })
      .catch((error) => {
        console.error("Error deleting field:", error);
        setSaveState("error");
        toast.error("Failed to delete field");
      });
  };

  const handleSectionDataUpdate = (
    updatedContent: string,
    isRequired?: boolean
  ) => {
    if (!form || !editingField) return;

    const updatedField = {
      ...editingField,
      title: updatedContent,
      required: isRequired !== undefined ? isRequired : editingField.required,
    };

    setSaveState("saving");
    updateFormSectionData(
      form.id,
      editingField.sectionId,
      editingField.id,
      updatedField
    )
      .then((response) => {
        if (response?.data?.form?.id) {
          showVersion(response.data.form);
        } else {
          const updatedForm = { ...form };
          updatedForm.sections = updatedForm.sections.map((section) => {
            if (
              section.id === editingField?.sectionId ||
              section._id === editingField?.sectionId
            ) {
              return {
                ...section,
                data: section.data.map((field) =>
                  field.id === editingField?.id ? updatedField : field
                ),
              };
            }
            return section;
          });
          setForm(updatedForm);
        }

        setEditingField(null);
        setSaveState("saved");
        toast.success("Field updated successfully");
      })
      .catch((error) => {
        console.error("Error updating field:", error);
        setSaveState("error");
        toast.error("Failed to update field");
      });
  };

  const handleShowConfirmDeleteModal = (field: any) => {
    setEditingField(field);
    setShowConfirmDeleteModal(true);
  };

  const handleAddParagraph = (afterFieldId: string) => {
    setCurrentAfterFieldId(afterFieldId);
    setShowAddFieldModal(true);
  };

  const handleFieldTypeSelect = (fieldType: FieldType) => {
    setSelectedFieldType(fieldType);
    setShowAddFieldModal(false);
    setShowFieldInputModal(true);
  };

  const handleAddField = async (title: string, isRequired: boolean) => {
    if (!form || !selectedFieldType || !currentAfterFieldId || addingField) return;

    const sectionWithField = form.sections.find((section) =>
      section.data.some((field) => field.id === currentAfterFieldId)
    );

    if (!sectionWithField) {
      toast.error("Could not find section for field");
      return;
    }

    const sectionId = sectionWithField._id || sectionWithField.id;
    // a paragraph is read-only text: no type, nothing to require
    const payload: addFormSectionDataPayload =
      selectedFieldType.type === "paragraph"
        ? { line: "full", title, after: currentAfterFieldId }
        : {
            line: "full",
            title,
            type: selectedFieldType.type,
            required: isRequired,
            after: currentAfterFieldId,
          };

    setAddingField(true);
    setSaveState("saving");
    try {
      const response = await addFormSectionData(form.id, sectionId, payload as any);
      const saved = response?.data?.form;
      if (!saved?.sections) throw new Error("The form wasn't returned");

      const before = new Set(sectionWithField.data.map((field) => field.id));
      const next = showVersion(saved);
      const added = next.sections
        .find((section) => (section._id || section.id) === sectionId)
        ?.data.find((field) => !before.has(field.id));
      setHighlightId(added?.id ?? null);

      setShowFieldInputModal(false);
      setSelectedFieldType(null);
      setCurrentAfterFieldId("");
      setSaveState("saved");
      toast.success("Field added and saved");
    } catch (error) {
      // the modal stays open with what they typed, so they can try again
      console.error("Error adding field:", error);
      setSaveState("error");
      toast.error("Failed to add field. Please try again.");
    } finally {
      setAddingField(false);
    }
  };

  const handleCloseFieldModals = () => {
    if (addingField) return;
    setShowAddFieldModal(false);
    setShowFieldInputModal(false);
    setSelectedFieldType(null);
    setCurrentAfterFieldId("");
  };

  const handleUpdateServices = (selectedServiceIds: number[]) => {
    if (!form) return;

    setSaveState("saving");
    updateFormServices(form.id, { services: selectedServiceIds })
      .then((response) => {
        if (response?.data?.form?.id) {
          showVersion(response.data.form);
        } else {
          const updatedForm = {
            ...form,
            services: selectedServiceIds,
          };
          setForm(updatedForm);
        }

        setShowServicesModal(false);
        setSaveState("saved");
        toast.success("Services updated successfully");
      })
      .catch((error) => {
        console.error("Error updating services:", error);
        setSaveState("error");
        toast.error("Failed to update services");
      });
  };

  /**
   * Each change is saved as it's made; this reloads the form from the server
   * so the artist sees exactly what clients will get.
   */
  const handleSaveForm = async () => {
    if (!form) return;
    setSaveState("saving");
    try {
      const response = await getFormById(form.id);
      if (!response?.data?.form) throw new Error("No form returned");
      showVersion(response.data.form);
      setSaveState("saved");
      toast.success("All your changes are saved");
    } catch (error) {
      console.error("Error checking form:", error);
      setSaveState("error");
      toast.error("Couldn't check your changes. Please try again.");
    }
  };

  if (!formTemplateId) {
    navigate("/forms");
    return null;
  }

  if (loading) {
    return <LoadingSmall />;
  }

  if (!form) {
    return (
      <div className="edit-dynamic-forms">
        <div className="no-forms">
          <p>No form found</p>
          {onClose && <button onClick={onClose}>Close</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="edit-dynamic-forms">
      {onClose && (
        <div className="modal-header">
          <button onClick={onClose} className="close-button">
            ×
          </button>
        </div>
      )}

      <div className="form-content">
        <div className="title-actions-row">
          <h2>{form.title}</h2>
          <div className="action-buttons">
            <span
              className={`save-status save-status--${saveState}`}
              role="status"
              aria-live="polite"
            >
              {saveState === "saving"
                ? "Saving…"
                : saveState === "saved"
                ? "All changes saved"
                : saveState === "error"
                ? "Last change didn't save"
                : ""}
            </span>
            <button
              className="save-btn"
              onClick={handleSaveForm}
              disabled={saveState === "saving"}
            >
              {saveState === "saving" ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        <ServicesSection
          services={form?.services || []}
          allServices={allServices}
          onChangeServices={() => setShowServicesModal(true)}
          loading={servicesLoading}
        />

        {form.sections && form.sections.length > 0 ? (
          form.sections.map((section) => (
            <div key={section._id || section.id} className="form-section">
              <h3>{section.title}</h3>
              {section.data && section.data.length > 0 ? (
                <RenderEditFormsFields
                  fields={section.data}
                  sectionId={section._id || section.id}
                  onEditField={handleEditField}
                  onDeleteField={handleShowConfirmDeleteModal}
                  onAddParagraph={handleAddParagraph}
                  highlightId={highlightId}
                />
              ) : (
                <p>No fields in this section</p>
              )}
            </div>
          ))
        ) : (
          <p>No sections found in this form</p>
        )}
      </div>

      {showAddFieldModal && (
        <AddFieldModal
          onClose={handleCloseFieldModals}
          onSelectFieldType={handleFieldTypeSelect}
        />
      )}

      {showFieldInputModal && selectedFieldType && (
        <FieldInputModal
          onClose={handleCloseFieldModals}
          onSave={handleAddField}
          fieldType={selectedFieldType}
          saving={addingField}
        />
      )}

      {showConfirmDeleteModal && (
        <DeleteConfirmModal
          onClose={() => setShowConfirmDeleteModal(false)}
          onConfirm={() => handleDeleteField(editingField)}
          type="section"
        />
      )}
      {showEditParagraphModal && (
        <EditParagraphModal
          onClose={() => {
            setShowEditParagraphModal(false);
            setEditingField(null);
          }}
          onSave={handleSectionDataUpdate}
          initialContent={editingField?.title || ""}
          initialRequired={editingField?.required || false}
          fieldType={editingField?.type}
        />
      )}

      <EditFormServices
        isOpen={showServicesModal}
        onClose={() => setShowServicesModal(false)}
        allServices={allServices}
        selectedServices={form.services || []}
        onUpdateServices={handleUpdateServices}
        loading={servicesLoading}
      />
    </div>
  );
};

export default EditForms;

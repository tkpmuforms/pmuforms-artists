import { useEffect, useState } from "react";
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
  type: string;
  required: boolean;
  after: string;
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
  const [editingField, setEditingField] = useState(null);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [showEditParagraphModal, setShowEditParagraphModal] = useState(false);

  // New state for add field functionality
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [showFieldInputModal, setShowFieldInputModal] = useState(false);
  const [selectedFieldType, setSelectedFieldType] = useState(null);
  const [currentAfterFieldId, setCurrentAfterFieldId] = useState("");

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setServicesLoading(true);
        const response = await getServices();
        console.log("Fetched services:", response.data.services);

        const services: Service[] = response.data.services.map(
          (service: Service) => ({
            _id: service._id,
            id: service.id,
            service: service.service,
          })
        );

        console.log("Processed services:", services);
        setAllServices(services);
      } catch (error) {
        toast.error("Failed to fetch services. Please try again.");
        console.error("Error fetching services:", error);
      } finally {
        setServicesLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Fetch form data
  useEffect(() => {
    const fetchForm = async () => {
      if (!formTemplateId) return;

      try {
        setLoading(true);

        const response = await getFormById(formTemplateId);
        console.log("API Response:", response);

        if (response?.data?.form) {
          const formData = response?.data?.form;

          const transformedForm: SingleForm = {
            id: formData.id || formData._id,
            type: formData.type,
            title: formData.title,
            sections: formData.sections.map((section: Section) => ({
              ...section,
              _id: section._id || section.id,
            })),
            services: formData.services || [],
          };

          // Replace business name placeholders
          const updatedForm = JSON.parse(
            JSON.stringify(transformedForm).replace(
              /\(?\{\{user\.businessName\}\}\)?/g,
              user?.businessName || "Your Business Name"
            )
          );

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

  const handleEditField = (field: any) => {
    setShowEditParagraphModal(true);
    setEditingField(field);
  };

  const handleDeleteField = (field: any) => {
    if (!form || !field) return;

    deleteFormSectionData(form.id, field.sectionId, field.id)
      .then((response) => {
        // Check if response contains a new form ID
        if (response?.data?.form?.id) {
          const newFormId = response.data.form.id;

          // Update URL if we're using route params
          if (paramFormId && newFormId !== form.id) {
            navigate(`/forms/edit/${newFormId}`, { replace: true });
          }

          // Update form with new data
          const formData = response.data.form;
          const transformedForm: SingleForm = {
            id: formData.id || formData._id,
            type: formData.type,
            title: formData.title,
            sections: formData.sections.map((section: Section) => ({
              ...section,
              _id: section._id || section.id,
            })),
            services: formData.services || [],
          };

          // Replace business name placeholders
          const updatedForm = JSON.parse(
            JSON.stringify(transformedForm).replace(
              /\(?\{\{user\.businessName\}\}\)?/g,
              user?.businessName || "Your Business Name"
            )
          );

          setForm(updatedForm);
        } else {
          // Fallback to local update if no new form data in response
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
        toast.success("Field deleted successfully");
      })
      .catch((error) => {
        console.error("Error deleting field:", error);
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

    console.log("Updating field data:", updatedField);

    updateFormSectionData(
      form.id,
      editingField.sectionId,
      editingField.id,
      updatedField
    )
      .then((response) => {
        // Check if response contains a new form ID
        if (response?.data?.form?.id) {
          const newFormId = response.data.form.id;

          // Update URL if we're using route params
          if (paramFormId && newFormId !== form.id) {
            navigate(`/forms/edit/${newFormId}`, { replace: true });
          }

          // Update form with new data from response
          const formData = response.data.form;
          const transformedForm: SingleForm = {
            id: formData.id || formData._id,
            type: formData.type,
            title: formData.title,
            sections: formData.sections.map((section: Section) => ({
              ...section,
              _id: section._id || section.id,
            })),
            services: formData.services || [],
          };

          // Replace business name placeholders
          const updatedForm = JSON.parse(
            JSON.stringify(transformedForm).replace(
              /\(?\{\{user\.businessName\}\}\)?/g,
              user?.businessName || "Your Business Name"
            )
          );

          setForm(updatedForm);
        } else {
          // Fallback to local update if no new form data in response
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
        toast.success("Field updated successfully");
      })
      .catch((error) => {
        console.error("Error updating field:", error);
        toast.error("Failed to update field");
      });
  };

  const handleShowConfirmDeleteModal = (field: any) => {
    setEditingField(field);
    setShowConfirmDeleteModal(true);
    console.log("Show confirm delete modal for field:", field);
  };

  const handleAddParagraph = (afterFieldId: string) => {
    console.log("Add paragraph after field:", afterFieldId);
    setCurrentAfterFieldId(afterFieldId);
    setShowAddFieldModal(true);
  };

  const handleFieldTypeSelect = (fieldType: any) => {
    setSelectedFieldType(fieldType);
    setShowAddFieldModal(false);
    setShowFieldInputModal(true);
  };

  const handleAddField = async (title: string, isRequired: boolean) => {
    if (!form || !selectedFieldType || !currentAfterFieldId) return;

    // Find which section contains the after field
    const sectionWithField = form.sections.find((section) =>
      section.data.some((field) => field.id === currentAfterFieldId)
    );

    if (!sectionWithField) {
      toast.error("Could not find section for field");
      return;
    }

    const payload: addFormSectionDataPayload = {
      line: "full", // hardcoded as requested
      title: title,
      type: selectedFieldType.type,
      required: isRequired,
      after: currentAfterFieldId,
    };

    try {
      const response = await addFormSectionData(
        form.id,
        sectionWithField._id || sectionWithField.id,
        payload
      );

      // Update the form state locally by refetching
      const updatedFormResponse = await getFormById(form.id);
      if (updatedFormResponse?.data?.form) {
        const formData = updatedFormResponse.data.form;
        const transformedForm: SingleForm = {
          id: formData.id || formData._id,
          type: formData.type,
          title: formData.title,
          sections: formData.sections.map((section: Section) => ({
            ...section,
            _id: section._id || section.id,
          })),
          services: formData.services || [],
        };

        // Replace business name placeholders
        const updatedForm = JSON.parse(
          JSON.stringify(transformedForm).replace(
            /\(?\{\{user\.businessName\}\}\)?/g,
            user?.businessName || "Your Business Name"
          )
        );

        setForm(updatedForm);
      }

      setShowFieldInputModal(false);
      setSelectedFieldType(null);
      setCurrentAfterFieldId("");
      toast.success("Field added successfully");
    } catch (error) {
      console.error("Error adding field:", error);
      toast.error("Failed to add field");
    }
  };

  const handleCloseFieldModals = () => {
    setShowAddFieldModal(false);
    setShowFieldInputModal(false);
    setSelectedFieldType(null);
    setCurrentAfterFieldId("");
  };

  // Services handlers
  const handleUpdateServices = (selectedServiceIds: number[]) => {
    if (!form) return;
    const updatedForm = {
      ...form,
      services: selectedServiceIds,
    };
    updateFormServices(form.id, { services: selectedServiceIds })
      .then(() => {
        toast.success("Services updated successfully");
      })
      .catch((error) => {
        console.error("Error updating services:", error);
        toast.error("Failed to update services");
      });
    setShowServicesModal(false);
    setForm(updatedForm);
  };

  const handleSaveForm = () => {
    // TODO: Implement form save functionality
    console.log("Save form:", form);
    toast.success("Form saved successfully");
  };

  // Navigation guard
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
        {/* Title and Actions */}
        <div className="title-actions-row">
          <h2>{form.title}</h2>
          <div className="action-buttons">
            <button className="save-btn" onClick={handleSaveForm}>
              Save
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

      {/* Add Field Modals */}
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
        />
      )}

      {/* Existing Modals */}
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

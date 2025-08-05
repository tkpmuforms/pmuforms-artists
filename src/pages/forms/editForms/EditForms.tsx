import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { LoadingSmall } from "../../../components/loading/Loading";

import EditFormServices from "../../../components/formsComp/EditFormsServices";
import RenderEditFormsFields from "../../../components/formsComp/RenderEditForms";
import ServicesSection from "../../../components/formsComp/ServiceSection";
import useAuth from "../../../context/useAuth";
import { Section, Service, SingleForm } from "../../../redux/types";
import {
  getFormById,
  getServices,
  updateFormServices,
} from "../../../services/artistServices";
import "./edit-forms.scss";
import DeleteConfirmModal from "../../../components/formsComp/DeleteConfirmModal";

interface EditFormsProps {
  onClose?: () => void;
  formId?: string;
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

  // Field handlers
  const handleEditField = (field: any) => {
    setEditingField(field);
    console.log("Edit field:", field);
    // TODO: Implement field editing modal or inline editor
  };

  const handleDeleteField = (fieldId: string) => {
    if (window.confirm("Are you sure you want to delete this field?")) {
      console.log("Delete field:", fieldId);
      // TODO: Implement field deletion logic
      toast.success("Field deleted successfully");
    }
  };

  const handleShowConfirmDeleteModal = (field: any) => {
    setEditingField(field);
    setShowConfirmDeleteModal(true);
    console.log("Show confirm delete modal for field:", field);
  };

  const handleAddParagraph = (fieldId: string) => {
    console.log("Add paragraph to field:", fieldId);
    // TODO: Implement add paragraph functionality
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

        {/* Services Section */}
        <ServicesSection
          services={form?.services || []}
          allServices={allServices}
          onChangeServices={() => setShowServicesModal(true)}
          loading={servicesLoading}
        />

        {/* Form Sections */}
        {form.sections && form.sections.length > 0 ? (
          form.sections.map((section) => (
            <div key={section._id || section.id} className="form-section">
              <h3>{section.title}</h3>
              {section.data && section.data.length > 0 ? (
                <RenderEditFormsFields
                  fields={section.data}
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

      {showConfirmDeleteModal && (
        <DeleteConfirmModal
          onClose={() => setShowConfirmDeleteModal(false)}
          onConfirm={() => handleDeleteField(editingField?.id || "")}
          type="section"
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

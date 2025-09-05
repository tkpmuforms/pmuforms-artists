import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import {
  DeleteFormSvg,
  EditFormsSvg,
  PreviewAlertSvg,
} from "../../../assets/svgs/formsSvg";
import { renderPreviewFormFields } from "../../../components/formsComp/RenderPreviewFormFields";
import { LoadingSmall } from "../../../components/loading/Loading";
import useAuth from "../../../context/useAuth";
import { Section, SingleForm } from "../../../redux/types";
import {
  deleteFormTemplate,
  getFormById,
} from "../../../services/artistServices";
import "./preview-forms.scss";
import DeleteConfirmModal from "../../../components/formsComp/DeleteConfirmModal";

interface PreviewFormsProps {
  onClose?: () => void;
  formId?: string;
}

const PreviewForms: React.FC<PreviewFormsProps> = ({ formId, onClose }) => {
  const { formId: paramFormId } = useParams<{ formId?: string }>();
  const formTemplateId = formId || paramFormId;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<SingleForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        setLoading(true);

        const response = await getFormById(formTemplateId || "");
        console.log("API Response:", response);

        if (response?.data?.form) {
          const formData = response?.data?.form;

          const transformedForm: SingleForm = {
            id: formData.id || formData._id,
            title: formData.title,
            sections: formData.sections
              .filter((section: Section) => !section.skip)
              .map((section: Section) => ({
                ...section,
                _id: section._id || section.id,
              })),
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

    if (formTemplateId) {
      fetchForm();
    }
  }, [formTemplateId, user?.businessName]);

  const handleDelete = () => {
    deleteFormTemplate(formTemplateId || "")
      .then(() => {
        toast.success("Form deleted successfully");
        navigate("/forms");
      })
      .catch((error) => {
        console.error("Error deleting form:", error);
        toast.error("Failed to delete form");
      });
  };

  const handleEdit = () => {
    navigate(`/forms/edit/${formTemplateId}`);
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
      <div className="preview-dynamic-forms">
        <div className="no-forms">
          <p>No form found</p>
          {onClose && <button onClick={onClose}>Close</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="preview-dynamic-forms">
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
            <DeleteFormSvg onClick={() => setShowConfirmDeleteModal(true)} />
            <EditFormsSvg onClick={handleEdit} />
          </div>
        </div>
        <div className="preview-header">
          <div className="preview-info">
            <PreviewAlertSvg />
            <div className="preview-text">
              <h5>Preview Mode</h5>
              <p>
                This is a preview of what your customer will see online. Form
                completion happens online.
              </p>
            </div>
          </div>
        </div>

        {form.sections && form.sections.length > 0 ? (
          form.sections.map((section) => (
            <div key={section._id || section.id}>
              <h3>{section.title}</h3>
              {section.data && section.data.length > 0 ? (
                renderPreviewFormFields(section.data)
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
          onConfirm={handleDelete}
          type="form"
        />
      )}
    </div>
  );
};

export default PreviewForms;

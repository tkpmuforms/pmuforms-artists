import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { renderPreviewFormFields } from "../../../components/formsComp/RenderPreviewFormFields";
import useAuth from "../../../context/useAuth";
import { getFormById } from "../../../services/artistServices";
import "./preview-forms.scss";
import { Section, SingleForm } from "../../../redux/types";
import toast from "react-hot-toast";
import { LoadingSmall } from "../../../components/loading/Loading";
import {
  DeleteFormSvg,
  EditFormsSvg,
  PreviewAlertSvg,
} from "../../../assets/svgs/formsSvg";

dayjs.extend(utc);
dayjs.extend(timezone);

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

  if (!formTemplateId) {
    navigate("/forms");
    return null;
  }

  if (loading) {
    return <LoadingSmall />;
  }

  if (!form) {
    return (
      <div className="dynamic-forms">
        <div className="no-forms">
          <p>No form found</p>
          {onClose && <button onClick={onClose}>Close</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="dynamic-forms">
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
            <DeleteFormSvg onClick={() => console.log("Delete form")} />
            <EditFormsSvg onClick={() => console.log("Edit form")} />
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
                renderPreviewFormFields(section.data, form.id, {})
              ) : (
                <p>No fields in this section</p>
              )}
            </div>
          ))
        ) : (
          <p>No sections found in this form</p>
        )}
      </div>
    </div>
  );
};

export default PreviewForms;

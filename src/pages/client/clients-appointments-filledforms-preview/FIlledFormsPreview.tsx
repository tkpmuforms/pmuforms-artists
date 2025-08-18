import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import { LoadingSmall } from "../../../components/loading/Loading";
import useAuth from "../../../context/useAuth";
import {
  getFilledFormByAppointmentAndTemplate,
  getFormById,
} from "../../../services/artistServices";
import "./FIlledFormsPreview.scss";
import RenderFilledFormFields from "../../../components/clientsComp/filled-forms/RenderformsPreview";

interface FormSection {
  _id?: string;
  id?: string;
  title: string;
  data: unknown[];
  skip?: boolean;
}

interface Form {
  id: string;
  title: string;
  sections: FormSection[];
}

const FilledFormsPreview = () => {
  const { appointmentId, templateId } = useParams();
  const { user } = useAuth();
  const [form, setForm] = useState<Form | null>(null);
  const [filledData, setFilledData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch both the form template and filled data
        const [formResponse, filledResponse] = await Promise.all([
          getFormById(templateId || ""),
          getFilledFormByAppointmentAndTemplate(
            appointmentId || "",
            templateId || ""
          ),
        ]);

        // Process form template
        if (formResponse?.data?.form) {
          const formData = formResponse.data.form;
          const transformedForm = {
            id: formData.id || formData._id,
            title: formData.title,
            sections: formData.sections
              .filter((section: FormSection) => !section.skip)
              .map((section: FormSection) => ({
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
        }

        // Process filled data
        if (filledResponse?.data?.filledForm?.data) {
          setFilledData(filledResponse.data.filledForm.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load form data");
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId && templateId) {
      fetchData();
    }
  }, [appointmentId, templateId, user?.businessName]);

  if (loading) {
    return <LoadingSmall />;
  }

  if (!form) {
    return (
      <div className="preview-dynamic-forms">
        <div className="no-forms">
          <p>No form found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="preview-dynamic-forms">
      <div className="form-content">
        <div className="title-actions-row">
          <h2>{form?.title}</h2>
          <button
            className="view-pdf-button"
            style={{
              width: "171px",
              height: "48px",
              borderRadius: "16px",
              opacity: 1,
              paddingTop: "16px",
              paddingRight: "32px",
              paddingBottom: "16px",
              paddingLeft: "32px",
              gap: "8px",
              backgroundColor: "#D764D726",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              color: "#333",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => {
              // TODO: Implement PDF generation functionality
              console.log("Generate PDF clicked");
            }}
          >
            View as PDF
          </button>
        </div>

        <div className="preview-header">
          <div className="preview-info" style={{ background: "#e8f5e8" }}>
            <div className="preview-text">
              <h5 style={{ color: "#FF9500" }}>Filled Form Data</h5>
              <p style={{ color: "#FF9500" }}>
                This shows the data that was submitted by the customer for this
                appointment.
              </p>
            </div>
          </div>
        </div>

        {form?.sections && form.sections.length > 0 ? (
          form.sections.map((section) => (
            <div key={section._id || section.id}>
              <h3>{section.title}</h3>
              {section.data && section.data.length > 0 ? (
                <RenderFilledFormFields
                  fields={section.data}
                  filledData={filledData}
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
    </div>
  );
};

export default FilledFormsPreview;

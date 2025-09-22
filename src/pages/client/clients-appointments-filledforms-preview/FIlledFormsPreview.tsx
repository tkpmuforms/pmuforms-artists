import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import { LoadingSmall } from "../../../components/loading/Loading";
import useAuth from "../../../context/useAuth";
import {
  getFilledFormByAppointmentAndTemplate,
  getFormById,
  getAppointmentById,
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
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [formResponse, filledResponse, appointmentResponse] =
          await Promise.all([
            getFormById(templateId || ""),
            getFilledFormByAppointmentAndTemplate(
              appointmentId || "",
              templateId || ""
            ),
            getAppointmentById(appointmentId || ""),
          ]);

        if (appointmentResponse?.data?.appointment) {
          const appointment = appointmentResponse.data.appointment;
          if (appointment.signed === true && appointment.signature_url) {
            console.log("Appointment is signed");
            setSignatureUrl(appointment.signature_url);
          }
        }

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

          const updatedForm = JSON.parse(
            JSON.stringify(transformedForm).replace(
              /\(?\{\{user\.businessName\}\}\)?/g,
              user?.businessName || "Your Business Name"
            )
          );

          setForm(updatedForm);
        }

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

  const generatePDFWithPrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow pop-ups to generate PDF");
      return;
    }

    const formContent =
      document.querySelector(".form-content")?.innerHTML || "";

    // Signature HTML section that will be added if there's a signature URL
    const signatureSection = signatureUrl
      ? `
      <div class="signature-section">
        <h3>Customer Signature</h3>
        <div class="signature-container">
          <img src="${signatureUrl}" alt="Customer Signature" style="max-width: 300px; max-height: 150px; border-bottom: 1px solid #999;" />
        </div>
      </div>
    `
      : "";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${form?.title || "Form"}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h2 { color: #333; margin-bottom: 20px; }
            h3 { color: #444; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 30px; }
            .preview-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .preview-info h5 { color: #FF9500; margin: 0 0 5px 0; }
            .preview-info p { color: #FF9500; margin: 0; font-size: 14px; }
            .view-pdf-button { display: none; }
            .preview-header { display: none; }
            label { display: block; margin-bottom: 15px; font-weight: 500; }
            input, textarea { margin-top: 8px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
            .signature-section { margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; }
            .signature-container { margin-top: 15px; }
            @media print {
              body { margin: 0; }
              .no-print { display: none !important; }
              .preview-header { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${formContent}
          ${signatureSection}
        </body>
      </html>
    `);

    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

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
          <button className="view-pdf-button" onClick={generatePDFWithPrint}>
            View as PDF
          </button>
        </div>

        <div className="preview-header no-print">
          <div className="preview-info">
            <div className="preview-text">
              <h5>Filled Form Data</h5>
              <p>
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

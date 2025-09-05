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

  // const generatePDF = async () => {
  //   try {
  //     // Show loading state
  //     toast.loading("Generating PDF...", { id: "pdf-generation" });

  //     // Method 1: Using jsPDF (you'll need to install: npm install jspdf html2canvas)
  //     // const { jsPDF } = await import("jspdf");
  //     // const html2canvas = (await import("html2canvas")).default;

  //     // Get the form content element
  //     const element = document.querySelector(".form-content");
  //     if (!element) {
  //       throw new Error("Form content not found");
  //     }

  //     // Convert HTML to canvas
  //     // const canvas = await html2canvas(element as HTMLElement, {
  //     //   scale: 2,
  //     //   useCORS: true,
  //     //   allowTaint: true,
  //     // });

  //     // // Create PDF
  //     // const imgData = canvas.toDataURL("image/png");
  //     // const pdf = new jsPDF({
  //     //   orientation: "portrait",
  //     //   unit: "mm",
  //     //   format: "a4",
  //     // });

  //     const imgWidth = 210;
  //     const pageHeight = 295;
  //     const imgHeight = (canvas.height * imgWidth) / canvas.width;
  //     let heightLeft = imgHeight;
  //     let position = 0;

  //     // Add first page
  //     pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  //     heightLeft -= pageHeight;

  //     // Add additional pages if needed
  //     while (heightLeft >= 0) {
  //       position = heightLeft - imgHeight;
  //       pdf.addPage();
  //       pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  //       heightLeft -= pageHeight;
  //     }

  //     // Save the PDF
  //     const fileName = `${form?.title || "Form"}_${appointmentId}.pdf`;
  //     pdf.save(fileName);

  //     toast.success("PDF generated successfully!", { id: "pdf-generation" });
  //   } catch (error) {
  //     console.error("Error generating PDF:", error);
  //     toast.error("Failed to generate PDF", { id: "pdf-generation" });
  //   }
  // };

  // Alternative method using browser's print functionality
  const generatePDFWithPrint = () => {
    // Create a new window with only the form content
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow pop-ups to generate PDF");
      return;
    }

    const formContent =
      document.querySelector(".form-content")?.innerHTML || "";

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
            label { display: block; margin-bottom: 15px; font-weight: 500; }
            input, textarea { margin-top: 8px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
            @media print {
              body { margin: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${formContent}
        </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for content to load, then trigger print
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
          <button
            className="view-pdf-button"
            onClick={generatePDFWithPrint} // Using the advanced PDF generation method
            // onClick={generatePDFWithPrint} // Alternative: use browser print
          >
            View as PDF
          </button>
        </div>

        <div className="preview-header">
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

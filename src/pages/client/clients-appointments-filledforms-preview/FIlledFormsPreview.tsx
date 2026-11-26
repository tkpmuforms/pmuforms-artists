import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Link, useParams } from "react-router-dom";
import { LoadingSmall } from "../../../components/loading/Loading";
import FilledFormView, {
  FilledFormTemplate,
} from "../../../components/clientsComp/filled-forms/FilledFormView";
import useAuth from "../../../context/useAuth";
import {
  getAppointmentById,
  getFilledFormByAppointmentAndTemplate,
  getFilledFormsByAppointment,
  getFormById,
} from "../../../services/artistServices";
import { printFormsAsPdf } from "../../../utils/printForms";
import "./FIlledFormsPreview.scss";

interface LoadedForm {
  key: string;
  template: FilledFormTemplate;
  filledData: Record<string, unknown>;
}

/**
 * A client's filled forms for one appointment. With a templateId it shows
 * that one form; on the `/forms/all` route it shows every form, and the PDF
 * contains all of them with the signatures once at the end.
 */
const FilledFormsPreview = () => {
  const { id, appointmentId, templateId } = useParams();
  const showAll = !templateId;
  const { user } = useAuth();
  const [forms, setForms] = useState<LoadedForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  // who did the procedure, saved when the appointment was signed
  const [performedBy, setPerformedBy] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!appointmentId) return;

    const loadOne = async (): Promise<LoadedForm[]> => {
      const [formResponse, filledResponse] = await Promise.all([
        getFormById(templateId || ""),
        getFilledFormByAppointmentAndTemplate(appointmentId, templateId || ""),
      ]);
      const template = formResponse?.data?.form;
      if (!template) return [];
      return [
        {
          key: template.id || template._id,
          template,
          filledData: filledResponse?.data?.filledForm?.data || {},
        },
      ];
    };

    const loadAll = async (): Promise<LoadedForm[]> => {
      const response = await getFilledFormsByAppointment(appointmentId);
      const filledForms: Array<{
        id?: string;
        _id?: string;
        data?: Record<string, unknown>;
        formTemplate?: FilledFormTemplate;
      }> = response?.data?.filledForms || [];

      return filledForms
        .filter((filled) => filled.formTemplate)
        .map((filled) => ({
          key: filled.id || filled._id || filled.formTemplate!.title,
          template: filled.formTemplate!,
          filledData: filled.data || {},
        }));
    };

    const fetchData = async () => {
      try {
        setLoading(true);
        const [loaded, appointmentResponse] = await Promise.all([
          showAll ? loadAll() : loadOne(),
          getAppointmentById(appointmentId),
        ]);

        const appointment = appointmentResponse?.data?.appointment;
        setSignatureUrl(
          appointment?.signed && appointment?.signature_url
            ? appointment.signature_url
            : null,
        );
        setPerformedBy(
          appointment?.signed ? appointment?.performedBy?.name || null : null,
        );
        setForms(loaded);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load form data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [appointmentId, templateId, showAll]);

  const pdfTitle = showAll
    ? "Appointment forms"
    : forms[0]?.template.title || "Form";

  const handleViewPdf = async () => {
    const opened = await printFormsAsPdf({
      title: pdfTitle,
      contentHtml: contentRef.current?.innerHTML || "",
      customerSignatureUrl: signatureUrl,
      artistSignatureUrl: user?.signature_url,
      performedBy,
    });
    if (!opened) toast.error("Please allow pop-ups to generate PDF");
  };

  if (loading) {
    return <LoadingSmall />;
  }

  if (forms.length === 0) {
    return (
      <div className="preview-dynamic-forms">
        <div className="no-forms">
          <p>No form found</p>
        </div>
      </div>
    );
  }

  const pdfButton = (
    <button className="view-pdf-button" onClick={handleViewPdf}>
      {showAll ? "Download all as PDF" : "View as PDF"}
    </button>
  );

  return (
    <div className="preview-dynamic-forms">
      <div className="form-content">
        <div className="preview-header no-print">
          {showAll && (
            <div className="title-actions-row">
              <h2>All forms ({forms.length})</h2>
              {pdfButton}
            </div>
          )}
          <div className="preview-info">
            <div className="preview-text">
              <h5>Filled Form Data</h5>
              <p>
                This shows the data that was submitted by the customer for this
                appointment.
                {!showAll && (
                  <>
                    {" "}
                    <Link
                      className="all-forms-link"
                      to={`/clients/${id}/appointments/${appointmentId}/forms/all`}
                    >
                      See all forms for this appointment
                    </Link>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* only this goes into the PDF */}
        <div ref={contentRef} className="filled-forms-list">
          {forms.map((form) => (
            <FilledFormView
              key={form.key}
              template={form.template}
              filledData={form.filledData}
              businessName={user?.businessName}
              actions={showAll ? undefined : pdfButton}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilledFormsPreview;

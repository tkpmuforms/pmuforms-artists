import { FilePlus2, ScanLine } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import FormBuilder from "../../../components/formBuilder/FormBuilder";
import ScanStep from "../../../components/formBuilder/ScanStep";
import "../../../components/formBuilder/form-builder.scss";
import useAuth from "../../../context/useAuth";
import { BLANK_DRAFT, type ScanResult } from "../../../services/formBuilderServices";

type Mode = "scratch" | "scan";

/**
 * /forms/new: build a form from scratch or scan a paper one.
 * `?service=<id>` puts it on that service; `?mode=scratch|scan` skips the
 * choice.
 */
const NewFormPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const mode = (["scratch", "scan"] as Mode[]).find((m) => m === params.get("mode"));
  const serviceParam = Number(params.get("service"));
  const services = user?.services ?? [];
  const forService = services.find((s) => s.id === serviceParam);
  const [scan, setScan] = useState<ScanResult | null>(null);

  const choose = (next: Mode) => {
    const updated = new URLSearchParams(params);
    updated.set("mode", next);
    setParams(updated, { replace: true });
    setScan(null);
  };

  const done = (formId: string) => {
    toast.success("Form created");
    navigate(
      forService
        ? `/services?open=${forService.id}`
        : `/forms/preview/${encodeURIComponent(formId)}`,
    );
  };

  const cancel = () => navigate(forService ? `/services?open=${forService.id}` : "/forms");

  return (
    <div className="new-form-page">
      <header className="new-form-page__header">
        <h1>New form</h1>
        <p>
          {forService
            ? `For ${forService.service}. Clients booking it will get this form.`
            : "Your own form, alongside the ones from our library."}
        </p>
      </header>

      {!mode && (
        <div className="new-form-page__choices">
          <button type="button" className="new-form-page__choice" onClick={() => choose("scan")}>
            <ScanLine size={28} aria-hidden="true" />
            <strong>Scan a paper form</strong>
            <span>Take photos of the form you use now and we'll turn it into a digital one.</span>
          </button>
          <button
            type="button"
            className="new-form-page__choice"
            onClick={() => choose("scratch")}
          >
            <FilePlus2 size={28} aria-hidden="true" />
            <strong>Start from scratch</strong>
            <span>Add your own questions, checkboxes and signature line.</span>
          </button>
        </div>
      )}

      {mode === "scan" && !scan && (
        <ScanStep onScanned={setScan} onBuildInstead={() => choose("scratch")} />
      )}

      {((mode === "scan" && scan) || mode === "scratch") && (
        <FormBuilder
          key={scan ? "scan" : "scratch"}
          draft={scan?.draft ?? BLANK_DRAFT}
          notes={scan?.notes}
          source={scan ? "scan" : "scratch"}
          services={services}
          initialServiceIds={forService ? [forService.id] : []}
          onSaved={(form) => done(form.id)}
          onCancel={cancel}
        />
      )}
    </div>
  );
};

export default NewFormPage;

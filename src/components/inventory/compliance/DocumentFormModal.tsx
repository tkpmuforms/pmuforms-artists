import { Info, Plus, Trash2 } from "lucide-react";
import type React from "react";
import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  attachDocumentFile,
  createDocument,
  newRequestId,
  updateDocument,
  type ComplianceDoc,
  type DocumentDetailsInput,
  type DocumentType,
  type EvidenceKind,
  type RegulatoryDetails,
  type TestResult,
  type TestingDetails,
} from "../../../services/inventoryServices";
import { getApiErrorMessage } from "../../../utils/formLinks";
import InventoryModal from "../InventoryModal";
import { DOCUMENT_ACCEPT, fileProblem } from "./documentRules";
import { useComplianceCatalog } from "./useComplianceCatalog";
import "./compliance.scss";

export interface DocumentFormModalProps {
  productId: string;
  // set for a batch's own document
  batchId?: string;
  batchLabel?: string;
  // pre-selects the type (e.g. from a checklist item)
  docType?: string;
  // uploading a new version of this document
  supersedes?: ComplianceDoc;
  // editing this document's details
  editing?: ComplianceDoc;
  onClose: () => void;
  onSaved: (doc: ComplianceDoc) => void;
}

const emptyResult = (): TestResult => ({
  analyte: "",
  result: "",
  unit: "",
  detectionLimit: "",
  specification: "",
});

const trimOrUndefined = (value?: string | null) => {
  const text = value?.trim();
  return text ? text : undefined;
};

const hasAny = (obj: object) =>
  Object.values(obj).some((v) => (Array.isArray(v) ? v.length > 0 : v !== undefined));

/**
 * Adds a compliance document (with its file), uploads a new version of one,
 * or edits one's details. Batch documents only ever apply to their batch.
 */
const DocumentFormModal: React.FC<DocumentFormModalProps> = ({
  productId,
  batchId,
  batchLabel,
  docType,
  supersedes,
  editing,
  onClose,
  onSaved,
}) => {
  const { catalog, error: catalogError } = useComplianceCatalog();
  const source = editing ?? supersedes;
  const level: "product" | "batch" = source
    ? source.level
    : batchId
      ? "batch"
      : "product";
  const effectiveBatchId = source ? source.batchId ?? undefined : batchId;
  const locked = !!source;

  // one id per open, so a double-submit or retry creates one document
  const requestId = useRef(newRequestId());

  const [typeId, setTypeId] = useState(source?.docType ?? docType ?? "");
  const [evidenceKind, setEvidenceKind] = useState<EvidenceKind | "">(
    editing?.evidenceKind ?? supersedes?.evidenceKind ?? "",
  );
  const [title, setTitle] = useState(editing?.title ?? "");
  const [titleEdited, setTitleEdited] = useState(!!editing);
  const [issuer, setIssuer] = useState(editing?.issuer ?? supersedes?.issuer ?? "");
  const [documentNumber, setDocumentNumber] = useState(editing?.documentNumber ?? "");
  const [issueDate, setIssueDate] = useState(editing?.issueDate ?? "");
  const [expirationDate, setExpirationDate] = useState(editing?.expirationDate ?? "");
  const [notes, setNotes] = useState(editing?.notes ?? "");

  const startTesting = editing?.testing ?? {};
  const [laboratory, setLaboratory] = useState(startTesting.laboratory ?? "");
  const [testedDate, setTestedDate] = useState(startTesting.testedDate ?? "");
  const [method, setMethod] = useState(startTesting.method ?? "");
  const [scope, setScope] = useState(startTesting.scope ?? "");
  const [limitations, setLimitations] = useState(startTesting.limitations ?? "");
  const [results, setResults] = useState<TestResult[]>(
    startTesting.results?.length ? startTesting.results : [],
  );

  const startReg = editing?.regulatory ?? supersedes?.regulatory ?? {};
  const [program, setProgram] = useState(startReg.program ?? "");
  const [reference, setReference] = useState(editing?.regulatory?.reference ?? "");
  const [responsibleOrganization, setResponsibleOrganization] = useState(
    startReg.responsibleOrganization ?? "",
  );
  const [submittedDate, setSubmittedDate] = useState(editing?.regulatory?.submittedDate ?? "");
  const [lastUpdatedDate, setLastUpdatedDate] = useState(
    editing?.regulatory?.lastUpdatedDate ?? "",
  );
  const [verificationSource, setVerificationSource] = useState(
    editing?.regulatory?.verificationSource ?? "",
  );

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const types = useMemo(
    () => (catalog?.documentTypes ?? []).filter((t) => t.levels.includes(level)),
    [catalog, level],
  );
  const type: DocumentType | undefined = catalog?.documentTypes.find(
    (t) => t.id === typeId,
  );
  const evidenceOptions = (catalog?.evidenceKinds ?? []).filter((e) =>
    type?.evidence.includes(e.id),
  );
  const chosenEvidence =
    evidenceKind && type?.evidence.includes(evidenceKind)
      ? evidenceKind
      : type?.evidence[0] ?? "";
  const shownTitle = titleEdited ? title : title || type?.label || "";

  const chooseType = (id: string) => {
    setTypeId(id);
    setEvidenceKind("");
    if (!titleEdited) setTitle("");
  };

  const updateResult = (index: number, field: keyof TestResult, value: string) =>
    setResults((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));

  const onPickFile = (picked: File | null) => {
    setFileError(null);
    if (!picked) {
      setFile(null);
      return;
    }
    const problem = fileProblem(picked);
    if (problem) {
      setFile(null);
      setFileError(problem);
      return;
    }
    setFile(picked);
  };

  const details = (): DocumentDetailsInput => {
    const testing: TestingDetails | undefined = type?.testing
      ? {
          laboratory: trimOrUndefined(laboratory),
          testedDate: trimOrUndefined(testedDate),
          method: trimOrUndefined(method),
          scope: trimOrUndefined(scope),
          limitations: trimOrUndefined(limitations),
          results: results
            .filter((r) => r.analyte.trim() || r.result.trim())
            .map((r) => ({
              analyte: r.analyte.trim(),
              result: r.result.trim(),
              unit: trimOrUndefined(r.unit),
              detectionLimit: trimOrUndefined(r.detectionLimit),
              specification: trimOrUndefined(r.specification),
            })),
        }
      : undefined;
    const regulatory: RegulatoryDetails | undefined = type?.regulatory
      ? {
          program: trimOrUndefined(program),
          reference: trimOrUndefined(reference),
          responsibleOrganization: trimOrUndefined(responsibleOrganization),
          submittedDate: trimOrUndefined(submittedDate),
          lastUpdatedDate: trimOrUndefined(lastUpdatedDate),
          verificationSource: trimOrUndefined(verificationSource),
        }
      : undefined;
    return {
      evidenceKind: chosenEvidence as EvidenceKind,
      title: shownTitle.trim(),
      issuer: trimOrUndefined(issuer),
      documentNumber: trimOrUndefined(documentNumber),
      issueDate: trimOrUndefined(issueDate),
      expirationDate: trimOrUndefined(expirationDate),
      notes: trimOrUndefined(notes),
      testing: testing && hasAny(testing) ? testing : undefined,
      regulatory: regulatory && hasAny(regulatory) ? regulatory : undefined,
    };
  };

  const validate = () => {
    if (!type) return "Choose a document type.";
    if (!chosenEvidence) return "Choose what kind of evidence this is.";
    if (!shownTitle.trim()) return "Give the document a title.";
    if (issueDate && expirationDate && expirationDate < issueDate) {
      return "The expiration date is before the issue date.";
    }
    const half = results.find(
      (r) => (r.analyte.trim() && !r.result.trim()) || (!r.analyte.trim() && r.result.trim()),
    );
    if (type.testing && half) {
      return "Each test result needs both what was tested and the result.";
    }
    if (fileError) return fileError;
    return null;
  };

  const handleSave = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setSaving(true);

    if (editing) {
      try {
        const { data } = await updateDocument(editing.id, details());
        toast.success("Document updated");
        onSaved(data.document);
      } catch (e) {
        setError(getApiErrorMessage(e, "Could not save the document. Please try again."));
      } finally {
        setSaving(false);
      }
      return;
    }

    let created: ComplianceDoc;
    try {
      const { data } = await createDocument({
        ...details(),
        productId,
        batchId: effectiveBatchId,
        docType: typeId,
        supersedesId: supersedes?.id,
        requestId: requestId.current,
      });
      created = data.document;
    } catch (e) {
      setError(getApiErrorMessage(e, "Could not save the document. Please try again."));
      setSaving(false);
      return;
    }

    if (file) {
      try {
        const { data } = await attachDocumentFile(created.id, file);
        created = data.document;
      } catch (e) {
        toast.error(
          `The document was saved, but the file didn't upload: ${getApiErrorMessage(
            e,
            "please try again",
          )}. Open the document to attach it.`,
          { duration: 7000 },
        );
        setSaving(false);
        onSaved(created);
        return;
      }
    }

    toast.success(supersedes ? "New version uploaded" : "Document added");
    setSaving(false);
    onSaved(created);
  };

  const heading = editing
    ? "Edit document details"
    : supersedes
      ? "Upload a new version"
      : "Add a document";
  const scopeText =
    level === "batch"
      ? `Applies only to ${batchLabel ?? "this batch"}. It won't be shown for any other batch.`
      : "Applies to the product as a whole.";
  const wasReviewed = editing && ["reviewed", "verified"].includes(editing.status);

  return (
    <InventoryModal
      title={heading}
      subtitle={scopeText}
      onClose={onClose}
      wide
      footer={
        <>
          <button type="button" className="inv-btn" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className="inv-btn inv-btn--primary"
            onClick={handleSave}
            disabled={saving || !catalog}
          >
            {saving ? "Saving…" : editing ? "Save changes" : supersedes ? "Upload new version" : "Add document"}
          </button>
        </>
      }
    >
      {catalogError && (
        <p className="inv-error">Could not load document types. Close and try again.</p>
      )}
      {!catalog && !catalogError && <p className="inv-muted">Loading…</p>}

      {catalog && (
        <>
          {supersedes && (
            <div className="inv-banner inv-banner--info">
              <Info size={18} />
              <p>
                Replaces "{supersedes.title}". The old version is kept and marked
                Superseded, with its review history.
              </p>
            </div>
          )}
          {wasReviewed && (
            <div className="inv-banner inv-banner--amber">
              <Info size={18} />
              <p>
                This document has been {editing?.status === "verified" ? "verified" : "reviewed"}.
                Changing its details sends it back to Pending review, since the review
                was of the old details.
              </p>
            </div>
          )}

          <div className="inv-grid">
            <label className="inv-field inv-span-all">
              <span>Document type</span>
              <select
                value={typeId}
                onChange={(e) => chooseType(e.target.value)}
                disabled={locked}
                aria-label="Document type"
              >
                <option value="">Choose a type…</option>
                {catalog.sections.map((section) => {
                  const inSection = types.filter((t) => t.section === section.id);
                  if (!inSection.length) return null;
                  return (
                    <optgroup key={section.id} label={section.label}>
                      {inSection.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              {type?.caveat && <span className="inv-field__hint">{type.caveat}</span>}
            </label>

            {type && (
              <>
                <label className="inv-field">
                  <span>Kind of evidence</span>
                  <select
                    value={chosenEvidence}
                    onChange={(e) => setEvidenceKind(e.target.value as EvidenceKind)}
                    aria-label="Kind of evidence"
                  >
                    {evidenceOptions.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="inv-field">
                  <span>Title</span>
                  <input
                    value={shownTitle}
                    onChange={(e) => {
                      setTitleEdited(true);
                      setTitle(e.target.value);
                    }}
                    maxLength={200}
                    aria-label="Title"
                  />
                </label>
                <label className="inv-field">
                  <span>Issued by</span>
                  <input
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                    placeholder="Lab, certifier or manufacturer"
                    maxLength={200}
                    aria-label="Issued by"
                  />
                </label>
                <label className="inv-field">
                  <span>Document number</span>
                  <input
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    maxLength={200}
                    aria-label="Document number"
                  />
                </label>
                <label className="inv-field">
                  <span>Issue date</span>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    aria-label="Issue date"
                  />
                </label>
                <label className="inv-field">
                  <span>Expiration date</span>
                  <input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    aria-label="Expiration date"
                  />
                  <span className="inv-field__hint">Leave blank if it doesn't expire.</span>
                </label>
              </>
            )}
          </div>

          {type?.testing && (
            <>
              <p className="cp-subhead">Test details</p>
              <p className="inv-small">
                Record the results exactly as the report states them. An uploaded
                report doesn't mean the product passed; the results and the lab's
                specifications are shown as reported.
              </p>
              <div className="inv-grid">
                <label className="inv-field">
                  <span>Laboratory</span>
                  <input
                    value={laboratory}
                    onChange={(e) => setLaboratory(e.target.value)}
                    maxLength={200}
                    aria-label="Laboratory"
                  />
                </label>
                <label className="inv-field">
                  <span>Testing date</span>
                  <input
                    type="date"
                    value={testedDate}
                    onChange={(e) => setTestedDate(e.target.value)}
                    aria-label="Testing date"
                  />
                </label>
                <label className="inv-field inv-span-all">
                  <span>Test type or method</span>
                  <input
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    placeholder="e.g. ICP-MS, USP <61>"
                    maxLength={200}
                    aria-label="Test type or method"
                  />
                </label>
              </div>

              <div className="cp-results" aria-label="Test results">
                {results.map((row, index) => (
                  <div className="cp-results__row" key={index}>
                    <label className="inv-field">
                      <span>Tested for</span>
                      <input
                        value={row.analyte}
                        onChange={(e) => updateResult(index, "analyte", e.target.value)}
                        placeholder="Lead"
                        aria-label={`Result ${index + 1}: tested for`}
                      />
                    </label>
                    <label className="inv-field">
                      <span>Result</span>
                      <input
                        value={row.result}
                        onChange={(e) => updateResult(index, "result", e.target.value)}
                        placeholder="< 0.5"
                        aria-label={`Result ${index + 1}: result`}
                      />
                    </label>
                    <label className="inv-field">
                      <span>Unit</span>
                      <input
                        value={row.unit ?? ""}
                        onChange={(e) => updateResult(index, "unit", e.target.value)}
                        placeholder="ppm"
                        aria-label={`Result ${index + 1}: unit`}
                      />
                    </label>
                    <label className="inv-field">
                      <span>Detection limit</span>
                      <input
                        value={row.detectionLimit ?? ""}
                        onChange={(e) => updateResult(index, "detectionLimit", e.target.value)}
                        aria-label={`Result ${index + 1}: detection limit`}
                      />
                    </label>
                    <label className="inv-field">
                      <span>Specification</span>
                      <input
                        value={row.specification ?? ""}
                        onChange={(e) => updateResult(index, "specification", e.target.value)}
                        placeholder="≤ 10 ppm"
                        aria-label={`Result ${index + 1}: specification`}
                      />
                    </label>
                    <button
                      type="button"
                      className="inv-btn inv-btn--sm inv-btn--danger"
                      onClick={() => setResults((rows) => rows.filter((_, i) => i !== index))}
                      aria-label={`Remove result ${index + 1}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <div>
                  <button
                    type="button"
                    className="inv-btn inv-btn--sm"
                    onClick={() => setResults((rows) => [...rows, emptyResult()])}
                  >
                    <Plus size={14} /> Add a result
                  </button>
                </div>
              </div>

              <div className="inv-grid">
                <label className="inv-field">
                  <span>Testing scope</span>
                  <textarea
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                    placeholder="What was tested, as the report states it"
                    maxLength={3000}
                    aria-label="Testing scope"
                  />
                </label>
                <label className="inv-field">
                  <span>Limitations</span>
                  <textarea
                    value={limitations}
                    onChange={(e) => setLimitations(e.target.value)}
                    placeholder="What the report doesn't cover"
                    maxLength={3000}
                    aria-label="Limitations"
                  />
                </label>
              </div>
            </>
          )}

          {type?.regulatory && (
            <>
              <p className="cp-subhead">Registration details</p>
              <div className="inv-grid">
                <label className="inv-field">
                  <span>Regulatory program</span>
                  <input
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                    placeholder="e.g. MoCRA product listing"
                    maxLength={200}
                    aria-label="Regulatory program"
                  />
                </label>
                <label className="inv-field">
                  <span>Registration or listing reference</span>
                  <input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    maxLength={200}
                    aria-label="Registration or listing reference"
                  />
                </label>
                <label className="inv-field">
                  <span>Responsible organization</span>
                  <input
                    value={responsibleOrganization}
                    onChange={(e) => setResponsibleOrganization(e.target.value)}
                    maxLength={300}
                    aria-label="Responsible organization"
                  />
                </label>
                <label className="inv-field">
                  <span>Verification source</span>
                  <input
                    value={verificationSource}
                    onChange={(e) => setVerificationSource(e.target.value)}
                    placeholder="Where the reference can be checked"
                    maxLength={300}
                    aria-label="Verification source"
                  />
                </label>
                <label className="inv-field">
                  <span>Submitted or confirmed</span>
                  <input
                    type="date"
                    value={submittedDate}
                    onChange={(e) => setSubmittedDate(e.target.value)}
                    aria-label="Submitted or confirmed"
                  />
                </label>
                <label className="inv-field">
                  <span>Last updated</span>
                  <input
                    type="date"
                    value={lastUpdatedDate}
                    onChange={(e) => setLastUpdatedDate(e.target.value)}
                    aria-label="Last updated"
                  />
                </label>
              </div>
            </>
          )}

          {type && (
            <label className="inv-field">
              <span>Notes</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={3000}
                aria-label="Notes"
              />
            </label>
          )}

          {type && !editing && (
            <label className="inv-field">
              <span>File</span>
              <input
                type="file"
                accept={DOCUMENT_ACCEPT}
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                aria-label="File"
              />
              <span className="inv-field__hint">
                PDF or photo (JPG, PNG, WebP, HEIC), up to 20 MB. Stored privately.
              </span>
              {fileError && <span className="inv-field__error">{fileError}</span>}
            </label>
          )}
        </>
      )}

      {error && (
        <p className="inv-error" role="alert">
          {error}
        </p>
      )}
    </InventoryModal>
  );
};

export default DocumentFormModal;

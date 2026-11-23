import { Download, ExternalLink, Info, Paperclip } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import useAuth from "../../../context/useAuth";
import {
  attachDocumentFile,
  getDocument,
  getDocumentFileUrl,
  reviewDocument,
  type ComplianceDoc,
  type DocumentHistoryEntry,
} from "../../../services/inventoryServices";
import { getApiErrorMessage } from "../../../utils/formLinks";
import { byLabel, DOC_STATUS, formatDay, formatWhen } from "../../../utils/inventory";
import InventoryModal from "../InventoryModal";
import { DocStatusBadge } from "../StatusBadge";
import DocumentFormModal from "./DocumentFormModal";
import {
  DOCUMENT_ACCEPT,
  fileProblem,
  reviewProblem,
  type ReviewChoice,
} from "./documentRules";
import "./compliance.scss";

export interface DocumentDetailModalProps {
  documentId: string;
  onClose: () => void;
  // after a review, edit or new version
  onChanged?: () => void;
}

const REVIEW_CHOICES: { id: ReviewChoice; label: string }[] = [
  { id: "pending-review", label: "Pending review" },
  { id: "reviewed", label: "Reviewed" },
  { id: "verified", label: "Verified against issuer" },
  { id: "rejected", label: "Rejected" },
];

const statusText = (status?: string) =>
  status ? DOC_STATUS[status as keyof typeof DOC_STATUS]?.label ?? status : "";

const historyTitle = (entry: DocumentHistoryEntry) => {
  switch (entry.action) {
    case "uploaded":
      return "Added";
    case "file":
      return "File";
    case "edited":
      return "Details edited";
    case "superseded":
      return "Replaced by a newer version";
    default:
      return entry.fromStatus
        ? `${statusText(entry.fromStatus)} → ${statusText(entry.toStatus)}`
        : statusText(entry.toStatus);
  }
};

const show = (value?: string | null) => (value ? value : "—");

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** One document: its details, file, review and full history. */
const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  documentId,
  onClose,
  onChanged,
}) => {
  const auth = useAuth();
  const me = auth?.user?.userId ?? null;
  const [doc, setDoc] = useState<ComplianceDoc | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "edit" | "supersede">("view");

  const [reviewStatus, setReviewStatus] = useState<ReviewChoice | "">("");
  const [method, setMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await getDocument(documentId);
      setDoc(data.document);
      setLoadError(null);
    } catch (e) {
      setLoadError(getApiErrorMessage(e, "Could not load this document."));
    }
  }, [documentId]);

  useEffect(() => {
    load();
  }, [load]);

  const openFile = async (download: boolean) => {
    if (!doc) return;
    // open first, so the browser doesn't treat it as an unrequested pop-up
    const tab = download ? null : window.open("", "_blank");
    try {
      const { data } = await getDocumentFileUrl(doc.id, download);
      if (tab) {
        tab.opener = null;
        tab.location.href = data.url;
      } else {
        window.location.href = data.url;
      }
    } catch (e) {
      tab?.close();
      toast.error(getApiErrorMessage(e, "Could not open the file. Please try again."));
    }
  };

  const uploadFile = async (file: File | null) => {
    if (!file || !doc) return;
    const problem = fileProblem(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    setUploading(true);
    try {
      const { data } = await attachDocumentFile(doc.id, file);
      setDoc(data.document);
      toast.success(doc.file ? "File replaced" : "File attached");
      onChanged?.();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not upload the file. Please try again."));
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const saveReview = async () => {
    if (!doc) return;
    const problem = reviewProblem(reviewStatus, method, notes);
    if (problem) {
      setReviewError(problem);
      return;
    }
    setReviewError(null);
    setReviewing(true);
    try {
      const { data } = await reviewDocument(doc.id, {
        status: reviewStatus as ReviewChoice,
        method: method.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setDoc(data.document);
      setReviewStatus("");
      setMethod("");
      setNotes("");
      toast.success("Review saved");
      onChanged?.();
    } catch (e) {
      setReviewError(getApiErrorMessage(e, "Could not save the review. Please try again."));
    } finally {
      setReviewing(false);
    }
  };

  if (doc && mode !== "view") {
    return (
      <DocumentFormModal
        productId={doc.productId}
        batchId={doc.batchId ?? undefined}
        editing={mode === "edit" ? doc : undefined}
        supersedes={mode === "supersede" ? doc : undefined}
        onClose={() => setMode("view")}
        onSaved={(saved) => {
          onChanged?.();
          // after a new version, this shows the new version
          setDoc(saved);
          setMode("view");
        }}
      />
    );
  }

  const superseded = doc?.status === "superseded";
  const canReplaceFile = doc?.file ? doc.status === "uploaded" : !superseded;

  return (
    <InventoryModal
      title={doc?.title ?? "Document"}
      subtitle={doc ? `${doc.docTypeLabel} · ${doc.evidenceLabel}` : undefined}
      onClose={onClose}
      wide
    >
      {loadError && <p className="inv-error">{loadError}</p>}
      {!doc && !loadError && <p className="inv-muted">Loading…</p>}

      {doc && (
        <>
          <div className="cp__summary">
            <DocStatusBadge status={doc.status} />
            <span className="inv-small">
              {doc.level === "batch"
                ? "Applies only to this batch"
                : "Applies to the whole product"}
            </span>
          </div>

          {superseded && (
            <div className="inv-banner inv-banner--info">
              <Info size={18} />
              <p>Replaced by a newer version. Kept here with its history.</p>
            </div>
          )}
          {doc.caveat && (
            <div className="inv-banner inv-banner--info">
              <Info size={18} />
              <p>{doc.caveat}</p>
            </div>
          )}

          <dl className="inv-dl">
            <div>
              <dt>Kind of evidence</dt>
              <dd>{doc.evidenceLabel}</dd>
            </div>
            <div>
              <dt>Issued by</dt>
              <dd>{show(doc.issuer)}</dd>
            </div>
            <div>
              <dt>Document number</dt>
              <dd>{show(doc.documentNumber)}</dd>
            </div>
            <div>
              <dt>Issue date</dt>
              <dd>{formatDay(doc.issueDate)}</dd>
            </div>
            <div>
              <dt>Expiration date</dt>
              <dd>
                {doc.expirationDate ? formatDay(doc.expirationDate) : "Doesn't expire"}
                {doc.expiresSoon && " · expires soon"}
              </dd>
            </div>
            <div>
              <dt>Added</dt>
              <dd>
                {formatWhen(doc.createdAt)} by {byLabel(doc.uploadedBy, me)}
              </dd>
            </div>
            {doc.lastReview && (
              <div>
                <dt>Last review</dt>
                <dd>
                  {formatWhen(doc.lastReview.at)} by {byLabel(doc.lastReview.by, me)}
                  {doc.lastReview.method ? ` · ${doc.lastReview.method}` : ""}
                </dd>
              </div>
            )}
          </dl>
          {doc.notes && (
            <div>
              <p className="cp-subhead">Notes</p>
              <p className="inv-muted" style={{ whiteSpace: "pre-wrap" }}>
                {doc.notes}
              </p>
            </div>
          )}

          <div className="inv-card">
            <div className="inv-card__head">
              <h3>File</h3>
            </div>
            {doc.file ? (
              <div className="cp__summary">
                <span className="inv-muted">
                  <Paperclip size={14} /> {doc.file.name} · {formatSize(doc.file.size)}
                </span>
                <div className="inv-head__actions">
                  <button type="button" className="inv-btn inv-btn--sm" onClick={() => openFile(false)}>
                    <ExternalLink size={14} /> View file
                  </button>
                  <button type="button" className="inv-btn inv-btn--sm" onClick={() => openFile(true)}>
                    <Download size={14} /> Download
                  </button>
                </div>
              </div>
            ) : (
              <p className="inv-muted">No file is attached yet.</p>
            )}
            {canReplaceFile && (
              <div style={{ marginTop: 10 }}>
                <input
                  ref={fileInput}
                  type="file"
                  accept={DOCUMENT_ACCEPT}
                  hidden
                  aria-label={doc.file ? "Replacement file" : "File to attach"}
                  onChange={(e) => uploadFile(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  className="inv-btn inv-btn--sm"
                  onClick={() => fileInput.current?.click()}
                  disabled={uploading}
                >
                  <Paperclip size={14} />
                  {uploading ? "Uploading…" : doc.file ? "Replace file" : "Attach file"}
                </button>
                {doc.file && (
                  <span className="inv-small" style={{ marginLeft: 8 }}>
                    Only until it's reviewed; after that, upload a new version.
                  </span>
                )}
              </div>
            )}
          </div>

          {doc.testing && (
            <div className="inv-card">
              <h3>Test details</h3>
              <dl className="inv-dl">
                <div>
                  <dt>Laboratory</dt>
                  <dd>{show(doc.testing.laboratory)}</dd>
                </div>
                <div>
                  <dt>Testing date</dt>
                  <dd>{formatDay(doc.testing.testedDate)}</dd>
                </div>
                <div>
                  <dt>Test type or method</dt>
                  <dd>{show(doc.testing.method)}</dd>
                </div>
              </dl>
              {doc.testing.results?.length ? (
                <div className="inv-table-wrap" style={{ marginTop: 12 }}>
                  <table className="inv-table inv-table--cards">
                    <thead>
                      <tr>
                        <th>Tested for</th>
                        <th>Result (as reported)</th>
                        <th>Unit</th>
                        <th>Detection limit</th>
                        <th>Specification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doc.testing.results.map((r, i) => (
                        <tr key={i}>
                          <td data-label="Tested for" className="inv-strong">
                            {r.analyte}
                          </td>
                          <td data-label="Result">{r.result}</td>
                          <td data-label="Unit">{show(r.unit)}</td>
                          <td data-label="Detection limit">{show(r.detectionLimit)}</td>
                          <td data-label="Specification">{show(r.specification)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="inv-muted" style={{ marginTop: 10 }}>
                  No individual results recorded.
                </p>
              )}
              <dl className="inv-dl" style={{ marginTop: 12 }}>
                <div>
                  <dt>Testing scope</dt>
                  <dd>{show(doc.testing.scope)}</dd>
                </div>
                <div>
                  <dt>Limitations</dt>
                  <dd>{show(doc.testing.limitations)}</dd>
                </div>
              </dl>
            </div>
          )}

          {doc.regulatory && (
            <div className="inv-card">
              <h3>Registration details</h3>
              <dl className="inv-dl">
                <div>
                  <dt>Program</dt>
                  <dd>{show(doc.regulatory.program)}</dd>
                </div>
                <div>
                  <dt>Reference</dt>
                  <dd>{show(doc.regulatory.reference)}</dd>
                </div>
                <div>
                  <dt>Responsible organization</dt>
                  <dd>{show(doc.regulatory.responsibleOrganization)}</dd>
                </div>
                <div>
                  <dt>Submitted or confirmed</dt>
                  <dd>{formatDay(doc.regulatory.submittedDate)}</dd>
                </div>
                <div>
                  <dt>Last updated</dt>
                  <dd>{formatDay(doc.regulatory.lastUpdatedDate)}</dd>
                </div>
                <div>
                  <dt>Verification source</dt>
                  <dd>{show(doc.regulatory.verificationSource)}</dd>
                </div>
              </dl>
            </div>
          )}

          {!superseded && (
            <div className="inv-card cp-review">
              <h3>Review</h3>
              <p className="inv-small" style={{ margin: 0 }}>
                Record what you checked. Nothing is marked reviewed or verified
                automatically.
              </p>
              <div className="cp-review__choices" role="radiogroup" aria-label="Review status">
                {REVIEW_CHOICES.map((choice) => (
                  <label key={choice.id} className="inv-check">
                    <input
                      type="radio"
                      name="review-status"
                      value={choice.id}
                      checked={reviewStatus === choice.id}
                      onChange={() => setReviewStatus(choice.id)}
                    />
                    {choice.label}
                  </label>
                ))}
              </div>
              <label className="inv-field">
                <span>Verification method{reviewStatus === "verified" ? " (required)" : ""}</span>
                <input
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  maxLength={500}
                  aria-label="Verification method"
                />
                <span className="inv-field__hint">
                  How you checked it with the issuer, e.g. called the lab.
                </span>
              </label>
              <label className="inv-field">
                <span>Review notes{reviewStatus === "rejected" ? " (required)" : ""}</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={3000}
                  aria-label="Review notes"
                />
              </label>
              {reviewError && (
                <p className="inv-error" role="alert">
                  {reviewError}
                </p>
              )}
              <div className="inv-head__actions">
                <button
                  type="button"
                  className="inv-btn inv-btn--primary"
                  onClick={saveReview}
                  disabled={reviewing}
                >
                  {reviewing ? "Saving…" : "Save review"}
                </button>
                <button type="button" className="inv-btn" onClick={() => setMode("edit")}>
                  Edit details
                </button>
                <button type="button" className="inv-btn" onClick={() => setMode("supersede")}>
                  Upload new version
                </button>
              </div>
            </div>
          )}

          <div>
            <p className="cp-subhead" style={{ marginBottom: 10 }}>
              History
            </p>
            <ol className="inv-timeline" aria-label="Document history">
              {[...doc.history].reverse().map((entry, i) => (
                <li key={i}>
                  <strong>{historyTitle(entry)}</strong>
                  <div className="inv-small">
                    {formatWhen(entry.at)} · {byLabel(entry.by, me)}
                  </div>
                  {entry.method && <div className="inv-muted">Method: {entry.method}</div>}
                  {entry.notes && <div className="inv-muted">{entry.notes}</div>}
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
    </InventoryModal>
  );
};

export default DocumentDetailModal;

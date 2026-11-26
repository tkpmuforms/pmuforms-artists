import { FileText, FileX } from "lucide-react";
import type React from "react";
import type { ComplianceDoc } from "../../../services/inventoryServices";
import { formatDay } from "../../../utils/inventory";
import { DocStatusBadge } from "../StatusBadge";
import "./compliance.scss";

export interface DocumentListProps {
  documents: ComplianceDoc[];
  emptyText?: string;
  onOpen: (doc: ComplianceDoc) => void;
}

const Expiry: React.FC<{ doc: ComplianceDoc }> = ({ doc }) => {
  if (!doc.expirationDate) return null;
  if (doc.status === "expired") {
    return (
      <span className="cp-doclist__expiry cp-doclist__expiry--expired">
        Expired {formatDay(doc.expirationDate)}
      </span>
    );
  }
  if (doc.expiresSoon) {
    return (
      <span className="cp-doclist__expiry cp-doclist__expiry--soon">
        Expires soon · {formatDay(doc.expirationDate)}
      </span>
    );
  }
  return <span className="inv-small">Expires {formatDay(doc.expirationDate)}</span>;
};

/** Compact rows of documents, each with its own status. */
const DocumentList: React.FC<DocumentListProps> = ({ documents, emptyText, onOpen }) => {
  if (!documents.length) {
    return emptyText ? <p className="inv-muted">{emptyText}</p> : null;
  }

  return (
    <ul className="cp-doclist">
      {documents.map((doc) => (
        <li key={doc.id}>
          <button
            type="button"
            className="cp-doclist__row"
            onClick={() => onOpen(doc)}
            aria-label={`Open ${doc.title}`}
          >
            {doc.file ? (
              <FileText size={18} className="cp-doclist__row-icon" aria-label="File attached" />
            ) : (
              <FileX size={18} className="cp-doclist__row-icon" aria-label="No file attached" />
            )}
            <span className="cp-doclist__row-main">
              <span className="cp-doclist__row-title">{doc.title}</span>
              <span className="cp-doclist__row-meta">
                {" "}
                {doc.docTypeLabel} · {doc.evidenceLabel}
                {doc.issuer ? ` · ${doc.issuer}` : ""}
              </span>
            </span>
            <span className="cp-doclist__row-side">
              <DocStatusBadge status={doc.status} />
              <Expiry doc={doc} />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
};

export default DocumentList;

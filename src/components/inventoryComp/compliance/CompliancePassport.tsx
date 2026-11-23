import { AlertTriangle, ChevronDown, ChevronRight, Info, Plus, Upload } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import {
  getPassport,
  type ChecklistEntry,
  type ComplianceDoc,
  type Passport,
} from "../../../services/inventoryServices";
import { getApiErrorMessage } from "../../../utils/formLinks";
import { formatDay } from "../../../utils/inventory";
import { BatchStatusBadge, DocStatusBadge } from "../StatusBadge";
import DocumentDetailModal from "./DocumentDetailModal";
import DocumentFormModal from "./DocumentFormModal";
import DocumentList from "./DocumentList";
import "./compliance.scss";

export interface CompliancePassportProps {
  productId: string;
  // called after any document is added, edited or reviewed
  onChanged?: () => void;
}

interface UploadTarget {
  docType?: string;
  batchId?: string;
  batchLabel?: string;
}

const show = (value?: string | null) => (value ? value : "—");

const MISSING_LABELS: Record<string, string> = {
  manufacturer: "no manufacturer recorded",
  address: "address",
  website: "website",
  contact: "contact or support email",
};

/** One recommended document and what's on file for it. */
const ChecklistItemRow: React.FC<{
  item: ChecklistEntry;
  onUpload: () => void;
  onOpen: (doc: ComplianceDoc) => void;
}> = ({ item, onUpload, onOpen }) => (
  <li className="cp__item">
    <div className="cp__item-head">
      <span className="cp__item-title">
        {item.label}
        <DocStatusBadge status={item.status} />
      </span>
      {item.status === "not-provided" ? (
        <button
          type="button"
          className="inv-btn inv-btn--sm"
          onClick={onUpload}
          aria-label={`Upload ${item.label}`}
        >
          <Upload size={14} /> Upload
        </button>
      ) : (
        <button
          type="button"
          className="inv-btn inv-btn--link inv-btn--sm"
          onClick={onUpload}
          aria-label={`Add another ${item.label}`}
        >
          <Plus size={14} /> Add
        </button>
      )}
    </div>
    <DocumentList documents={item.documents} onOpen={onOpen} />
  </li>
);

/**
 * The product's Compliance & Safety tab. Shows each piece of evidence with
 * its own status; it never sums them up into one approval or safety badge.
 */
const CompliancePassport: React.FC<CompliancePassportProps> = ({ productId, onChanged }) => {
  const [passport, setPassport] = useState<Passport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upload, setUpload] = useState<UploadTarget | null>(null);
  const [openDocId, setOpenDocId] = useState<string | null>(null);
  const [showSuperseded, setShowSuperseded] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await getPassport(productId);
      setPassport(data.passport);
      setError(null);
    } catch (e) {
      setError(getApiErrorMessage(e, "Could not load this product's documentation."));
    }
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  const changed = () => {
    load();
    onChanged?.();
  };

  const openDoc = (doc: ComplianceDoc) => setOpenDocId(doc.id);

  if (error && !passport) {
    return (
      <div className="inv-card">
        <p className="inv-error">{error}</p>
        <button type="button" className="inv-btn inv-btn--sm" onClick={load} style={{ marginTop: 10 }}>
          Try again
        </button>
      </div>
    );
  }
  if (!passport) return <div className="inv-loading">Loading documentation…</div>;

  const m = passport.manufacturer;
  const missing = passport.manufacturerMissing.map((k) => MISSING_LABELS[k] ?? k);

  return (
    <div className="cp">
      <div className="inv-banner inv-banner--info">
        <Info size={18} />
        <p>{passport.disclaimer}</p>
      </div>

      <div className="inv-card cp__summary">
        <span className="cp__count">{passport.completeness.label}</span>
        <button type="button" className="inv-btn inv-btn--primary" onClick={() => setUpload({})}>
          <Plus size={16} /> Add document
        </button>
      </div>

      <section className="inv-card" aria-label="Product information">
        <h3>Product information</h3>
        {missing.length > 0 && (
          <div className="inv-banner inv-banner--amber" style={{ marginBottom: 12 }}>
            <AlertTriangle size={18} />
            <p>
              {m
                ? `Manufacturer details missing: ${missing.join(", ")}.`
                : "No manufacturer is recorded for this product."}{" "}
              Add them from the product's edit form or the manufacturer list.
            </p>
          </div>
        )}
        <dl className="inv-dl">
          <div>
            <dt>Manufacturer</dt>
            <dd>{show(m?.name)}</dd>
          </div>
          <div>
            <dt>Brand</dt>
            <dd>{show(passport.product.brand)}</dd>
          </div>
          <div>
            <dt>Country of manufacture</dt>
            <dd>{show(passport.product.countryOfManufacture ?? m?.country)}</dd>
          </div>
          <div>
            <dt>Ingredient documentation</dt>
            <dd>
              <DocStatusBadge status={passport.ingredientDocumentation} />
            </dd>
          </div>
          {m && (
            <>
              <div>
                <dt>Manufacturer address</dt>
                <dd>{show(m.address)}</dd>
              </div>
              <div>
                <dt>Website</dt>
                <dd>
                  {m.website ? (
                    <a href={m.website} target="_blank" rel="noopener noreferrer">
                      {m.website}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt>Contact</dt>
                <dd>{show(m.contact)}</dd>
              </div>
              <div>
                <dt>Support email</dt>
                <dd>{show(m.supportEmail)}</dd>
              </div>
              <div>
                <dt>Registration information</dt>
                <dd>{show(m.registrationInfo)}</dd>
              </div>
              <div>
                <dt>Responsible person</dt>
                <dd>
                  {m.responsiblePerson?.name
                    ? [m.responsiblePerson.name, m.responsiblePerson.contact]
                        .filter(Boolean)
                        .join(" · ")
                    : "—"}
                </dd>
              </div>
            </>
          )}
        </dl>
        {passport.product.description && (
          <p className="inv-muted" style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
            {passport.product.description}
          </p>
        )}
      </section>

      <section className="inv-card" aria-label="Ingredients">
        <h3>Ingredients</h3>
        {passport.ingredients.length ? (
          <div className="inv-table-wrap">
            <table className="inv-table inv-table--cards">
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>CAS number</th>
                  <th>CI number</th>
                  <th>Pigment identifier</th>
                  <th>Color additive info</th>
                  <th>Function</th>
                </tr>
              </thead>
              <tbody>
                {passport.ingredients.map((ing, i) => (
                  <tr key={`${ing.name}-${i}`}>
                    <td data-label="Ingredient" className="inv-strong">
                      {ing.name}
                    </td>
                    <td data-label="CAS number">{show(ing.casNumber)}</td>
                    <td data-label="CI number">{show(ing.ciNumber)}</td>
                    <td data-label="Pigment identifier">{show(ing.pigmentIdentifier)}</td>
                    <td data-label="Color additive info">{show(ing.colorAdditiveInfo)}</td>
                    <td data-label="Function">{show(ing.function)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="inv-muted">
            No ingredients entered. Add them from the product's edit form.
          </p>
        )}
        <p className="inv-small" style={{ marginTop: 8 }}>
          CAS and CI numbers are recorded where the manufacturer supplies them; they
          aren't required for every product.
        </p>
      </section>

      {passport.sections.map((section) => {
        if (!section.items.length && !section.otherDocuments.length) {
          return (
            <section key={section.id} className="inv-card" aria-label={section.label}>
              <div className="inv-card__head">
                <h3>{section.label}</h3>
                <button
                  type="button"
                  className="inv-btn inv-btn--sm"
                  onClick={() => setUpload({})}
                  aria-label={`Add document to ${section.label}`}
                >
                  <Plus size={14} /> Add document
                </button>
              </div>
              <p className="inv-muted">Nothing requested or on file.</p>
            </section>
          );
        }
        return (
          <section key={section.id} className="inv-card" aria-label={section.label}>
            <div className="inv-card__head">
              <h3>{section.label}</h3>
              <button
                type="button"
                className="inv-btn inv-btn--sm"
                onClick={() => setUpload({})}
                aria-label={`Add document to ${section.label}`}
              >
                <Plus size={14} /> Add document
              </button>
            </div>
            {section.items.length > 0 && (
              <ul className="cp__items">
                {section.items.map((item) => (
                  <ChecklistItemRow
                    key={`${item.docType}-${item.level}`}
                    item={item}
                    onUpload={() => setUpload({ docType: item.docType })}
                    onOpen={openDoc}
                  />
                ))}
              </ul>
            )}
            {section.otherDocuments.length > 0 && (
              <div className="cp__other">
                <h4>Also on file</h4>
                <DocumentList documents={section.otherDocuments} onOpen={openDoc} />
              </div>
            )}
          </section>
        );
      })}

      <section className="inv-card" aria-label="Batch documentation">
        <h3>Batch documentation</h3>
        <p className="inv-small" style={{ marginTop: -6, marginBottom: 12 }}>
          A batch's documents, such as its Certificate of Analysis, cover that batch
          only. They are never shown as covering any other batch.
        </p>
        {passport.batches.length === 0 && (
          <p className="inv-muted">No batches received yet.</p>
        )}
        {passport.batches.map((batch) => {
          const label = `Lot ${batch.lotNumber}`;
          const recalled = batch.status === "recalled";
          return (
            <div
              key={batch.batchId}
              className={`cp__batch ${recalled ? "cp__batch--recalled" : ""}`}
              aria-label={label}
            >
              <div className="cp__batch-head">
                <strong>{label}</strong>
                <BatchStatusBadge status={batch.status} />
                <span className="inv-small">Expires {formatDay(batch.expirationDate)}</span>
                {batch.requested > 0 && (
                  <span className="inv-small">
                    · {batch.provided} of {batch.requested} requested batch items provided
                  </span>
                )}
              </div>
              {recalled && (
                <p className="inv-error" style={{ marginBottom: 8 }}>
                  This batch has been recalled{batch.hold?.reason ? `: ${batch.hold.reason}` : ""}.
                </p>
              )}
              <p className="cp__batch-scope">Applies only to {label}.</p>
              {batch.items.length > 0 && (
                <ul className="cp__items">
                  {batch.items.map((item) => (
                    <ChecklistItemRow
                      key={`${item.docType}-${item.level}`}
                      item={item}
                      onUpload={() =>
                        setUpload({ docType: item.docType, batchId: batch.batchId, batchLabel: label })
                      }
                      onOpen={openDoc}
                    />
                  ))}
                </ul>
              )}
              {batch.otherDocuments.length > 0 && (
                <div className="cp__other">
                  <h4>Also on file for this batch</h4>
                  <DocumentList documents={batch.otherDocuments} onOpen={openDoc} />
                </div>
              )}
              <button
                type="button"
                className="inv-btn inv-btn--sm"
                style={{ marginTop: 10 }}
                onClick={() => setUpload({ batchId: batch.batchId, batchLabel: label })}
                aria-label={`Add document for ${label}`}
              >
                <Plus size={14} /> Add a document for this batch
              </button>
            </div>
          );
        })}
      </section>

      {passport.superseded.length > 0 && (
        <section className="inv-card" aria-label="Superseded documents">
          <button
            type="button"
            className="cp__toggle"
            onClick={() => setShowSuperseded((v) => !v)}
            aria-expanded={showSuperseded}
          >
            {showSuperseded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            Superseded documents ({passport.superseded.length})
          </button>
          {showSuperseded && (
            <div style={{ marginTop: 12 }}>
              <DocumentList documents={passport.superseded} onOpen={openDoc} />
            </div>
          )}
        </section>
      )}

      <section className="inv-card" aria-label="FDA resources">
        <h3>FDA resources</h3>
        <ul className="cp__resources">
          {passport.resources.map((r) => (
            <li key={r.url}>
              <a href={r.url} target="_blank" rel="noopener noreferrer">
                {r.title}
              </a>
            </li>
          ))}
        </ul>
      </section>

      {upload && (
        <DocumentFormModal
          productId={productId}
          batchId={upload.batchId}
          batchLabel={upload.batchLabel}
          docType={upload.docType}
          onClose={() => setUpload(null)}
          onSaved={() => {
            setUpload(null);
            changed();
          }}
        />
      )}
      {openDocId && (
        <DocumentDetailModal
          documentId={openDocId}
          onClose={() => setOpenDocId(null)}
          onChanged={changed}
        />
      )}
    </div>
  );
};

export default CompliancePassport;

import { AlertTriangle, CheckCircle2, FileUp, Info, Plus, Search } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import InventoryGate from "../../components/inventory/InventoryGate";
import InventoryModal from "../../components/inventory/InventoryModal";
import SupplierModal from "../../components/inventory/SupplierModal";
import DocumentFormModal from "../../components/inventory/compliance/DocumentFormModal";
import "../../components/inventory/inventory.scss";
import {
  type BatchDetail,
  type ComplianceDoc,
  type DuplicateLotError,
  type Product,
  type ReceiveInput,
  type ReceivingCheck,
  type Supplier,
  getProduct,
  getProducts,
  getReceivingCheck,
  getSuppliers,
  isDuplicateLot,
  newRequestId,
  receiveStock,
} from "../../services/inventoryServices";
import { getApiErrorMessage } from "../../utils/formLinks";
import { formatDay, formatQty, isAmount, todayLocal } from "../../utils/inventory";
import Field from "../../components/inventory/Field";

type Step = "product" | "details" | "review" | "done";

const STEPS: [Step, string][] = [
  ["product", "Product"],
  ["details", "Batch details"],
  ["review", "Review & confirm"],
  ["done", "Batch documents"],
];

interface Details {
  lotNumber: string;
  expirationDate: string;
  quantity: string;
  supplierId: string;
  purchaseDate: string;
  receivedDate: string;
  unitCost: string;
  totalCost: string;
  referenceId: string;
  notes: string;
}

const NEW = "__new__";

const ReceiveStockPage: React.FC = () => (
  <InventoryGate>
    <ReceiveStock />
  </InventoryGate>
);

const ReceiveStock: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [step, setStep] = useState<Step>("product");
  const [product, setProduct] = useState<Product | null>(null);
  const [details, setDetails] = useState<Details>({
    lotNumber: "",
    expirationDate: "",
    quantity: "",
    supplierId: "",
    purchaseDate: "",
    receivedDate: todayLocal(),
    unitCost: "",
    totalCost: "",
    referenceId: "",
    notes: "",
  });
  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [check, setCheck] = useState<ReceivingCheck | null>(null);

  // a product chosen from its own page
  useEffect(() => {
    const id = params.get("productId");
    if (!id) return;
    getProduct(id)
      .then(({ data }) => {
        if (data.product.inventoryType === "trackable" && data.product.status === "active") {
          choose(data.product);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (p: Product) => {
    setProduct(p);
    setDetails((d) => ({ ...d, supplierId: d.supplierId || p.defaultSupplierId || "" }));
    setStep("details");
  };

  const restart = () => {
    setBatch(null);
    setCheck(null);
    setDetails((d) => ({
      ...d,
      lotNumber: "",
      expirationDate: "",
      quantity: "",
      unitCost: "",
      totalCost: "",
      referenceId: "",
      notes: "",
    }));
    setStep(product ? "details" : "product");
  };

  const index = STEPS.findIndex(([id]) => id === step);

  return (
    <div className="inv-page" style={{ maxWidth: 860 }}>
      <ol className="inv-steps" aria-label="Steps">
        {STEPS.map(([id, label], i) => (
          <li
            key={id}
            aria-current={id === step ? "step" : undefined}
            className={i < index ? "inv-steps__done" : undefined}
          >
            <span>{i < index ? "✓" : i + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      {step === "product" && <ProductStep onChoose={choose} />}
      {step === "details" && product && (
        <DetailsStep
          product={product}
          details={details}
          setDetails={setDetails}
          onChangeProduct={() => setStep("product")}
          onNext={() => setStep("review")}
        />
      )}
      {step === "review" && product && (
        <ReviewStep
          product={product}
          details={details}
          onBack={() => setStep("details")}
          onReceived={(b, c) => {
            setBatch(b);
            setCheck(c);
            setStep("done");
          }}
        />
      )}
      {step === "done" && product && batch && (
        <DoneStep
          product={product}
          batch={batch}
          check={check}
          onView={() => navigate(`/inventory/batches/${batch.id}`)}
          onAnother={restart}
        />
      )}
    </div>
  );
};

// ------------------------------------------------------------------ step 1

const ProductStep: React.FC<{ onChoose: (p: Product) => void }> = ({ onChoose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      getProducts({ q: query, status: "active" })
        .then(({ data }) =>
          setProducts(data.products.filter((p) => p.inventoryType === "trackable")),
        )
        .catch(() => setProducts([]));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <section className="inv-card">
      <h3>Which product did you receive?</h3>
      <div className="inv-toolbar" style={{ marginBottom: 12 }}>
        <div className="inv-search">
          <Search size={16} />
          <input
            aria-label="Search products"
            placeholder="Search by name, brand or SKU"
            value={query}
            autoFocus
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button className="inv-btn" onClick={() => navigate("/inventory/products/new")}>
          <Plus size={16} /> New product
        </button>
      </div>
      {products === null ? (
        <div className="inv-loading">Loading…</div>
      ) : products.length === 0 ? (
        <div className="inv-empty">
          <p>
            {query
              ? "No tracked products match."
              : "No tracked products yet. Add one first, then receive its stock."}
          </p>
        </div>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
          {products.map((p) => (
            <li key={p.id}>
              <button
                className="inv-btn"
                style={{ width: "100%", justifyContent: "space-between", textAlign: "left" }}
                onClick={() => onChoose(p)}
              >
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.name}
                  <span className="inv-small" style={{ fontWeight: 400, marginLeft: 8 }}>
                    {[p.brand, p.sku].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="inv-small" style={{ fontWeight: 400 }}>
                  {formatQty(p.availableQty, p.unit)} available
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

// ------------------------------------------------------------------ step 2

const DetailsStep: React.FC<{
  product: Product;
  details: Details;
  setDetails: React.Dispatch<React.SetStateAction<Details>>;
  onChangeProduct: () => void;
  onNext: () => void;
}> = ({ product, details, setDetails, onChangeProduct, onNext }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof Details, string>>>({});
  const [showSupplier, setShowSupplier] = useState(false);

  useEffect(() => {
    getSuppliers()
      .then(({ data }) => setSuppliers(data.suppliers))
      .catch(() => {});
  }, []);

  const bind = (key: keyof Details) => ({
    value: details[key],
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => setDetails((d) => ({ ...d, [key]: e.target.value })),
  });

  const next = () => {
    const e: Partial<Record<keyof Details, string>> = {};
    if (!details.lotNumber.trim()) e.lotNumber = "Enter the lot number exactly as printed.";
    if (!details.expirationDate) e.expirationDate = "Enter the expiration date.";
    if (!isAmount(details.quantity) || Number(details.quantity) <= 0) {
      e.quantity = "Enter an amount above zero, up to 3 decimals.";
    }
    if (details.unitCost && !isAmount(details.unitCost, 2)) e.unitCost = "Use an amount like 12.50.";
    if (details.totalCost && !isAmount(details.totalCost, 2)) e.totalCost = "Use an amount like 120.00.";
    setErrors(e);
    if (!Object.keys(e).length) onNext();
  };

  return (
    <section className="inv-card">
      <div className="inv-card__head">
        <h3>{product.name}</h3>
        <button className="inv-btn inv-btn--link" onClick={onChangeProduct}>
          Change product
        </button>
      </div>
      <div className="inv-grid">
        <Field label="Lot / batch number">
          <input {...bind("lotNumber")} autoFocus autoComplete="off" />
          {errors.lotNumber ? (
            <span className="inv-field__error">{errors.lotNumber}</span>
          ) : (
            <span className="inv-field__hint">Kept exactly as typed, letters and leading zeros included.</span>
          )}
        </Field>
        <Field label="Expiration date">
          <input type="date" {...bind("expirationDate")} />
          {errors.expirationDate && <span className="inv-field__error">{errors.expirationDate}</span>}
        </Field>
        <Field label={<>Quantity received ({product.unit})</>}>
          <input {...bind("quantity")} inputMode="decimal" placeholder="e.g. 10" />
          {errors.quantity && <span className="inv-field__error">{errors.quantity}</span>}
        </Field>
        <div className="inv-field">
          <label htmlFor="inv-receive-supplier">Supplier</label>
          <select
            id="inv-receive-supplier"
            value={details.supplierId}
            onChange={(e) =>
              e.target.value === NEW
                ? setShowSupplier(true)
                : setDetails((d) => ({ ...d, supplierId: e.target.value }))
            }
          >
            <option value="">None</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
            <option value={NEW}>+ Add supplier…</option>
          </select>
        </div>
        <label className="inv-field">
          <span>Received date</span>
          <input type="date" {...bind("receivedDate")} />
        </label>
        <label className="inv-field">
          <span>Purchase date (optional)</span>
          <input type="date" {...bind("purchaseDate")} />
        </label>
        <Field label={<>Cost per {product.unit} (optional)</>}>
          <input {...bind("unitCost")} inputMode="decimal" placeholder="0.00" />
          {errors.unitCost && <span className="inv-field__error">{errors.unitCost}</span>}
        </Field>
        <Field label="Total cost (optional)">
          <input {...bind("totalCost")} inputMode="decimal" placeholder="0.00" />
          {errors.totalCost && <span className="inv-field__error">{errors.totalCost}</span>}
        </Field>
        <label className="inv-field">
          <span>Invoice or reference (optional)</span>
          <input {...bind("referenceId")} />
        </label>
        <label className="inv-field inv-span-2">
          <span>Notes (optional)</span>
          <textarea {...bind("notes")} />
        </label>
      </div>
      <div className="inv-modal__footer">
        <button className="inv-btn inv-btn--primary" onClick={next}>
          Review
        </button>
      </div>

      {showSupplier && (
        <SupplierModal
          onClose={() => setShowSupplier(false)}
          onSaved={(s) => {
            setSuppliers((list) => [...list, s]);
            setDetails((d) => ({ ...d, supplierId: s.id }));
            setShowSupplier(false);
          }}
        />
      )}
    </section>
  );
};

// ------------------------------------------------------------------ step 3

const ReviewStep: React.FC<{
  product: Product;
  details: Details;
  onBack: () => void;
  onReceived: (batch: BatchDetail, check: ReceivingCheck | null) => void;
}> = ({ product, details, onBack, onReceived }) => {
  const [check, setCheck] = useState<ReceivingCheck | null>(null);
  const [checkFailed, setCheckFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<DuplicateLotError | null>(null);
  // one id per receipt, so a double click or retry records it once
  const requestId = useRef(newRequestId());

  useEffect(() => {
    getReceivingCheck(product.id, {
      lotNumber: details.lotNumber.trim(),
      expirationDate: details.expirationDate,
    })
      .then(({ data }) => setCheck(data))
      .catch(() => setCheckFailed(true));
  }, [product.id, details.lotNumber, details.expirationDate]);

  const input = useMemo<ReceiveInput>(
    () => ({
      productId: product.id,
      lotNumber: details.lotNumber.trim(),
      expirationDate: details.expirationDate,
      quantity: details.quantity.trim(),
      supplierId: details.supplierId || undefined,
      purchaseDate: details.purchaseDate || undefined,
      receivedDate: details.receivedDate || undefined,
      unitCost: details.unitCost || undefined,
      totalCost: details.totalCost || undefined,
      referenceId: details.referenceId.trim() || undefined,
      notes: details.notes.trim() || undefined,
    }),
    [product.id, details],
  );

  const submit = async (addToBatchId?: string) => {
    setSaving(true);
    setError(null);
    try {
      const { data } = await receiveStock({
        ...input,
        addToBatchId,
        requestId: requestId.current,
      });
      onReceived(data.batch, check);
    } catch (e) {
      if (isDuplicateLot(e)) {
        setDuplicate(e);
        // confirming is a separate receipt
        requestId.current = newRequestId();
      } else {
        setError(getApiErrorMessage(e, "Couldn't receive the stock."));
      }
    } finally {
      setSaving(false);
    }
  };

  const expired = details.expirationDate && details.expirationDate < todayLocal();

  return (
    <>
      <section className="inv-card">
        <h3>Receiving</h3>
        <dl className="inv-dl">
          <div>
            <dt>Product</dt>
            <dd>{product.name}</dd>
          </div>
          <div>
            <dt>Lot</dt>
            <dd className="inv-strong">{details.lotNumber.trim()}</dd>
          </div>
          <div>
            <dt>Expires</dt>
            <dd>{formatDay(details.expirationDate)}</dd>
          </div>
          <div>
            <dt>Quantity</dt>
            <dd>{formatQty(details.quantity.trim(), product.unit)}</dd>
          </div>
        </dl>
      </section>

      <section className="inv-card">
        <h3>Product documentation</h3>
        {check === null && !checkFailed && <p className="inv-muted">Checking what's on file…</p>}
        {checkFailed && (
          <p className="inv-muted">Couldn't check the documentation. You can still receive the stock.</p>
        )}
        {check && (
          <>
            <p style={{ margin: "0 0 12px", fontSize: 14 }}>{check.completeness.label}</p>
            {check.warnings.length > 0 ? (
              <div className="inv-banner inv-banner--amber" role="status">
                <AlertTriangle size={18} />
                <div>
                  <strong>Before you confirm</strong>
                  <ul className="inv-warnings">
                    {check.warnings.map((w) => (
                      <li key={w.code}>{w.message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="inv-banner inv-banner--info">
                <CheckCircle2 size={18} />
                <p>All the recommended documents for this product are on file.</p>
              </div>
            )}
            <p className="inv-small" style={{ margin: "12px 0 0" }}>
              These are reminders and don't stop you receiving. {check.disclaimer}{" "}
              <a
                href={`/inventory/products/${product.id}?tab=compliance`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open the product's documentation
              </a>
            </p>
          </>
        )}
      </section>

      {expired && (
        <div className="inv-banner inv-banner--red" role="alert">
          <AlertTriangle size={18} />
          <div>
            <strong>This lot has already expired</strong>
            <p>It will be recorded, but it can't be used on clients.</p>
          </div>
        </div>
      )}

      {error && <p className="inv-error">{error}</p>}

      <div className="inv-head__actions" style={{ justifyContent: "flex-end" }}>
        <button className="inv-btn" onClick={onBack} disabled={saving}>
          Back
        </button>
        <button
          className="inv-btn inv-btn--primary"
          onClick={() => submit()}
          disabled={saving}
        >
          {saving ? "Receiving…" : `Receive ${formatQty(details.quantity.trim(), product.unit)}`}
        </button>
      </div>

      {duplicate && (
        <InventoryModal
          title={`Lot ${duplicate.batch.lotNumber} is already in stock`}
          onClose={() => setDuplicate(null)}
          footer={
            <>
              <button
                className="inv-btn"
                onClick={() => {
                  setDuplicate(null);
                  onBack();
                }}
              >
                Check the lot number
              </button>
              <button
                className="inv-btn inv-btn--primary"
                disabled={saving}
                onClick={() => {
                  const id = duplicate.batch.id;
                  setDuplicate(null);
                  submit(id);
                }}
              >
                Yes, add to this lot
              </button>
            </>
          }
        >
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
            You already have {formatQty(duplicate.batch.currentQty, duplicate.batch.unit)} of
            lot <strong>{duplicate.batch.lotNumber}</strong>, expiring{" "}
            {formatDay(duplicate.batch.expirationDate)}. Is this more of the same lot?
          </p>
          <p className="inv-small" style={{ margin: 0 }}>
            Adding to it keeps one lot with one history. Different lots are
            never merged.
          </p>
        </InventoryModal>
      )}
    </>
  );
};

// ------------------------------------------------------------------ step 4

const DoneStep: React.FC<{
  product: Product;
  batch: BatchDetail;
  check: ReceivingCheck | null;
  onView: () => void;
  onAnother: () => void;
}> = ({ product, batch, check, onView, onAnother }) => {
  const [uploading, setUploading] = useState<string | null>(null);
  const [added, setAdded] = useState<ComplianceDoc[]>(batch.documents?.batch ?? []);
  const checklist = check?.batchChecklist ?? [];

  return (
    <>
      <div className="inv-banner inv-banner--info" role="status">
        <CheckCircle2 size={18} color="#16a34a" />
        <div>
          <strong>
            Lot {batch.lotNumber} received: {formatQty(batch.currentQty, batch.unit)} in stock
          </strong>
          <p>
            {product.name} · expires {formatDay(batch.expirationDate)}
          </p>
        </div>
      </div>

      <section className="inv-card">
        <h3>Batch documents (optional)</h3>
        <p className="inv-muted" style={{ marginTop: 0 }}>
          Documents for this lot only, like its Certificate of Analysis. They
          won't be shown as covering any other lot.
        </p>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
          {checklist.map((item) => {
            const done = added.filter((d) => d.docType === item.docType);
            return (
              <li
                key={item.docType}
                className="inv-card"
                style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}
              >
                <span style={{ fontSize: 14 }}>
                  {item.label}
                  {done.length > 0 && (
                    <span className="inv-badge inv-badge--blue" style={{ marginLeft: 8 }}>
                      Uploaded
                    </span>
                  )}
                </span>
                <button className="inv-btn inv-btn--sm" onClick={() => setUploading(item.docType)}>
                  <FileUp size={14} /> {done.length ? "Add another" : "Upload"}
                </button>
              </li>
            );
          })}
        </ul>
        <button
          className="inv-btn inv-btn--link"
          style={{ marginTop: 8 }}
          onClick={() => setUploading("")}
        >
          <Plus size={14} /> Add another batch document
        </button>
        {added.filter((d) => !checklist.some((i) => i.docType === d.docType)).length > 0 && (
          <p className="inv-small">
            Also added:{" "}
            {added
              .filter((d) => !checklist.some((i) => i.docType === d.docType))
              .map((d) => d.title)
              .join(", ")}
          </p>
        )}
        <p className="inv-small" style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 0 }}>
          <Info size={14} /> You can also add these later from the batch page.
        </p>
      </section>

      <div className="inv-head__actions" style={{ justifyContent: "flex-end" }}>
        <button className="inv-btn" onClick={onAnother}>
          Receive another
        </button>
        <button className="inv-btn inv-btn--primary" onClick={onView}>
          View batch
        </button>
      </div>

      {uploading !== null && (
        <DocumentFormModal
          productId={product.id}
          batchId={batch.id}
          batchLabel={`Lot ${batch.lotNumber}`}
          docType={uploading || undefined}
          onClose={() => setUploading(null)}
          onSaved={(doc) => {
            setAdded((list) => [...list, doc]);
            setUploading(null);
          }}
        />
      )}
    </>
  );
};

export default ReceiveStockPage;

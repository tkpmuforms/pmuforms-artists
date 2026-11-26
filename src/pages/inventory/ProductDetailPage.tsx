import { Archive, ArchiveRestore, PackagePlus, Pencil } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import InventoryGate from "../../components/inventory/InventoryGate";
import InventoryModal from "../../components/inventory/InventoryModal";
import {
  BatchStatusBadge,
  StockStatusBadge,
} from "../../components/inventory/StatusBadge";
import CompliancePassport from "../../components/inventory/compliance/CompliancePassport";
import "../../components/inventory/inventory.scss";
import {
  type Batch,
  type Product,
  type UsageReportRow,
  getBatches,
  getProduct,
  getProductUsages,
  setProductArchived,
} from "../../services/inventoryServices";
import { getApiErrorMessage } from "../../utils/formLinks";
import { formatDay, formatQty, formatWhen } from "../../utils/inventory";

type Tab = "overview" | "batches" | "compliance" | "usage";

const TABS: [Tab, string][] = [
  ["overview", "Overview"],
  ["batches", "Inventory / Batches"],
  ["compliance", "Compliance & Safety"],
  ["usage", "Usage History"],
];

const ProductDetailPage: React.FC = () => (
  <InventoryGate>
    <ProductDetail />
  </InventoryGate>
);

const ProductDetail: React.FC = () => {
  const { productId = "" } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as Tab) || "overview";
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    () =>
      getProduct(productId)
        .then(({ data }) => setProduct(data.product))
        .catch((e) => setError(getApiErrorMessage(e, "Couldn't load the product."))),
    [productId],
  );

  useEffect(() => {
    load();
  }, [load]);

  const toggleArchive = async () => {
    if (!product) return;
    setBusy(true);
    try {
      const archive = product.status === "active";
      const { data } = await setProductArchived(product.id, archive);
      setProduct(data.product);
      toast.success(archive ? "Product archived" : "Product restored");
      setConfirmArchive(false);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Couldn't update the product."));
    } finally {
      setBusy(false);
    }
  };

  if (error) return <p className="inv-error">{error}</p>;
  if (!product) return <div className="inv-loading">Loading…</div>;

  const tracked = product.inventoryType === "trackable";
  const archived = product.status === "archived";

  return (
    <div className="inv-page">
      <div className="inv-head">
        <div>
          <h1>{product.name}</h1>
          <p>
            {[product.brand, product.manufacturerName, product.sku && `SKU ${product.sku}`]
              .filter(Boolean)
              .join(" · ") || product.categoryName}
          </p>
        </div>
        <div className="inv-head__actions">
          <button className="inv-btn" onClick={() => setConfirmArchive(true)}>
            {archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
            {archived ? "Restore" : "Archive"}
          </button>
          <button
            className="inv-btn"
            onClick={() => navigate(`/inventory/products/${product.id}/edit`)}
          >
            <Pencil size={16} /> Edit
          </button>
          {tracked && !archived && (
            <button
              className="inv-btn inv-btn--primary"
              onClick={() => navigate(`/inventory/receive?productId=${product.id}`)}
            >
              <PackagePlus size={16} /> Receive stock
            </button>
          )}
        </div>
      </div>

      {archived && (
        <div className="inv-banner inv-banner--info" role="status">
          <div>
            <strong>Archived</strong>
            <p>
              It's hidden from your catalog and can't be used on clients. Its
              batches, history and client records are kept.
            </p>
          </div>
        </div>
      )}

      <div className="inv-tabs" role="tablist">
        {TABS.filter(([id]) => tracked || id !== "batches").map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setParams({ tab: id }, { replace: true })}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab product={product} />}
      {tab === "batches" && tracked && <BatchesTab product={product} />}
      {tab === "compliance" && <CompliancePassport productId={product.id} />}
      {tab === "usage" && <UsageTab productId={product.id} />}

      {confirmArchive && (
        <InventoryModal
          title={archived ? "Restore this product?" : "Archive this product?"}
          onClose={() => setConfirmArchive(false)}
          footer={
            <>
              <button className="inv-btn" onClick={() => setConfirmArchive(false)}>
                Cancel
              </button>
              <button className="inv-btn inv-btn--primary" onClick={toggleArchive} disabled={busy}>
                {archived ? "Restore" : "Archive"}
              </button>
            </>
          }
        >
          <p className="inv-muted" style={{ margin: 0 }}>
            {archived
              ? "It will be back in your catalog and can be received and used again."
              : "It will leave your catalog and can't be used on new treatments. Nothing is deleted: its stock history and every client record that used it stay as they are."}
          </p>
        </InventoryModal>
      )}
    </div>
  );
};

// ---------------------------------------------------------------- overview

const OverviewTab: React.FC<{ product: Product }> = ({ product }) => {
  const tracked = product.inventoryType === "trackable";
  return (
    <>
      {tracked && (
        <div className="inv-stats">
          <div className="inv-stat">
            <div className="inv-stat__value">{formatQty(product.availableQty, product.unit)}</div>
            <div className="inv-stat__label">Available to use</div>
          </div>
          <div className="inv-stat">
            <div className="inv-stat__value">{formatQty(product.onHandQty, product.unit)}</div>
            <div className="inv-stat__label">On hand, incl. expired or held</div>
          </div>
          <div className="inv-stat">
            <div className="inv-stat__value">{product.batchCount}</div>
            <div className="inv-stat__label">Batches</div>
          </div>
          <div className="inv-stat">
            <div className="inv-stat__value" style={{ fontSize: 18 }}>
              {formatDay(product.earliestExpiration)}
            </div>
            <div className="inv-stat__label">Next expiration</div>
          </div>
        </div>
      )}

      <section className="inv-card">
        <div className="inv-card__head">
          <h3>Details</h3>
          <StockStatusBadge status={product.stockStatus} />
        </div>
        <dl className="inv-dl">
          <Item label="Category" value={product.categoryName} />
          <Item label="Stock tracking" value={tracked ? "Tracked by lot" : "Not tracked"} />
          <Item label="Unit" value={product.unit} />
          {tracked && (
            <Item
              label="Low stock level"
              value={product.lowStockThreshold ? formatQty(product.lowStockThreshold, product.unit) : null}
            />
          )}
          <Item label="Brand" value={product.brand} />
          <Item label="Manufacturer" value={product.manufacturerName} />
          <Item label="Country of manufacture" value={product.countryOfManufacture} />
          <Item label="SKU" value={product.sku} />
          <Item label="Barcode" value={product.barcode} />
          <Item label={`Cost per ${product.unit}`} value={product.costPerUnit} />
          <Item label="Product type" value={product.productType} />
          <Item label="Keywords" value={product.keywords.join(", ")} />
        </dl>
        {product.description && (
          <p style={{ marginBottom: 0, fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {product.description}
          </p>
        )}
      </section>

      <section className="inv-card">
        <h3>Ingredients</h3>
        {product.ingredients.length === 0 ? (
          <p className="inv-small" style={{ margin: 0 }}>
            None entered. Add them from Edit, or upload the manufacturer's list
            under Compliance &amp; Safety.
          </p>
        ) : (
          <div className="inv-table-wrap">
            <table className="inv-table inv-table--cards">
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>CAS</th>
                  <th>CI</th>
                  <th>Pigment</th>
                  <th>Function</th>
                </tr>
              </thead>
              <tbody>
                {product.ingredients.map((ing, i) => (
                  <tr key={i}>
                    <td data-label="Ingredient" className="inv-strong">{ing.name}</td>
                    <td data-label="CAS">{ing.casNumber || "—"}</td>
                    <td data-label="CI">{ing.ciNumber || "—"}</td>
                    <td data-label="Pigment">{ing.pigmentIdentifier || "—"}</td>
                    <td data-label="Function">{ing.function || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
};

const Item: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div>
    <dt>{label}</dt>
    <dd>{value || "—"}</dd>
  </div>
);

// ----------------------------------------------------------------- batches

const BatchesTab: React.FC<{ product: Product }> = ({ product }) => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<Batch[] | null>(null);
  const [showEmpty, setShowEmpty] = useState(false);

  useEffect(() => {
    getBatches({ productId: product.id })
      .then(({ data }) => setBatches(data.batches))
      .catch(() => setBatches([]));
  }, [product.id]);

  if (batches === null) return <div className="inv-loading">Loading batches…</div>;

  const shown = showEmpty ? batches : batches.filter((b) => b.status !== "depleted");
  const hidden = batches.length - shown.length;

  if (!batches.length) {
    return (
      <div className="inv-card inv-empty">
        <h3>No stock received yet</h3>
        <p>Receive stock to record its lot number and expiration.</p>
        {product.status === "active" && (
          <button
            className="inv-btn inv-btn--primary"
            onClick={() => navigate(`/inventory/receive?productId=${product.id}`)}
          >
            <PackagePlus size={16} /> Receive stock
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="inv-table-wrap">
        <table className="inv-table inv-table--cards">
          <thead>
            <tr>
              <th>Lot</th>
              <th>Expires</th>
              <th>Received</th>
              <th>Supplier</th>
              <th className="inv-num">In stock</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((b) => (
              <tr
                key={b.id}
                className="inv-row-link"
                onClick={() => navigate(`/inventory/batches/${b.id}`)}
              >
                <td data-label="Lot" className="inv-strong">{b.lotNumber}</td>
                <td data-label="Expires">{formatDay(b.expirationDate)}</td>
                <td data-label="Received">{formatDay(b.receivedDate)}</td>
                <td data-label="Supplier">{b.supplierName ?? "—"}</td>
                <td data-label="In stock" className="inv-num">
                  {formatQty(b.currentQty, b.unit)}
                  <div className="inv-small">of {formatQty(b.originalQty, b.unit)}</div>
                </td>
                <td data-label="Status">
                  <BatchStatusBadge status={b.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(hidden > 0 || showEmpty) && (
        <button className="inv-btn inv-btn--link" onClick={() => setShowEmpty((v) => !v)}>
          {showEmpty ? "Hide used-up batches" : `Show ${hidden} used-up batch${hidden === 1 ? "" : "es"}`}
        </button>
      )}
    </>
  );
};

// ------------------------------------------------------------------- usage

const UsageTab: React.FC<{ productId: string }> = ({ productId }) => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<UsageReportRow[] | null>(null);

  useEffect(() => {
    getProductUsages(productId)
      .then(({ data }) => setRows(data.usages))
      .catch(() => setRows([]));
  }, [productId]);

  if (rows === null) return <div className="inv-loading">Loading…</div>;
  if (!rows.length) {
    return (
      <div className="inv-card inv-empty">
        <h3>Not used on any clients yet</h3>
        <p>When you record this product on an appointment, it shows up here with the exact lot.</p>
      </div>
    );
  }

  return (
    <div className="inv-table-wrap">
      <table className="inv-table inv-table--cards">
        <thead>
          <tr>
            <th>Used</th>
            <th>Client</th>
            <th>Treatment</th>
            <th>Lot</th>
            <th className="inv-num">Quantity</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.usageId}
              className="inv-row-link"
              onClick={() => navigate(`/clients/${r.customerId}`)}
            >
              <td data-label="Used">{formatWhen(r.usedAt)}</td>
              <td data-label="Client" className="inv-strong">{r.customerName ?? "Client"}</td>
              <td data-label="Treatment">{r.treatment ?? "—"}</td>
              <td data-label="Lot">{r.lotNumber}</td>
              <td data-label="Quantity" className="inv-num">{formatQty(r.quantity, r.unit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductDetailPage;

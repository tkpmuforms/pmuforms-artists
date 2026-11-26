import { PackagePlus, Plus, Search, Settings } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import InventoryGate from "../../components/inventoryComp/InventoryGate";
import {
  BatchStatusBadge,
  StockStatusBadge,
} from "../../components/inventoryComp/StatusBadge";
import "../../components/inventoryComp/inventory.scss";
import {
  type Batch,
  type BatchStatus,
  type Category,
  type Overview,
  type Product,
  type StockStatus,
  type Transaction,
  type TxnType,
  getBatches,
  getCategories,
  getOverview,
  getProducts,
  getTransactions,
} from "../../services/inventoryServices";
import { getApiErrorMessage } from "../../utils/formLinks";
import {
  BATCH_STATUS,
  STOCK_STATUS,
  TXN_LABELS,
  formatDay,
  formatDelta,
  formatQty,
  formatWhen,
} from "../../utils/inventory";

type Tab = "products" | "batches" | "history";

const useDebounced = (value: string, ms = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
};

const InventoryPage: React.FC = () => (
  <InventoryGate>
    <InventoryHome />
  </InventoryGate>
);

const InventoryHome: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as Tab) || "products";
  const [overview, setOverview] = useState<Overview | null>(null);

  // filters live in the URL, so Back returns to the same view
  const setParam = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    // a new filter starts again from the first page
    if (key !== "page") next.delete("page");
    setParams(next, { replace: true });
  };

  useEffect(() => {
    getOverview()
      .then(({ data }) => setOverview(data))
      .catch(() => setOverview(null));
  }, []);

  const showProducts = (stockStatus?: StockStatus) => {
    const next = new URLSearchParams();
    next.set("tab", "products");
    if (stockStatus) next.set("stock", stockStatus);
    setParams(next, { replace: true });
  };
  const showBatches = (status?: BatchStatus) => {
    const next = new URLSearchParams();
    next.set("tab", "batches");
    if (status) next.set("status", status);
    setParams(next, { replace: true });
  };

  const stock = params.get("stock") as StockStatus | null;
  const batchStatus = params.get("status") as BatchStatus | null;

  return (
    <div className="inv-page">
      <div className="inv-head">
        <div>
          <p>
            Your products, every lot you've received, and where each one was
            used.
          </p>
        </div>
        <div className="inv-head__actions">
          <button
            className="inv-btn"
            onClick={() => navigate("/inventory/settings")}
          >
            <Settings size={16} /> Settings
          </button>
          <button
            className="inv-btn"
            onClick={() => navigate("/inventory/products/new")}
          >
            <Plus size={16} /> Add product
          </button>
          <button
            className="inv-btn inv-btn--primary"
            onClick={() => navigate("/inventory/receive")}
          >
            <PackagePlus size={16} /> Receive stock
          </button>
        </div>
      </div>

      {overview && (
        <div className="inv-stats" aria-label="Inventory summary">
          <Stat
            label="Active products"
            value={overview.activeProducts}
            onClick={() => showProducts()}
            active={tab === "products" && !stock}
          />
          <Stat
            label="Low stock"
            value={overview.lowStockProducts}
            tone={overview.lowStockProducts ? "warn" : undefined}
            onClick={() => showProducts("low-stock")}
            active={tab === "products" && stock === "low-stock"}
          />
          <Stat
            label="Out of stock"
            value={overview.outOfStockProducts}
            tone={overview.outOfStockProducts ? "bad" : undefined}
            onClick={() => showProducts("out-of-stock")}
            active={tab === "products" && stock === "out-of-stock"}
          />
          <Stat
            label={`Expiring within ${overview.expiryWarningDays} days`}
            value={overview.expiringSoonBatches}
            tone={overview.expiringSoonBatches ? "warn" : undefined}
            onClick={() => showBatches("expiring-soon")}
            active={tab === "batches" && batchStatus === "expiring-soon"}
          />
          <Stat
            label="Expired, still in stock"
            value={overview.expiredBatches}
            tone={overview.expiredBatches ? "bad" : undefined}
            onClick={() => showBatches("expired")}
            active={tab === "batches" && batchStatus === "expired"}
          />
          <Stat
            label="Quarantined or recalled"
            value={overview.heldBatches}
            tone={overview.heldBatches ? "bad" : undefined}
            onClick={() => showBatches("recalled")}
            active={
              tab === "batches" &&
              (batchStatus === "recalled" || batchStatus === "quarantined")
            }
          />
        </div>
      )}

      <div className="inv-tabs" role="tablist">
        {(
          [
            ["products", "Products"],
            ["batches", "Batches"],
            ["history", "History"],
          ] as [Tab, string][]
        ).map(([id, label]) => (
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

      {tab === "products" && <ProductsTab params={params} setParam={setParam} />}
      {tab === "batches" && <BatchesTab params={params} setParam={setParam} />}
      {tab === "history" && <HistoryTab params={params} setParam={setParam} />}
    </div>
  );
};

const Stat: React.FC<{
  label: string;
  value: number;
  tone?: "warn" | "bad";
  onClick?: () => void;
  active?: boolean;
}> = ({ label, value, tone, onClick, active }) => (
  <button
    className={`inv-stat inv-stat--button ${tone ? `inv-stat--${tone}` : ""} ${
      active ? "inv-stat--active" : ""
    }`}
    onClick={onClick}
    aria-pressed={active}
  >
    <div className="inv-stat__value">{value}</div>
    <div className="inv-stat__label">{label}</div>
  </button>
);

interface TabProps {
  params: URLSearchParams;
  setParam: (key: string, value?: string) => void;
}

// ---------------------------------------------------------------- products

const PRODUCTS_PER_PAGE = 25;

const ProductsTab: React.FC<TabProps> = ({ params, setParam }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const q = useDebounced(query);
  const categoryId = params.get("category") ?? "";
  const stockStatus = (params.get("stock") ?? "") as StockStatus | "";
  const archived = params.get("archived") === "1";
  const page = Number(params.get("page") ?? "1") || 1;
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCategories()
      .then(({ data }) => setCategories(data.categories))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let live = true;
    setError(null);
    getProducts({
      q,
      categoryId: categoryId || undefined,
      stockStatus: stockStatus || undefined,
      status: archived ? "archived" : "active",
      page,
      perPage: PRODUCTS_PER_PAGE,
    })
      .then(({ data }) => {
        if (!live) return;
        setProducts(data.products);
        setTotal(data.total ?? data.products.length);
      })
      .catch((e) => {
        if (!live) return;
        setProducts([]);
        setError(getApiErrorMessage(e, "Couldn't load products."));
      });
    return () => {
      live = false;
    };
  }, [q, categoryId, stockStatus, archived, page]);

  const filtered = !!(q || categoryId || stockStatus || archived);
  const pages = Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE));

  return (
    <>
      <div className="inv-toolbar">
        <div className="inv-search">
          <Search size={16} />
          <input
            aria-label="Search products"
            placeholder="Search by name, brand, SKU or manufacturer"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setParam("q", e.target.value || undefined);
            }}
          />
        </div>
        <select
          aria-label="Category"
          value={categoryId}
          onChange={(e) => setParam("category", e.target.value || undefined)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Stock"
          value={stockStatus}
          onChange={(e) => setParam("stock", e.target.value || undefined)}
        >
          <option value="">Any stock level</option>
          {(Object.keys(STOCK_STATUS) as StockStatus[]).map((s) => (
            <option key={s} value={s}>
              {STOCK_STATUS[s].label}
            </option>
          ))}
        </select>
        <label className="inv-check">
          <input
            type="checkbox"
            checked={archived}
            onChange={(e) => setParam("archived", e.target.checked ? "1" : undefined)}
          />
          Archived
        </label>
      </div>

      {error && <p className="inv-error">{error}</p>}

      {products === null ? (
        <div className="inv-loading">Loading products…</div>
      ) : products.length === 0 && page > 1 ? (
        // past the end, e.g. after archiving the last product on a page
        <Pager page={page} pages={pages} setParam={setParam} />
      ) : products.length === 0 ? (
        <div className="inv-card inv-empty">
          {filtered ? (
            <>
              <h3>No products match</h3>
              <p>Try a different search or filter.</p>
            </>
          ) : (
            <>
              <h3>No products yet</h3>
              <p>
                Add the pigments, numbing creams and other products you use,
                then receive stock lot by lot.
              </p>
              <button
                className="inv-btn inv-btn--primary"
                onClick={() => navigate("/inventory/products/new")}
              >
                <Plus size={16} /> Add your first product
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="inv-table-wrap">
          <table className="inv-table inv-table--cards">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th className="inv-num">Available</th>
                <th>Next expiration</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="inv-row-link"
                  onClick={() => navigate(`/inventory/products/${p.id}`)}
                >
                  <td data-label="Product">
                    <button
                      className="inv-btn inv-btn--link"
                      style={{ padding: 0, textAlign: "left" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/inventory/products/${p.id}`);
                      }}
                    >
                      <span className="inv-strong">{p.name}</span>
                    </button>
                    <div className="inv-small">
                      {[p.brand, p.manufacturerName, p.sku]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </td>
                  <td data-label="Category">{p.categoryName ?? "—"}</td>
                  <td data-label="Available" className="inv-num">
                    {p.inventoryType === "trackable"
                      ? formatQty(p.availableQty, p.unit)
                      : "—"}
                  </td>
                  <td data-label="Next expiration">
                    {formatDay(p.earliestExpiration)}
                  </td>
                  <td data-label="Stock">
                    <StockStatusBadge status={p.stockStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pager page={page} pages={pages} setParam={setParam} />
        </div>
      )}
    </>
  );
};

// ----------------------------------------------------------------- batches

const BatchesTab: React.FC<TabProps> = ({ params, setParam }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const q = useDebounced(query);
  const status = (params.get("status") ?? "") as BatchStatus | "";
  const [batches, setBatches] = useState<Batch[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setError(null);
    getBatches({ q, status: status || undefined })
      .then(({ data }) => live && setBatches(data.batches))
      .catch((e) => {
        if (!live) return;
        setBatches([]);
        setError(getApiErrorMessage(e, "Couldn't load batches."));
      });
    return () => {
      live = false;
    };
  }, [q, status]);

  return (
    <>
      <div className="inv-toolbar">
        <div className="inv-search">
          <Search size={16} />
          <input
            aria-label="Search lot numbers"
            placeholder="Search by lot number"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setParam("q", e.target.value || undefined);
            }}
          />
        </div>
        <select
          aria-label="Batch status"
          value={status}
          onChange={(e) => setParam("status", e.target.value || undefined)}
        >
          <option value="">Any status</option>
          {(Object.keys(BATCH_STATUS) as BatchStatus[]).map((s) => (
            <option key={s} value={s}>
              {BATCH_STATUS[s].label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="inv-error">{error}</p>}

      {batches === null ? (
        <div className="inv-loading">Loading batches…</div>
      ) : batches.length === 0 ? (
        <div className="inv-card inv-empty">
          <h3>{q || status ? "No batches match" : "No stock received yet"}</h3>
          <p>
            {q || status
              ? "Try a different lot number or status."
              : "Each lot you receive shows up here with its own expiration."}
          </p>
        </div>
      ) : (
        <div className="inv-table-wrap">
          <table className="inv-table inv-table--cards">
            <thead>
              <tr>
                <th>Lot</th>
                <th>Product</th>
                <th>Expires</th>
                <th className="inv-num">In stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr
                  key={b.id}
                  className="inv-row-link"
                  onClick={() => navigate(`/inventory/batches/${b.id}`)}
                >
                  <td data-label="Lot" className="inv-strong">
                    {b.lotNumber}
                  </td>
                  <td data-label="Product">{b.productName ?? "—"}</td>
                  <td data-label="Expires">{formatDay(b.expirationDate)}</td>
                  <td data-label="In stock" className="inv-num">
                    {formatQty(b.currentQty, b.unit)}
                  </td>
                  <td data-label="Status">
                    <BatchStatusBadge status={b.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

// ----------------------------------------------------------------- history

const PER_PAGE = 25;

const HistoryTab: React.FC<TabProps> = ({ params, setParam }) => {
  const navigate = useNavigate();
  const type = (params.get("type") ?? "") as TxnType | "";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const page = Number(params.get("page") ?? "1") || 1;
  const [rows, setRows] = useState<Transaction[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    return getTransactions({
      type: type || undefined,
      from: from || undefined,
      to: to || undefined,
      page,
      perPage: PER_PAGE,
    })
      .then(({ data }) => {
        setRows(data.transactions);
        setTotal(data.total);
      })
      .catch((e) => {
        setRows([]);
        setError(getApiErrorMessage(e, "Couldn't load the history."));
      });
  }, [type, from, to, page]);

  useEffect(() => {
    load();
  }, [load]);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / PER_PAGE)), [total]);

  return (
    <>
      <div className="inv-toolbar">
        <select
          aria-label="Type"
          value={type}
          onChange={(e) => setParam("type", e.target.value || undefined)}
        >
          <option value="">All changes</option>
          {(Object.keys(TXN_LABELS) as TxnType[]).map((t) => (
            <option key={t} value={t}>
              {TXN_LABELS[t]}
            </option>
          ))}
        </select>
        <input
          type="date"
          aria-label="From"
          value={from}
          onChange={(e) => setParam("from", e.target.value || undefined)}
        />
        <input
          type="date"
          aria-label="To"
          value={to}
          onChange={(e) => setParam("to", e.target.value || undefined)}
        />
      </div>

      {error && <p className="inv-error">{error}</p>}

      {rows === null ? (
        <div className="inv-loading">Loading history…</div>
      ) : rows.length === 0 ? (
        <div className="inv-card inv-empty">
          <h3>Nothing here yet</h3>
          <p>Every stock change is recorded here and never deleted.</p>
        </div>
      ) : (
        <>
          <div className="inv-table-wrap">
            <table className="inv-table inv-table--cards">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Change</th>
                  <th>Product · lot</th>
                  <th className="inv-num">Quantity</th>
                  <th className="inv-num">After</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr
                    key={`${t.batchId}-${t.id}`}
                    className="inv-row-link"
                    onClick={() => navigate(`/inventory/batches/${t.batchId}`)}
                  >
                    <td data-label="When">{formatWhen(t.at)}</td>
                    <td data-label="Change">{TXN_LABELS[t.type] ?? t.type}</td>
                    <td data-label="Product · lot">
                      {t.productName ?? "—"}
                      <div className="inv-small">Lot {t.lotNumber}</div>
                    </td>
                    <td data-label="Quantity" className="inv-num">
                      {t.quantity === "0" ? "—" : `${formatDelta(t.quantity)} ${t.unit}`}
                    </td>
                    <td data-label="After" className="inv-num">
                      {formatQty(t.newQty, t.unit)}
                    </td>
                    <td data-label="Reason">{t.reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} pages={pages} setParam={setParam} />
        </>
      )}
    </>
  );
};

/** Previous / Next for a list paged through the address (?page=). */
const Pager: React.FC<{
  page: number;
  pages: number;
  setParam: TabProps["setParam"];
}> = ({ page, pages, setParam }) =>
  pages > 1 || page > 1 ? (
    <nav
      className="inv-toolbar"
      style={{ justifyContent: "flex-end" }}
      aria-label="Pages"
    >
      <span className="inv-muted">
        Page {Math.min(page, pages)} of {pages}
      </span>
      <button
        className="inv-btn inv-btn--sm"
        disabled={page <= 1}
        onClick={() =>
          setParam("page", page > 2 ? String(Math.min(page - 1, pages)) : undefined)
        }
      >
        Previous
      </button>
      <button
        className="inv-btn inv-btn--sm"
        disabled={page >= pages}
        onClick={() => setParam("page", String(page + 1))}
      >
        Next
      </button>
    </nav>
  ) : null;

export default InventoryPage;

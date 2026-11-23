import {
  AlertOctagon,
  AlertTriangle,
  Download,
  FileUp,
  PauseCircle,
  PlayCircle,
  SlidersHorizontal,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdjustStockModal from "../../components/inventoryComp/AdjustStockModal";
import HoldBatchModal, { type HoldAction } from "../../components/inventoryComp/HoldBatchModal";
import InventoryGate from "../../components/inventoryComp/InventoryGate";
import { BatchStatusBadge } from "../../components/inventoryComp/StatusBadge";
import DocumentDetailModal from "../../components/inventoryComp/compliance/DocumentDetailModal";
import DocumentFormModal from "../../components/inventoryComp/compliance/DocumentFormModal";
import DocumentList from "../../components/inventoryComp/compliance/DocumentList";
import "../../components/inventoryComp/inventory.scss";
import useAuth from "../../context/useAuth";
import { type BatchDetail, getBatch } from "../../services/inventoryServices";
import { downloadClientList } from "../../utils/inventoryExport";
import { getApiErrorMessage } from "../../utils/formLinks";
import {
  TXN_LABELS,
  byLabel,
  formatDay,
  formatDelta,
  formatQty,
  formatWhen,
} from "../../utils/inventory";

const BatchDetailPage: React.FC = () => (
  <InventoryGate>
    <BatchDetailView />
  </InventoryGate>
);

const BatchDetailView: React.FC = () => {
  const { batchId = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState(false);
  const [hold, setHold] = useState<HoldAction | null>(null);
  const [uploading, setUploading] = useState(false);
  const [openDoc, setOpenDoc] = useState<string | null>(null);
  const [showProductDocs, setShowProductDocs] = useState(false);

  const load = useCallback(
    () =>
      getBatch(batchId)
        .then(({ data }) => setBatch(data.batch))
        .catch((e) => setError(getApiErrorMessage(e, "Couldn't load the batch."))),
    [batchId],
  );

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <p className="inv-error">{error}</p>;
  if (!batch) return <div className="inv-loading">Loading…</div>;

  const recalled = batch.status === "recalled";
  const quarantined = batch.status === "quarantined";
  const me = user?.userId;
  const productDocs = batch.documents?.product ?? [];
  const batchDocs = batch.documents?.batch ?? [];

  return (
    <div className="inv-page">
      <div className="inv-head">
        <div>
          <h1>
            Lot {batch.lotNumber} <BatchStatusBadge status={batch.status} />
          </h1>
          <p>
            <button
              className="inv-btn inv-btn--link"
              style={{ padding: 0 }}
              onClick={() => navigate(`/inventory/products/${batch.productId}`)}
            >
              {batch.productName ?? "Product"}
            </button>
            {" · "}expires {formatDay(batch.expirationDate)}
          </p>
        </div>
        {!recalled && (
          <div className="inv-head__actions">
            <button className="inv-btn" onClick={() => setAdjusting(true)}>
              <SlidersHorizontal size={16} /> Adjust stock
            </button>
            {quarantined ? (
              <button className="inv-btn" onClick={() => setHold("release")}>
                <PlayCircle size={16} /> Release
              </button>
            ) : (
              <button className="inv-btn" onClick={() => setHold("quarantine")}>
                <PauseCircle size={16} /> Quarantine
              </button>
            )}
            <button className="inv-btn inv-btn--danger" onClick={() => setHold("recall")}>
              <AlertOctagon size={16} /> Recall
            </button>
          </div>
        )}
      </div>

      {recalled && (
        <div className="inv-banner inv-banner--red" role="alert">
          <AlertOctagon size={20} />
          <div>
            <strong>This batch has been recalled</strong>
            <p>
              It can't be used on clients.
              {batch.hold?.reason && <> Reason: {batch.hold.reason}.</>} Recalled{" "}
              {formatWhen(batch.hold?.at)}.{" "}
              {batch.usages.length
                ? `${batch.usages.length} treatment${batch.usages.length === 1 ? "" : "s"} used it — see the clients below.`
                : "It wasn't used on any clients."}
            </p>
          </div>
        </div>
      )}
      {quarantined && (
        <div className="inv-banner inv-banner--amber" role="status">
          <PauseCircle size={20} />
          <div>
            <strong>Quarantined</strong>
            <p>
              Can't be used on clients until released.
              {batch.hold?.reason && <> Reason: {batch.hold.reason}.</>}
            </p>
          </div>
        </div>
      )}
      {batch.status === "expired" && (
        <div className="inv-banner inv-banner--red" role="status">
          <AlertTriangle size={20} />
          <div>
            <strong>Expired on {formatDay(batch.expirationDate)}</strong>
            <p>It can't be used on clients. Record it as wasted or returned when you dispose of it.</p>
          </div>
        </div>
      )}
      {batch.status === "expiring-soon" && (
        <div className="inv-banner inv-banner--amber" role="status">
          <AlertTriangle size={20} />
          <p>Expires {formatDay(batch.expirationDate)}. Use it first.</p>
        </div>
      )}

      <div className="inv-stats">
        <div className="inv-stat">
          <div className="inv-stat__value">{formatQty(batch.currentQty, batch.unit)}</div>
          <div className="inv-stat__label">In stock</div>
        </div>
        <div className="inv-stat">
          <div className="inv-stat__value">{formatQty(batch.originalQty, batch.unit)}</div>
          <div className="inv-stat__label">Received in total</div>
        </div>
        <div className="inv-stat">
          <div className="inv-stat__value">{formatQty(batch.usedQty, batch.unit)}</div>
          <div className="inv-stat__label">Used on clients</div>
        </div>
        <div className="inv-stat">
          <div className="inv-stat__value">{formatQty(batch.discardedQty, batch.unit)}</div>
          <div className="inv-stat__label">Wasted / discarded</div>
        </div>
      </div>

      <section className="inv-card">
        <h3>Details</h3>
        <dl className="inv-dl">
          <div>
            <dt>Lot number</dt>
            <dd className="inv-strong">{batch.lotNumber}</dd>
          </div>
          <div>
            <dt>Expiration</dt>
            <dd>{formatDay(batch.expirationDate)}</dd>
          </div>
          <div>
            <dt>Received</dt>
            <dd>{formatDay(batch.receivedDate)}</dd>
          </div>
          <div>
            <dt>Purchased</dt>
            <dd>{formatDay(batch.purchaseDate)}</dd>
          </div>
          <div>
            <dt>Supplier</dt>
            <dd>{batch.supplierName ?? "—"}</dd>
          </div>
          <div>
            <dt>Cost per {batch.unit}</dt>
            <dd>{batch.unitCost ?? "—"}</dd>
          </div>
          <div>
            <dt>Total cost</dt>
            <dd>{batch.totalCost ?? "—"}</dd>
          </div>
          <div>
            <dt>Added by</dt>
            <dd>{batch.source === "imported" ? "Import" : "Receiving"}</dd>
          </div>
        </dl>
      </section>

      <section className="inv-card">
        <div className="inv-card__head">
          <h3>Batch documents</h3>
          <button className="inv-btn inv-btn--sm" onClick={() => setUploading(true)}>
            <FileUp size={14} /> Add batch document
          </button>
        </div>
        <p className="inv-small" style={{ marginTop: 0 }}>
          These apply to lot {batch.lotNumber} only.
        </p>
        <DocumentList
          documents={batchDocs}
          emptyText="No documents for this lot yet, such as its Certificate of Analysis."
          onOpen={(d) => setOpenDoc(d.id)}
        />
        <button
          className="inv-btn inv-btn--link"
          style={{ marginTop: 8 }}
          onClick={() => setShowProductDocs((v) => !v)}
          aria-expanded={showProductDocs}
        >
          {showProductDocs ? "Hide" : "Show"} product documents ({productDocs.length}), which
          apply to every lot
        </button>
        {showProductDocs && (
          <DocumentList
            documents={productDocs}
            emptyText="No product documents on file."
            onOpen={(d) => setOpenDoc(d.id)}
          />
        )}
      </section>

      <section className="inv-card">
        <div className="inv-card__head">
          <h3>Clients who received this lot</h3>
          {batch.usages.length > 0 && (
            <button className="inv-btn inv-btn--sm" onClick={() => downloadClientList(batch, batch.usages)}>
              <Download size={14} /> Download list
            </button>
          )}
        </div>
        {batch.usages.length === 0 ? (
          <p className="inv-small" style={{ margin: 0 }}>Not used on any clients.</p>
        ) : (
          <div className="inv-table-wrap">
            <table className="inv-table inv-table--cards">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Appointment</th>
                  <th>Treatment</th>
                  <th className="inv-num">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {batch.usages.map((u) => (
                  <tr
                    key={u.usageId}
                    className="inv-row-link"
                    onClick={() => navigate(`/clients/${u.customerId}`)}
                  >
                    <td data-label="Client" className="inv-strong">{u.customerName ?? "Client"}</td>
                    <td data-label="Appointment">{formatWhen(u.appointmentDate ?? u.usedAt)}</td>
                    <td data-label="Treatment">{u.treatment ?? "—"}</td>
                    <td data-label="Quantity" className="inv-num">{formatQty(u.quantity, u.unit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="inv-card">
        <h3>History</h3>
        <div className="inv-table-wrap">
          <table className="inv-table inv-table--cards">
            <thead>
              <tr>
                <th>When</th>
                <th>Change</th>
                <th className="inv-num">Quantity</th>
                <th className="inv-num">Before → after</th>
                <th>By</th>
                <th>Reason / notes</th>
              </tr>
            </thead>
            <tbody>
              {batch.transactions.map((t) => (
                <tr key={t.id}>
                  <td data-label="When">{formatWhen(t.at)}</td>
                  <td data-label="Change">{TXN_LABELS[t.type] ?? t.type}</td>
                  <td data-label="Quantity" className="inv-num">
                    {t.quantity === "0" ? "—" : `${formatDelta(t.quantity)} ${t.unit}`}
                  </td>
                  <td data-label="Before → after" className="inv-num">
                    {t.previousQty} → {t.newQty}
                  </td>
                  <td data-label="By">{byLabel(t.performedBy, me)}</td>
                  <td data-label="Reason / notes">
                    {[t.reason, t.notes, t.referenceId && `Ref ${t.referenceId}`]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {adjusting && (
        <AdjustStockModal
          batch={batch}
          onClose={() => setAdjusting(false)}
          onDone={(b) => {
            setBatch(b);
            setAdjusting(false);
          }}
        />
      )}
      {hold && (
        <HoldBatchModal
          batch={batch}
          action={hold}
          onClose={() => setHold(null)}
          onDone={(b) => {
            setBatch(b);
            setHold(null);
          }}
        />
      )}
      {uploading && (
        <DocumentFormModal
          productId={batch.productId}
          batchId={batch.id}
          batchLabel={`Lot ${batch.lotNumber}`}
          onClose={() => setUploading(false)}
          onSaved={() => {
            setUploading(false);
            load();
          }}
        />
      )}
      {openDoc && (
        <DocumentDetailModal
          documentId={openDoc}
          onClose={() => setOpenDoc(null)}
          onChanged={load}
        />
      )}
    </div>
  );
};

export default BatchDetailPage;

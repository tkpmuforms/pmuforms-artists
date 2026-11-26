import { Package, Plus, Undo2 } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation } from "react-router-dom";
import useAuth from "../../context/useAuth";
import {
  type BatchForUse,
  type Product,
  type ProductUsage,
  getAppointmentUsages,
  getBatchesForUse,
  getProducts,
  newRequestId,
  recordUsage,
  reverseUsage,
} from "../../services/inventoryServices";
import { formatDay, formatWhen, isAmount } from "../../utils/inventory";
import { getApiErrorMessage } from "../../utils/formLinks";
import { isArtistSubscribed } from "../../utils/subscriptionUtils";
import SubscriptionModal from "../dashboardComp/SubScriptionModal";
import Field from "./Field";
import InventoryModal from "./InventoryModal";
import { Badge } from "./StatusBadge";
import "./inventory.scss";
import "./appointment-products.scss";

export interface AppointmentService {
  id: number;
  service: string;
}

/** soonest expiry first, so the oldest usable stock gets used up first */
const byExpiry = (a: BatchForUse, b: BatchForUse) =>
  a.expirationDate.localeCompare(b.expirationDate);

const batchLabel = (b: BatchForUse) =>
  `Lot ${b.lotNumber} · expires ${formatDay(b.expirationDate)} · ${b.currentQty} ${b.unit} left`;

// ----------------------------------------------------------------- dialog

/**
 * Records one product used on a client: which product, which exact lot and
 * how much. Stock comes off that lot. Also opened from an appointment card's
 * ⋯ menu.
 */
export const RecordProductModal: React.FC<{
  appointmentId: string;
  clientName: string;
  services?: AppointmentService[];
  onClose: () => void;
  onRecorded: (usage: ProductUsage) => void;
}> = ({ appointmentId, clientName, services = [], onClose, onRecorded }) => {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [productId, setProductId] = useState("");
  const [batches, setBatches] = useState<BatchForUse[] | null>(null);
  const [batchId, setBatchId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [serviceId, setServiceId] = useState(
    services.length === 1 ? String(services[0].id) : "",
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // one id per dialog, so a double click or retry records it once
  const [requestId] = useState(newRequestId);

  useEffect(() => {
    getProducts({ status: "active" })
      .then(({ data }) =>
        // only tracked products have lots to take stock from
        setProducts(data.products.filter((p) => p.inventoryType === "trackable")),
      )
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    setBatches(null);
    setBatchId("");
    if (!productId) return;
    let current = true;
    getBatchesForUse(productId)
      .then(({ data }) => {
        if (!current) return;
        const sorted = [...data.batches].sort(byExpiry);
        setBatches(sorted);
        setBatchId(sorted.find((b) => b.usable)?.id ?? "");
      })
      .catch(() => current && setBatches([]));
    return () => {
      current = false;
    };
  }, [productId]);

  const product = products?.find((p) => p.id === productId);
  const batch = batches?.find((b) => b.id === batchId);
  const usable = batches?.filter((b) => b.usable) ?? [];
  const unusable = batches?.filter((b) => !b.usable) ?? [];

  const submit = async () => {
    const amount = quantity.trim();
    if (!batch) {
      setError("Choose the lot you used.");
      return;
    }
    if (!isAmount(amount) || Number(amount) <= 0) {
      setError("Enter how much you used, like 1 or 0.5.");
      return;
    }
    if (Number(amount) > Number(batch.currentQty)) {
      setError(`Only ${batch.currentQty} ${batch.unit} left in this lot.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { data } = await recordUsage(appointmentId, {
        requestId,
        batchId: batch.id,
        quantity: amount,
        serviceId: serviceId ? Number(serviceId) : undefined,
        notes: notes.trim() || undefined,
      });
      toast.success(`${data.usage.snapshot.productName} recorded`);
      onRecorded(data.usage);
    } catch (e) {
      setError(getApiErrorMessage(e, "Couldn't record the product."));
      setSaving(false);
    }
  };

  return (
    <InventoryModal
      title="Add product used"
      subtitle={`On ${clientName || "this client"} at this appointment`}
      onClose={onClose}
      footer={
        <>
          <button className="inv-btn" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="inv-btn inv-btn--primary"
            onClick={submit}
            disabled={saving || !batch}
          >
            {saving ? "Saving…" : "Add product"}
          </button>
        </>
      }
    >
      {products === null ? (
        <div className="inv-loading">Loading products…</div>
      ) : products.length === 0 ? (
        <p className="inv-small">
          You don't have any tracked products yet.{" "}
          <Link to="/inventory/products/new">Add a product</Link> and receive
          its stock first, then you can record it on clients.
        </p>
      ) : (
        <>
          <Field label="Product">
            <select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setError(null);
              }}
              autoFocus
            >
              <option value="">Choose a product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.brand ? ` (${p.brand})` : ""} · {p.availableQty} {p.unit}{" "}
                  available
                </option>
              ))}
            </select>
          </Field>

          {productId &&
            (batches === null ? (
              <div className="inv-loading">Loading lots…</div>
            ) : usable.length === 0 ? (
              <p className="inv-field__error" role="alert">
                No lot of {product?.name ?? "this product"} can be used right
                now
                {unusable.length
                  ? ` (${unusable.map((b) => `lot ${b.lotNumber}: ${b.unusableReason}`).join("; ")})`
                  : ""}
                . <Link to="/inventory/receive">Receive stock</Link>
              </p>
            ) : (
              <Field label="Lot">
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                >
                  {usable.map((b) => (
                    <option key={b.id} value={b.id}>
                      {batchLabel(b)}
                    </option>
                  ))}
                  {unusable.map((b) => (
                    <option key={b.id} value={b.id} disabled>
                      Lot {b.lotNumber} · {b.unusableReason}
                    </option>
                  ))}
                </select>
                <span className="inv-field__hint">
                  The lot that expires soonest is picked for you.
                </span>
              </Field>
            ))}

          {batch && (
            <>
              <Field label={`Amount used (${batch.unit})`}>
                <input
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  inputMode="decimal"
                  placeholder="e.g. 1"
                />
              </Field>

              {services.length > 1 && (
                <Field label="For which service (optional)">
                  <select
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                  >
                    <option value="">Not for one service</option>
                    {services.map((s) => (
                      <option key={s.id} value={String(s.id)}>
                        {s.service}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              <Field label="Notes (optional)">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={1000}
                  rows={2}
                  placeholder="e.g. Mixed with 2 drops of modifier"
                />
              </Field>
            </>
          )}

          {error && (
            <p className="inv-field__error" role="alert">
              {error}
            </p>
          )}
        </>
      )}
    </InventoryModal>
  );
};

const UndoModal: React.FC<{
  usage: ProductUsage;
  completed: boolean;
  onClose: () => void;
  onUndone: (usage: ProductUsage) => void;
}> = ({ usage, completed, onClose, onUndone }) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    // a finished appointment is a record; changing it needs a reason
    if (completed && !reason.trim()) {
      setError("This appointment is complete. Add a reason for the change.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { data } = await reverseUsage(usage.id, reason);
      toast.success("Removed, and the stock was put back");
      onUndone(data.usage);
    } catch (e) {
      setError(getApiErrorMessage(e, "Couldn't remove the product."));
      setSaving(false);
    }
  };

  return (
    <InventoryModal
      title="Remove this product?"
      subtitle={`${usage.snapshot.productName}, lot ${usage.snapshot.lotNumber}: ${usage.quantity} ${usage.unit} goes back into stock.`}
      onClose={onClose}
      footer={
        <>
          <button className="inv-btn" onClick={onClose} disabled={saving}>
            Keep it
          </button>
          <button
            className="inv-btn inv-btn--danger"
            onClick={submit}
            disabled={saving}
          >
            {saving ? "Removing…" : "Remove"}
          </button>
        </>
      }
    >
      <Field label={completed ? "Reason" : "Reason (optional)"}>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          placeholder="e.g. Recorded by mistake"
          autoFocus
        />
      </Field>
      {error && (
        <p className="inv-field__error" role="alert">
          {error}
        </p>
      )}
    </InventoryModal>
  );
};

// ----------------------------------------------------------------- section

/**
 * The products used on the client at this appointment, with the exact lots,
 * so a recalled lot can be traced to the clients who received it.
 */
const AppointmentProducts: React.FC<{
  appointmentId: string;
  clientName: string;
  services?: AppointmentService[];
  completed?: boolean;
}> = ({ appointmentId, clientName, services = [], completed = false }) => {
  const { user, isMember } = useAuth();
  const subscribed = isArtistSubscribed(user);
  const location = useLocation();
  const sectionRef = useRef<HTMLElement>(null);
  const [usages, setUsages] = useState<ProductUsage[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [undoing, setUndoing] = useState<ProductUsage | null>(null);
  const [showPlans, setShowPlans] = useState(false);

  const load = useCallback(() => {
    getAppointmentUsages(appointmentId)
      .then(({ data }) => setUsages(data.usages))
      .catch(() => setUsages([]));
  }, [appointmentId]);

  useEffect(() => {
    if (subscribed) load();
  }, [subscribed, load]);

  // opened from "Products used" elsewhere: bring this section into view
  useEffect(() => {
    if (location.hash === "#products" && (usages !== null || !subscribed)) {
      sectionRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }
  }, [location.hash, usages, subscribed]);

  const replace = (updated: ProductUsage) =>
    setUsages((prev) =>
      (prev ?? []).map((u) => (u.id === updated.id ? updated : u)),
    );

  const active = useMemo(
    () => (usages ?? []).filter((u) => u.status === "active"),
    [usages],
  );

  if (!subscribed) {
    return (
      <section
        ref={sectionRef}
        id="products"
        className="appointment-products inv-card"
        aria-label="Products used"
      >
        <div className="inv-card__head">
          <div>
            <h3>Products used</h3>
            <p className="inv-muted appointment-products__sub">
              Record the products and exact lots you use on each client, so you
              always know who received a batch. Part of a PMU Forms
              subscription.
            </p>
          </div>
          {/* billing is the owner's */}
          {!isMember && (
            <button
              className="inv-btn inv-btn--sm"
              onClick={() => setShowPlans(true)}
            >
              See plans
            </button>
          )}
        </div>
        {showPlans && <SubscriptionModal onClose={() => setShowPlans(false)} />}
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      id="products"
      className="appointment-products inv-card"
      aria-label="Products used"
    >
      <div className="inv-card__head">
        <div>
          <h3>Products used</h3>
          <p className="inv-muted appointment-products__sub">
            The products and lots used on {clientName.split(" ")[0] || "the client"}{" "}
            at this appointment. Adding one takes it out of stock.
          </p>
        </div>
        <button
          className="inv-btn inv-btn--primary inv-btn--sm"
          onClick={() => setAdding(true)}
        >
          <Plus size={14} /> Add product
        </button>
      </div>

      {usages === null ? (
        <div className="inv-loading">Loading…</div>
      ) : usages.length === 0 ? (
        <p className="inv-small">No products recorded for this appointment yet.</p>
      ) : (
        <ul className="appointment-products__list">
          {usages.map((u) => (
            <li
              key={u.id}
              className={`appointment-products__item${u.status === "reversed" ? " is-reversed" : ""}`}
            >
              <span className="appointment-products__icon" aria-hidden>
                <Package size={18} />
              </span>
              <div className="appointment-products__main">
                <div className="appointment-products__name">
                  <strong>{u.snapshot.productName}</strong>
                  {u.snapshot.brand && (
                    <span className="inv-muted"> · {u.snapshot.brand}</span>
                  )}
                  {u.status === "reversed" && <Badge tone="grey">Removed</Badge>}
                </div>
                <div className="inv-small">
                  {u.quantity} {u.unit} · Lot{" "}
                  <Link to={`/inventory/batches/${u.batchId}`}>
                    {u.snapshot.lotNumber}
                  </Link>{" "}
                  · expires {formatDay(u.snapshot.expirationDate)}
                  {u.snapshot.serviceName ? ` · ${u.snapshot.serviceName}` : ""}
                </div>
                <div className="inv-small inv-muted">
                  {u.status === "reversed"
                    ? `Removed ${formatWhen(u.reversal?.at)}${u.reversal?.reason ? `: ${u.reversal.reason}` : ""}`
                    : `Added ${formatWhen(u.usedAt)}`}
                  {u.notes ? ` · ${u.notes}` : ""}
                </div>
              </div>
              {u.status === "active" && (
                <button
                  className="inv-btn inv-btn--sm"
                  onClick={() => setUndoing(u)}
                  aria-label={`Remove ${u.snapshot.productName}`}
                >
                  <Undo2 size={14} /> Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {active.length > 0 && (
        <p className="inv-small inv-muted appointment-products__count">
          {active.length} product{active.length === 1 ? "" : "s"} recorded
        </p>
      )}

      {adding && (
        <RecordProductModal
          appointmentId={appointmentId}
          clientName={clientName}
          services={services}
          onClose={() => setAdding(false)}
          onRecorded={(usage) => {
            setAdding(false);
            setUsages((prev) => [...(prev ?? []), usage]);
          }}
        />
      )}
      {undoing && (
        <UndoModal
          usage={undoing}
          completed={completed}
          onClose={() => setUndoing(null)}
          onUndone={(usage) => {
            setUndoing(null);
            replace(usage);
          }}
        />
      )}
    </section>
  );
};

export default AppointmentProducts;

import type {
  BatchStatus,
  DocumentStatus,
  StockStatus,
  TxnType,
} from "../services/inventoryServices";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * "2028-06-30" -> "Jun 30, 2028". Read straight from the text, never through
 * a Date, so a calendar date can't shift a day in some time zones.
 */
export const formatDay = (date: string | null | undefined) => {
  if (!date) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!match) return date;
  return `${MONTHS[Number(match[2]) - 1]} ${Number(match[3])}, ${match[1]}`;
};

/** A timestamp in the viewer's local time. */
export const formatWhen = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const formatQty = (qty: string | null | undefined, unit?: string) =>
  qty === null || qty === undefined ? "—" : `${qty}${unit ? ` ${unit}` : ""}`;

/** Signed quantity for history rows: "+10", "−0.5". */
export const formatDelta = (qty: string) =>
  qty.startsWith("-") ? `−${qty.slice(1)}` : qty === "0" ? "0" : `+${qty}`;

/** Accepts what people type for an amount: digits with up to N decimals. */
export const isAmount = (value: string, decimals = 3) =>
  new RegExp(`^\\d{1,9}(\\.\\d{1,${decimals}})?$`).test(value.trim());

/** Today's date as "YYYY-MM-DD" in the viewer's time zone. */
export const todayLocal = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export type Tone = "green" | "amber" | "red" | "grey" | "purple" | "blue";

export const BATCH_STATUS: Record<BatchStatus, { label: string; tone: Tone }> = {
  available: { label: "Available", tone: "green" },
  "expiring-soon": { label: "Expiring soon", tone: "amber" },
  expired: { label: "Expired", tone: "red" },
  depleted: { label: "Depleted", tone: "grey" },
  quarantined: { label: "Quarantined", tone: "amber" },
  recalled: { label: "Recalled", tone: "red" },
};

export const STOCK_STATUS: Record<StockStatus, { label: string; tone: Tone }> = {
  "in-stock": { label: "In stock", tone: "green" },
  "low-stock": { label: "Low stock", tone: "amber" },
  "out-of-stock": { label: "Out of stock", tone: "red" },
  "not-tracked": { label: "Not tracked", tone: "grey" },
};

// each evidence status is shown on its own; never one overall badge
export const DOC_STATUS: Record<DocumentStatus, { label: string; tone: Tone }> = {
  "not-provided": { label: "Not provided", tone: "grey" },
  uploaded: { label: "Uploaded", tone: "blue" },
  "pending-review": { label: "Pending review", tone: "amber" },
  reviewed: { label: "Reviewed", tone: "purple" },
  verified: { label: "Verified against issuer", tone: "green" },
  rejected: { label: "Rejected", tone: "red" },
  expired: { label: "Expired", tone: "red" },
  superseded: { label: "Superseded", tone: "grey" },
};

export const TXN_LABELS: Record<TxnType, string> = {
  received: "Received",
  imported: "Imported",
  "used-on-client": "Used on client",
  "usage-reversed": "Usage removed",
  adjustment: "Adjustment",
  wasted: "Wasted / discarded",
  "returned-to-supplier": "Returned to supplier",
  correction: "Correction",
  quarantined: "Quarantined",
  released: "Released from quarantine",
  recalled: "Recalled",
};

/** Who did something: "You" for the signed-in artist. */
export const byLabel = (by: string | null | undefined, me?: string | null) =>
  !by ? "—" : by === me ? "You" : by;

import { Copy, ExternalLink, Mail, Plus, RefreshCw, XCircle } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import Field from "../inventoryComp/Field";
import InventoryModal from "../inventoryComp/InventoryModal";
import { Badge } from "../inventoryComp/StatusBadge";
import "../inventoryComp/inventory.scss";
import "./appointment-payments.scss";
import {
  type PaymentRequest,
  type PaymentRequestKind,
  type PaymentRequestStatus,
  type SquarePaymentStatus,
  cancelPaymentRequest,
  createPaymentRequest,
  getPaymentRequests,
  getSquarePaymentStatus,
  refreshPaymentRequest,
  resendPaymentRequest,
} from "../../services/paymentServices";
import { newRequestId } from "../../services/inventoryServices";
import { formatWhen } from "../../utils/inventory";
import { getApiErrorMessage } from "../../utils/formLinks";

const STATUS: Record<
  PaymentRequestStatus,
  { label: string; tone: "amber" | "green" | "grey" | "blue" }
> = {
  pending: { label: "Waiting for payment", tone: "amber" },
  paid: { label: "Paid", tone: "green" },
  refunded: { label: "Refunded", tone: "blue" },
  canceled: { label: "Canceled", tone: "grey" },
};

const KIND_LABEL: Record<PaymentRequestKind, string> = {
  deposit: "Deposit",
  payment: "Payment",
};

interface Props {
  appointmentId: string;
  clientName: string;
}

/**
 * Square payment links for one appointment. Only shown to artists who have
 * Square connected; taking payments needs Square.
 */
const AppointmentPayments: React.FC<Props> = ({ appointmentId, clientName }) => {
  const [square, setSquare] = useState<SquarePaymentStatus | null>(null);
  const [requests, setRequests] = useState<PaymentRequest[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    getPaymentRequests(appointmentId)
      .then(({ data }) => setRequests(data.requests))
      .catch(() => setRequests([]));
  }, [appointmentId]);

  useEffect(() => {
    getSquarePaymentStatus()
      .then(({ data }) => {
        setSquare(data);
        if (data.paymentsEnabled) load();
      })
      .catch(() => setSquare(null));
  }, [load]);

  // no Square connection: nothing to offer here
  if (!square || (!square.paymentsEnabled && !square.reconnectRequired)) {
    return null;
  }

  if (!square.paymentsEnabled) {
    return (
      <section className="appointment-payments inv-card" aria-label="Payments">
        <h3>Payments</h3>
        <div className="inv-banner inv-banner--info">
          <p>
            Reconnect Square to request deposits and payments from clients. This
            gives PMU Forms permission to create Square payment links for you.
          </p>
          <Link to="/integrations" className="inv-btn inv-btn--sm">
            Go to Integrations
          </Link>
        </div>
      </section>
    );
  }

  const replace = (updated: PaymentRequest) =>
    setRequests((prev) =>
      (prev ?? []).map((r) => (r.id === updated.id ? updated : r)),
    );

  const run = async (
    id: string,
    action: () => Promise<{ data: { request: PaymentRequest } }>,
    success: (r: PaymentRequest) => string | null,
    failure: string,
  ) => {
    setBusy(id);
    try {
      const { data } = await action();
      replace(data.request);
      const message = success(data.request);
      if (message) toast.success(message);
    } catch (e) {
      toast.error(getApiErrorMessage(e, failure));
      load();
    } finally {
      setBusy(null);
    }
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Payment link copied");
    } catch {
      window.prompt("Copy the payment link:", url);
    }
  };

  const cancel = (r: PaymentRequest) => {
    if (
      !window.confirm(
        `Cancel this ${r.amountLabel} request? The link will stop working.`,
      )
    ) {
      return;
    }
    run(
      r.id,
      () => cancelPaymentRequest(r.id),
      () => "Request canceled",
      "Couldn't cancel the request.",
    );
  };

  return (
    <section className="appointment-payments inv-card" aria-label="Payments">
      <div className="inv-card__head">
        <div>
          <h3>Payments</h3>
          <p className="inv-muted appointment-payments__sub">
            Clients pay on Square's secure page. The money goes to your Square
            account{square.accountName ? ` (${square.accountName})` : ""}.
          </p>
        </div>
        <button
          className="inv-btn inv-btn--primary inv-btn--sm"
          onClick={() => setCreating(true)}
        >
          <Plus size={14} /> Request payment
        </button>
      </div>

      {requests === null ? (
        <div className="inv-loading">Loading…</div>
      ) : requests.length === 0 ? (
        <p className="inv-small">
          No payment requests yet. Send {clientName.split(" ")[0] || "your client"}{" "}
          a link to pay a deposit or the balance.
        </p>
      ) : (
        <ul className="appointment-payments__list">
          {requests.map((r) => (
            <li key={r.id} className="appointment-payments__item">
              <div className="appointment-payments__main">
                <div className="appointment-payments__title">
                  <strong>
                    {KIND_LABEL[r.kind]} · {r.amountLabel}
                  </strong>
                  <Badge tone={STATUS[r.status].tone}>
                    {STATUS[r.status].label}
                  </Badge>
                </div>
                <p className="inv-small">
                  {r.status === "paid" || r.status === "refunded"
                    ? `Payment received${r.paidAt ? ` ${formatWhen(r.paidAt)}` : ""}`
                    : r.status === "canceled"
                      ? `Link turned off${r.canceledAt ? ` ${formatWhen(r.canceledAt)}` : ""}`
                      : r.sentTo
                        ? `Emailed to ${r.sentTo} ${r.lastSentAt ? formatWhen(r.lastSentAt) : ""}`
                        : `Created ${formatWhen(r.createdAt)}; not emailed`}
                  {r.amountRefunded && r.status === "paid"
                    ? ` · ${r.amountRefunded} refunded`
                    : ""}
                </p>
                {r.note && <p className="inv-small">“{r.note}”</p>}
              </div>

              <div className="appointment-payments__actions">
                {r.url && (
                  <button
                    className="inv-btn inv-btn--sm"
                    onClick={() => copy(r.url as string)}
                  >
                    <Copy size={14} /> Copy link
                  </button>
                )}
                {r.status === "pending" && (
                  <>
                    <button
                      className="inv-btn inv-btn--sm"
                      disabled={busy === r.id}
                      onClick={() =>
                        run(
                          r.id,
                          () => resendPaymentRequest(r.id),
                          (u) => `Link emailed to ${u.sentTo}`,
                          "Couldn't email the link.",
                        )
                      }
                    >
                      <Mail size={14} /> Email again
                    </button>
                    <button
                      className="inv-btn inv-btn--sm"
                      disabled={busy === r.id}
                      onClick={() =>
                        run(
                          r.id,
                          () => refreshPaymentRequest(r.id),
                          (u) =>
                            u.status === "paid"
                              ? "Paid!"
                              : u.status === "pending"
                                ? "No payment yet"
                                : null,
                          "Couldn't check with Square.",
                        )
                      }
                    >
                      <RefreshCw size={14} /> Check status
                    </button>
                    <button
                      className="inv-btn inv-btn--sm inv-btn--danger"
                      disabled={busy === r.id}
                      onClick={() => cancel(r)}
                    >
                      <XCircle size={14} /> Cancel
                    </button>
                  </>
                )}
                {r.receiptUrl && (
                  <a
                    className="inv-btn inv-btn--sm"
                    href={r.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink size={14} /> Receipt
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {creating && (
        <RequestPaymentModal
          appointmentId={appointmentId}
          clientName={clientName}
          currency={square.currency}
          onClose={() => setCreating(false)}
          onCreated={(request) => {
            setCreating(false);
            setRequests((prev) => [request, ...(prev ?? [])]);
          }}
        />
      )}
    </section>
  );
};

// ----------------------------------------------------------------- dialog

/** Also opened from the appointment card's ⋯ menu (ClientsAppointment page). */
export const RequestPaymentModal: React.FC<{
  appointmentId: string;
  clientName: string;
  currency: string | null;
  onClose: () => void;
  onCreated: (request: PaymentRequest) => void;
}> = ({ appointmentId, clientName, currency, onClose, onCreated }) => {
  const [kind, setKind] = useState<PaymentRequestKind>("deposit");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // one id per dialog, so a double click or retry can't make two links
  const [requestId] = useState(newRequestId);
  const zeroDecimal = currency === "JPY";

  const submit = async () => {
    const text = amount.trim();
    const pattern = zeroDecimal ? /^\d{1,6}$/ : /^\d{1,6}(\.\d{1,2})?$/;
    if (!pattern.test(text) || Number(text) <= 0) {
      setError(
        zeroDecimal
          ? "Enter a whole amount greater than zero."
          : "Enter an amount greater than zero, like 50 or 49.99.",
      );
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { data } = await createPaymentRequest({
        appointmentId,
        kind,
        amount: text,
        note: note.trim() || undefined,
        sendEmail,
        requestId,
      });
      if (data.emailSent) {
        toast.success(`Payment link emailed to ${data.request.sentTo}`);
      } else if (sendEmail && data.emailError) {
        toast.error(`Link created, but not emailed: ${data.emailError}`);
      } else {
        toast.success("Payment link created. Copy it to send it yourself.");
      }
      onCreated(data.request);
    } catch (e) {
      setError(getApiErrorMessage(e, "Couldn't create the payment link."));
      setSaving(false);
    }
  };

  return (
    <InventoryModal
      title="Request payment"
      subtitle={`From ${clientName} through Square`}
      onClose={onClose}
      footer={
        <>
          <button className="inv-btn" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="inv-btn inv-btn--primary"
            onClick={submit}
            disabled={saving}
          >
            {saving ? "Creating…" : sendEmail ? "Create & email link" : "Create link"}
          </button>
        </>
      }
    >
      <div className="inv-segmented" role="group" aria-label="Type">
        {(["deposit", "payment"] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            onClick={() => setKind(k)}
          >
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>

      <Field label={`Amount${currency ? ` (${currency})` : ""}`}>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          placeholder={zeroDecimal ? "e.g. 5000" : "e.g. 50.00"}
          autoFocus
        />
        {error ? (
          <span className="inv-field__error">{error}</span>
        ) : (
          <span className="inv-field__hint">
            Square's processing fee is taken from this amount.
          </span>
        )}
      </Field>

      <Field label="Message to the client (optional)">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="e.g. Your deposit holds your spot and comes off the final price."
        />
      </Field>

      <label className="inv-check">
        <input
          type="checkbox"
          checked={sendEmail}
          onChange={(e) => setSendEmail(e.target.checked)}
        />
        Email the link to {clientName.split(" ")[0] || "the client"}
      </label>
    </InventoryModal>
  );
};

export default AppointmentPayments;

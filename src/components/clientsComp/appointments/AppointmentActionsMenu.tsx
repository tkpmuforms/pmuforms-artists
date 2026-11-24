import {
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileText,
  HeartPulse,
  Link2,
  MessageCircleHeart,
  MoreVertical,
  Package,
  Send,
  Trash2,
} from "lucide-react";
import type React from "react";
import "./appointment-actions-menu.scss";

export type CareAction = "complete" | "pre-care" | "aftercare" | "check-in";

export interface AppointmentMenuHandlers {
  onViewForms?: () => void;
  onShareFormLink?: () => void;
  onStartFilling?: () => void;
  onCareAction?: (action: CareAction) => void;
  /** Only given when the artist has Square connected (payments need Square). */
  onRequestPayment?: () => void;
  onAddProducts?: () => void;
  onDelete: () => void;
}

/**
 * The ⋯ menu on an appointment card: the same actions wherever an
 * appointment is listed (the client's appointments, the appointments page,
 * the dashboard).
 */
const AppointmentActionsMenu: React.FC<
  AppointmentMenuHandlers & {
    signed: boolean;
    completedAt?: string | null;
    /** names the appointment for screen readers */
    label?: string;
  }
> = ({
  signed,
  completedAt,
  label,
  onViewForms,
  onShareFormLink,
  onStartFilling,
  onCareAction,
  onRequestPayment,
  onAddProducts,
  onDelete,
}) => (
  // menu clicks must not also trigger the card's own click
  <div
    className="dropdown appt-actions"
    onClick={(e) => e.stopPropagation()}
    onKeyDown={(e) => e.stopPropagation()}
  >
    <button
      type="button"
      className="dropdown-trigger"
      aria-label={label ? `Actions for ${label}` : "Appointment actions"}
    >
      <MoreVertical size={16} />
    </button>
    <div className="dropdown-menu">
      {onViewForms && (
        <button type="button" onClick={onViewForms}>
          <FileText size={16} />
          View Forms
        </button>
      )}
      {/* signed appointments can't take new answers */}
      {!signed && onShareFormLink && (
        <button type="button" onClick={onShareFormLink}>
          <Link2 size={16} />
          Share consent form link
        </button>
      )}
      {!signed && onStartFilling && (
        <button type="button" onClick={onStartFilling}>
          <ExternalLink size={16} />
          Share consent forms
        </button>
      )}
      {onCareAction && (
        <button type="button" onClick={() => onCareAction("pre-care")}>
          <Send size={16} />
          Send pre-care instructions
        </button>
      )}
      {onCareAction && (
        <button type="button" onClick={() => onCareAction("aftercare")}>
          <HeartPulse size={16} />
          Send aftercare instructions
        </button>
      )}
      {onCareAction && (
        <button type="button" onClick={() => onCareAction("check-in")}>
          <MessageCircleHeart size={16} />
          Send healing check-in
        </button>
      )}
      {onAddProducts && (
        <button type="button" onClick={onAddProducts}>
          <Package size={16} />
          Add products used
        </button>
      )}
      {onRequestPayment && (
        <button type="button" onClick={onRequestPayment}>
          <CreditCard size={16} />
          Request payment
        </button>
      )}
      {/* actions that end the appointment, set apart at the bottom */}
      <div className="dropdown-divider" role="separator" />
      {onCareAction && !completedAt && (
        <button
          type="button"
          onClick={() => onCareAction("complete")}
          className="complete-option"
          // the procedure comes after the client's forms are signed
          disabled={!signed}
          title={signed ? undefined : "Sign the forms first"}
        >
          <CheckCircle2 size={16} />
          Mark as complete
        </button>
      )}
      <button type="button" onClick={onDelete} className="delete-option">
        <Trash2 size={16} />
        Delete
      </button>
    </div>
  </div>
);

export default AppointmentActionsMenu;

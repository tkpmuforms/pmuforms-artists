import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import useAuth from "../../../context/useAuth";
import { DeleteAppointment } from "../../../services/artistServices";
import {
  type SquarePaymentStatus,
  getSquarePaymentStatus,
} from "../../../services/paymentServices";
import { getApiErrorMessage, startFillingOnThisDevice } from "../../../utils/formLinks";
import { isArtistSubscribed } from "../../../utils/subscriptionUtils";
import SubscriptionModal from "../../dashboardComp/SubScriptionModal";
import {
  type AppointmentService,
  RecordProductModal,
} from "../../inventoryComp/AppointmentProducts";
import { RequestPaymentModal } from "../../payments/AppointmentPayments";
import DeleteModal from "../details/DeleteModal";
import type { AppointmentMenuHandlers, CareAction } from "./AppointmentActionsMenu";
import CareMessageModal from "./CareMessageModal";
import HealingCheckInModal from "./HealingCheckInModal";
import ShareFormLinkModal from "./ShareFormLinkModal";

/** the appointment an action is for, and whose it is */
export interface ActionTarget {
  appointmentId: string;
  /** the client's id: without it the menu has no View Notes */
  customerId?: string;
  clientName: string;
  services?: AppointmentService[];
}

type Active = ActionTarget &
  (
    | { kind: "delete" | "link" | "payment" | "products" }
    | { kind: "care"; action: CareAction }
  );

/**
 * Everything behind an appointment card's ⋯ menu: the handlers to give
 * AppointmentActionsMenu, and the dialogs they open. One per page, so Square
 * is only asked about once.
 */
export const useAppointmentActions = ({
  onDeleted,
  onCompleted,
}: {
  onDeleted?: (appointmentId: string) => void;
  onCompleted?: (appointmentId: string, completedAt: string) => void;
} = {}) => {
  const navigate = useNavigate();
  const { user, isMember } = useAuth();
  const subscribed = isArtistSubscribed(user);
  // billing is the owner's: a team member is told to ask them instead
  const showPlansOrAsk = () =>
    isMember
      ? toast.error("This is part of a PMU Forms subscription. Ask the account owner to subscribe.")
      : setShowPlans(true);
  // payments need Square: the menu item only appears for Square-connected artists
  const [square, setSquare] = useState<SquarePaymentStatus | null>(null);
  const [active, setActive] = useState<Active | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showPlans, setShowPlans] = useState(false);

  useEffect(() => {
    getSquarePaymentStatus()
      .then(({ data }) => setSquare(data))
      .catch(() => setSquare(null));
  }, []);

  const close = () => setActive(null);

  const requestPayment = (target: ActionTarget) => {
    if (square?.paymentsEnabled) {
      return () =>
        subscribed
          ? setActive({ ...target, kind: "payment" })
          : showPlansOrAsk();
    }
    if (square?.reconnectRequired) {
      return () => {
        // integrations are the owner's
        if (isMember) {
          toast.error(
            "Square needs reconnecting before payments can be requested. Ask the account owner to reconnect it.",
          );
          return;
        }
        toast.error(
          "Reconnect Square to request payments. It needs permission to create payment links.",
        );
        navigate("/integrations");
      };
    }
    return undefined;
  };

  /** the menu's handlers for one appointment (View Forms is page-specific) */
  const handlersFor = (
    target: ActionTarget,
  ): Omit<AppointmentMenuHandlers, "onViewForms"> => ({
    onViewNotes: target.customerId
      ? () =>
          navigate(`/clients/${target.customerId}/notes`, {
            state: { clientName: target.clientName },
          })
      : undefined,
    onShareFormLink: () => setActive({ ...target, kind: "link" }),
    onStartFilling: () => startFillingOnThisDevice(target.appointmentId),
    onCareAction: (action) => setActive({ ...target, kind: "care", action }),
    onRequestPayment: requestPayment(target),
    // products are part of inventory, which is part of the paid plan
    onAddProducts: () =>
      subscribed ? setActive({ ...target, kind: "products" }) : showPlansOrAsk(),
    onDelete: () => setActive({ ...target, kind: "delete" }),
  });

  const confirmDelete = async () => {
    if (!active || deleting) return;
    setDeleting(true);
    try {
      await DeleteAppointment(active.appointmentId);
      onDeleted?.(active.appointmentId);
      toast.success("Appointment deleted");
      close();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Couldn't delete the appointment."));
    } finally {
      setDeleting(false);
    }
  };

  const modals = (
    <>
      {active?.kind === "delete" && (
        <DeleteModal
          onClose={close}
          headerText="Delete Appointment"
          shorterText="Are you sure you want to delete this appointment?"
          handleDelete={confirmDelete}
        />
      )}

      {active?.kind === "payment" && square?.paymentsEnabled && (
        <RequestPaymentModal
          appointmentId={active.appointmentId}
          clientName={active.clientName}
          currency={square.currency}
          onClose={close}
          onCreated={close}
        />
      )}

      {active?.kind === "products" && (
        <RecordProductModal
          appointmentId={active.appointmentId}
          clientName={active.clientName}
          services={active.services}
          onClose={close}
          onRecorded={close}
        />
      )}

      {active?.kind === "link" && (
        <ShareFormLinkModal
          appointmentId={active.appointmentId}
          clientName={active.clientName}
          onClose={close}
        />
      )}

      {active?.kind === "care" && active.action === "check-in" && (
        <HealingCheckInModal
          appointmentId={active.appointmentId}
          clientName={active.clientName}
          onClose={close}
          onDone={close}
        />
      )}

      {active?.kind === "care" && active.action !== "check-in" && (
        <CareMessageModal
          appointmentId={active.appointmentId}
          clientName={active.clientName}
          kind={active.action === "pre-care" ? "pre-care" : "aftercare"}
          mode={active.action === "complete" ? "complete" : "send"}
          onClose={close}
          onDone={({ completedAt }) => {
            if (completedAt) onCompleted?.(active.appointmentId, completedAt);
            close();
          }}
        />
      )}

      {showPlans && <SubscriptionModal onClose={() => setShowPlans(false)} />}
    </>
  );

  return { handlersFor, modals };
};

"use client";

import { ClipboardPen } from "lucide-react";
import type React from "react";
import { useState } from "react";
import AddClientModal from "../clientsComp/AddClientModal";
import ClientSearchModal from "../clientsComp/ClientSearchModal";
import ShareFormLinkModal from "../clientsComp/appointments/ShareFormLinkModal";
import SendConsentFormModal from "../clientsComp/details/SendConsentFormModal";

interface Client {
  id: string;
  name: string;
}

type Step =
  | { kind: "pick" }
  | { kind: "add" }
  | { kind: "details"; client: Client }
  | { kind: "link"; client: Client; appointmentId: string };

interface StartNewFormFlowProps {
  onClose: () => void;
  // e.g. to refresh dashboard metrics once an appointment exists
  onAppointmentCreated?: () => void;
}

/**
 * Dashboard quick action: pick (or add) a client, book the appointment and
 * send the consent forms exactly like "Send Consent Form", then show a form
 * link so the client can fill out the forms right away, here or on their phone.
 */
const StartNewFormFlow: React.FC<StartNewFormFlowProps> = ({
  onClose,
  onAppointmentCreated,
}) => {
  const [step, setStep] = useState<Step>({ kind: "pick" });

  switch (step.kind) {
    case "pick":
      return (
        <ClientSearchModal
          title="Start a New Consent Form for a Client"
          onClose={onClose}
          onSelect={(client) => setStep({ kind: "details", client })}
          onAddNew={() => setStep({ kind: "add" })}
        />
      );

    case "add":
      return (
        <AddClientModal
          onClose={() => setStep({ kind: "pick" })}
          onSuccess={(client) =>
            setStep(
              client?.id
                ? {
                    kind: "details",
                    client: { id: client.id, name: client.name },
                  }
                : { kind: "pick" },
            )
          }
        />
      );

    case "details":
      return (
        <SendConsentFormModal
          title="Share Consent Forms"
          clientId={step.client.id}
          clientName={step.client.name}
          description={`When is ${step.client.name}'s appointment, and which services are they booked for?`}
          onClose={onClose}
          onSuccess={(appointmentId) => {
            onAppointmentCreated?.();
            if (appointmentId) {
              setStep({ kind: "link", client: step.client, appointmentId });
            } else {
              onClose();
            }
          }}
        />
      );

    case "link": {
      const firstName = step.client.name?.split(" ")[0] || "your client";
      return (
        <ShareFormLinkModal
          appointmentId={step.appointmentId}
          clientName={step.client.name}
          title={`Forms sent to ${firstName}`}
          description={`We've emailed the forms to ${firstName}. To fill them out together now, start on this device, or share the link. No account or login needed.`}
          onClose={onClose}
        />
      );
    }
  }
};

export const StartFormIcon: React.FC = () => (
  <span
    style={{
      width: 36,
      height: 36,
      borderRadius: "50%",
      background: "#8E2D8E",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <ClipboardPen size={18} color="white" />
  </span>
);

export default StartNewFormFlow;

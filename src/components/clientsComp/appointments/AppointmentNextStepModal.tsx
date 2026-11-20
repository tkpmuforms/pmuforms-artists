"use client";

import {
  CheckCircle2,
  HeartPulse,
  MessageCircleHeart,
  Send,
  X,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import CareMessageModal from "./CareMessageModal";
import HealingCheckInModal from "./HealingCheckInModal";
import { CareAction } from "./AppointmentCard";
import "./care-message-modal.scss";

interface AppointmentNextStepModalProps {
  appointmentId: string;
  clientName: string;
  // called when the artist is done here, whatever they chose
  onFinish: () => void;
}

const OPTIONS: {
  action: CareAction;
  icon: React.ReactNode;
  title: string;
  description: string;
}[] = [
  {
    action: "complete",
    icon: <CheckCircle2 size={20} />,
    title: "Mark as complete",
    description:
      "Procedure done? Ends the appointment. You can also email aftercare and schedule a healing check-in.",
  },
  {
    action: "pre-care",
    icon: <Send size={20} />,
    title: "Send pre-care instructions",
    description: "What to avoid before the appointment, from your pre-care form.",
  },
  {
    action: "aftercare",
    icon: <HeartPulse size={20} />,
    title: "Send aftercare only",
    description: "Email aftercare without marking the appointment complete.",
  },
  {
    action: "check-in",
    icon: <MessageCircleHeart size={20} />,
    title: "Send healing check-in",
    description:
      "Schedule a \"how is it healing?\" email for later, and ask for a photo if you like.",
  },
];

/** Shown right after the artist signs: the step after "forms signed". */
const AppointmentNextStepModal: React.FC<AppointmentNextStepModalProps> = ({
  appointmentId,
  clientName,
  onFinish,
}) => {
  const [action, setAction] = useState<CareAction | null>(null);

  if (action === "check-in") {
    return (
      <HealingCheckInModal
        appointmentId={appointmentId}
        clientName={clientName}
        onClose={() => setAction(null)}
        onDone={onFinish}
      />
    );
  }

  if (action) {
    return (
      <CareMessageModal
        appointmentId={appointmentId}
        clientName={clientName}
        kind={action === "pre-care" ? "pre-care" : "aftercare"}
        mode={action === "complete" ? "complete" : "send"}
        onClose={() => setAction(null)}
        onDone={onFinish}
      />
    );
  }

  return (
    <div className="care-message-modal">
      <div className="care-message-modal__overlay" onClick={onFinish} />
      <div className="care-message-modal__content" role="dialog" aria-label="Forms signed">
        <button className="care-message-modal__close" onClick={onFinish} aria-label="Close">
          <X size={20} />
        </button>
        <div className="care-message-modal__header">
          <h2>Forms signed</h2>
          <p>What's next for {clientName}?</p>
        </div>

        <div className="care-message-modal__options">
          {OPTIONS.map((option) => (
            <button key={option.action} type="button" onClick={() => setAction(option.action)}>
              <span className="care-message-modal__option-icon">{option.icon}</span>
              <span>
                <strong>{option.title}</strong>
                <small>{option.description}</small>
              </span>
            </button>
          ))}
        </div>

        <div className="care-message-modal__footer">
          <button type="button" className="care-message-modal__secondary" onClick={onFinish}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentNextStepModal;

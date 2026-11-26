import { useEffect, useRef, useState } from "react";
import {
  CHECK_IN_DELAY_LIMITS,
  CheckInDraft,
  DelayUnit,
  draftCheckIn,
} from "../../../services/artistServices";
import { getApiErrorMessage } from "../../../utils/formLinks";

export interface CheckInPayload {
  amount: number;
  unit: DelayUnit;
  requestPhoto: boolean;
  subject: string;
  message: string;
}

/**
 * State for writing a healing check-in: timing first, then the message
 * (a standard one, the artist's own words, or AI's when they ask), and
 * whether to ask the client for a photo. Shared by the check-in modal and
 * Mark as complete.
 */
export const useHealingCheckIn = (appointmentId: string) => {
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<DelayUnit>("days");
  const [requestPhoto, setRequestPhoto] = useState(false);
  const [subject, setSubjectState] = useState("");
  const [message, setMessageState] = useState("");
  // once the artist types (or AI writes), timing changes no longer replace
  // the words; a ref so the delayed refresh sees the latest value
  const [edited, setEdited] = useState(false);
  const keepText = useRef(false);
  const [draft, setDraft] = useState<CheckInDraft | null>(null);
  const [writing, setWriting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestRequest = useRef(0);

  const limit = CHECK_IN_DELAY_LIMITS[unit];
  const amountNumber = Number(amount);
  const timingValid =
    amount !== "" &&
    Number.isInteger(amountNumber) &&
    amountNumber >= 1 &&
    amountNumber <= limit;

  const requestDraft = async (useAi: boolean) => {
    const requestId = ++latestRequest.current;
    const { data } = await draftCheckIn(appointmentId, {
      amount: amountNumber,
      unit,
      requestPhoto,
      useAi,
    });
    // a newer timing or AI request has replaced this one
    return requestId === latestRequest.current ? data : null;
  };

  // the send time, and the standard message until the artist writes their own
  useEffect(() => {
    if (!timingValid) return;
    const timer = setTimeout(() => {
      requestDraft(false)
        .then((data) => {
          if (!data) return;
          setError(null);
          if (keepText.current) {
            // only the send time and recipient change
            setDraft((prev) =>
              prev ? { ...prev, sendAt: data.sendAt, to: data.to } : data,
            );
            return;
          }
          setDraft(data);
          setSubjectState(data.subject);
          setMessageState(data.message);
        })
        .catch((err) =>
          setError(getApiErrorMessage(err, "Could not load the check-in.")),
        );
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountNumber, unit, requestPhoto, timingValid]);

  const writeWithAi = async () => {
    setWriting(true);
    setError(null);
    try {
      const data = await requestDraft(true);
      if (!data) return;
      setDraft(data);
      setSubjectState(data.subject);
      setMessageState(data.message);
      setEdited(false);
      keepText.current = data.source === "ai";
    } catch (err) {
      setError(getApiErrorMessage(err, "AI couldn't write this one."));
    } finally {
      setWriting(false);
    }
  };

  const typed = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setEdited(true);
    keepText.current = true;
  };

  // everything is in place to schedule it
  const ready =
    timingValid &&
    !!draft?.to &&
    !writing &&
    !!subject.trim() &&
    !!message.trim();

  const payload = (): CheckInPayload => ({
    amount: amountNumber,
    unit,
    requestPhoto,
    subject: subject.trim(),
    message: message.trim(),
  });

  return {
    amount,
    setAmount,
    unit,
    setUnit,
    limit,
    timingValid,
    requestPhoto,
    setRequestPhoto,
    subject,
    setSubject: typed(setSubjectState),
    message,
    setMessage: typed(setMessageState),
    edited,
    draft,
    writing,
    writeWithAi,
    error,
    ready,
    payload,
  };
};

export type HealingCheckInState = ReturnType<typeof useHealingCheckIn>;

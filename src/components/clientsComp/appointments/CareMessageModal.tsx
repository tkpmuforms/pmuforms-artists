"use client";

import { Plus, Sparkles, Trash2, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  CareContent,
  CareDraft,
  CareKind,
  ClientMessage,
  completeAppointment,
  getClientMessages,
  previewCareMessage,
  sendCareMessage,
} from "../../../services/artistServices";
import { getApiErrorMessage } from "../../../utils/formLinks";
import { formatSendAt } from "../../../utils/notes";
import { LoadingSmall } from "../../loading/Loading";
import HealingCheckInFields from "./HealingCheckInFields";
import { useHealingCheckIn } from "./useHealingCheckIn";
import "./care-message-modal.scss";

interface CareMessageModalProps {
  appointmentId: string;
  clientName: string;
  kind: CareKind;
  // "complete" marks the procedure done, and in the same step can email
  // aftercare and schedule a healing check-in
  mode?: "send" | "complete";
  onClose: () => void;
  onDone: (result: { completedAt?: string }) => void;
}

// sections are edited as one instruction per line
interface EditableSection {
  heading: string;
  itemsText: string;
}

const KIND_LABEL: Record<CareKind, string> = {
  "pre-care": "pre-care instructions",
  aftercare: "aftercare instructions",
};

const toEditable = (content: CareContent): EditableSection[] =>
  content.sections.map((s) => ({
    heading: s.heading,
    itemsText: s.items.join("\n"),
  }));

const toItems = (text: string) =>
  text
    .split("\n")
    .map((line) => line.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);

const formatSentAt = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

// says everything the one button will do
const completeLabel = (sendAftercare: boolean, scheduleCheckIn: boolean) =>
  sendAftercare && scheduleCheckIn
    ? "Mark as complete, send & schedule"
    : sendAftercare
      ? "Mark as complete & send aftercare"
      : scheduleCheckIn
        ? "Mark as complete & schedule check-in"
        : "Mark as complete";

const CareMessageModal: React.FC<CareMessageModalProps> = ({
  appointmentId,
  clientName,
  kind,
  mode = "send",
  onClose,
  onDone,
}) => {
  const firstName = clientName?.split(" ")[0] || "your client";
  const [draft, setDraft] = useState<CareDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<ClientMessage | null>(null);
  // marking complete doesn't email the client unless the artist opts in
  const [sendEmail, setSendEmail] = useState(false);
  const [scheduleCheckInToo, setScheduleCheckInToo] = useState(false);
  const checkIn = useHealingCheckIn(appointmentId);

  const [subject, setSubject] = useState("");
  const [intro, setIntro] = useState("");
  const [sections, setSections] = useState<EditableSection[]>([]);
  const [closing, setClosing] = useState("");

  const load = useCallback(
    (ai?: boolean) => {
      setLoading(true);
      setError(null);
      previewCareMessage(appointmentId, kind, ai)
        .then(({ data }) => {
          setDraft(data);
          const content = data.content;
          setSubject(
            content?.subject ??
              (kind === "pre-care"
                ? "Getting ready for your appointment"
                : "Caring for your new PMU"),
          );
          setIntro(content?.intro ?? `Hi ${firstName},`);
          setSections(
            content
              ? toEditable(content)
              : [{ heading: "", itemsText: "" }],
          );
          setClosing(
            content?.closing ??
              "If you have any questions, just reply to this email.",
          );
        })
        .catch((err) =>
          setError(
            getApiErrorMessage(err, "Could not load the instructions."),
          ),
        )
        .finally(() => setLoading(false));
    },
    [appointmentId, kind, firstName],
  );

  const showEditor = mode === "send" || sendEmail;

  // only fetch once the instructions are actually wanted. Starts from the
  // artist's form as written (or blank); AI only when they ask for it.
  const [requested, setRequested] = useState(false);
  useEffect(() => {
    if (showEditor && !requested) {
      setRequested(true);
      load(false);
    }
  }, [showEditor, requested, load]);

  useEffect(() => {
    getClientMessages(appointmentId)
      .then(({ data }) =>
        setLastSent(
          data.messages.find((m) => m.type === kind && m.status === "sent") ??
            null,
        ),
      )
      .catch(() => setLastSent(null));
  }, [appointmentId, kind]);

  const buildContent = (): CareContent | null => {
    const built = {
      subject: subject.trim(),
      intro: intro.trim(),
      sections: sections
        .map((s) => ({ heading: s.heading.trim(), items: toItems(s.itemsText) }))
        .filter((s) => s.items.length),
      closing: closing.trim(),
    };
    if (!built.subject) {
      setError("Add a subject line.");
      return null;
    }
    if (!built.sections.length) {
      setError("Add at least one instruction.");
      return null;
    }
    return built;
  };

  const handleSubmit = async () => {
    setError(null);
    const emailing = mode === "send" || sendEmail;
    const content = emailing ? buildContent() : undefined;
    if (emailing && !content) return;

    setSubmitting(true);
    try {
      if (mode === "complete") {
        const { data } = await completeAppointment(appointmentId, {
          sendAftercare: sendEmail,
          aftercare: content ?? undefined,
          checkIn: scheduleCheckInToo ? checkIn.payload() : undefined,
        });

        const done = ["Marked complete."];
        if (sendEmail && !data.aftercareError) {
          done.push(`Aftercare sent to ${firstName}.`);
        }
        if (scheduleCheckInToo && data.checkIn) {
          done.push(
            `Check-in scheduled for ${formatSendAt(data.checkIn.sendAt)}.`,
          );
        }
        toast.success(done.join(" "));
        // the appointment is complete either way; say what didn't go through
        if (data.aftercareError) {
          toast.error(`Aftercare wasn't sent: ${data.aftercareError}`);
        }
        if (data.checkInError) {
          toast.error(`The check-in wasn't scheduled: ${data.checkInError}`);
        }
        onDone({ completedAt: data.appointment.completedAt });
      } else {
        await sendCareMessage(appointmentId, {
          type: kind,
          content: content ?? undefined,
        });
        toast.success(
          `${kind === "pre-care" ? "Pre-care" : "Aftercare"} instructions sent to ${firstName}`,
        );
        onDone({});
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not send. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const updateSection = (index: number, patch: Partial<EditableSection>) =>
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );

  const title =
    mode === "complete"
      ? "Mark as complete"
      : kind === "pre-care"
        ? "Send pre-care instructions"
        : "Send aftercare instructions";

  const noEmail = draft && !draft.to;
  const formNames = draft?.formTitles?.length
    ? draft.formTitles.map((t) => `"${t}"`).join(", ")
    : null;

  return (
    <div className="care-message-modal">
      <div className="care-message-modal__overlay" onClick={onClose} />
      <div className="care-message-modal__content" role="dialog" aria-label={title}>
        <button className="care-message-modal__close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="care-message-modal__header">
          <h2>{title}</h2>
          <p>
            {mode === "complete"
              ? `Procedure done for ${clientName}? This ends the appointment. You can also send ${firstName} aftercare now and schedule a healing check-in, all in this step.`
              : `Review the ${KIND_LABEL[kind]} before they're emailed to ${clientName}.`}
          </p>
        </div>

        {mode === "complete" && (
          <div className="care-message-modal__choices">
            <label className="care-message-modal__toggle">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
              />
              Email aftercare instructions to {firstName} now
            </label>
            <label className="care-message-modal__toggle">
              <input
                type="checkbox"
                checked={scheduleCheckInToo}
                onChange={(e) => setScheduleCheckInToo(e.target.checked)}
              />
              Schedule a healing check-in for later
            </label>
          </div>
        )}

        {showEditor && (
          <>
            {mode === "complete" && (
              <h3 className="care-message-modal__part-title">Aftercare email</h3>
            )}
            {loading ? (
              <LoadingSmall />
            ) : (
              <div className="care-message-modal__body">
                <div className="care-message-modal__meta">
                  <span>
                    To: <strong>{draft?.to ?? "no email on file"}</strong>
                  </span>
                  {draft?.source === "ai" && (
                    <span className="care-message-modal__badge">
                      <Sparkles size={12} />
                      {formNames
                        ? `Written by AI from ${formNames}, please review`
                        : "Written by AI from the services, please review"}
                    </span>
                  )}
                  {draft?.source === "template" && (
                    <span className="care-message-modal__badge care-message-modal__badge--plain">
                      From your form{draft.formTitles.length > 1 ? "s" : ""}{" "}
                      {formNames}
                    </span>
                  )}
                </div>

                {draft?.aiFailed && (
                  <p className="care-message-modal__note">
                    AI couldn't write this one, so this is your form as
                    written. You can edit it or try again.
                  </p>
                )}

                {lastSent && (
                  <p className="care-message-modal__note">
                    Already sent {formatSentAt(lastSent.sentAt)}
                    {lastSent.trigger === "auto" ? " automatically" : ""}. Sending
                    again emails {firstName} another copy.
                  </p>
                )}

                {!draft?.content && (
                  <p className="care-message-modal__note">
                    There's no {kind === "pre-care" ? "pre-care" : "aftercare"} form
                    for these services yet. Write the instructions below
                    {draft?.aiAvailable ? " or let AI draft them" : ""}.
                  </p>
                )}

                {draft?.aiAvailable && (
                  <div className="care-message-modal__ai-actions">
                    <button type="button" onClick={() => load(true)}>
                      <Sparkles size={14} />
                      {draft.source === "ai" ? "Rewrite with AI" : "Write with AI"}
                    </button>
                    {draft.hasForm && draft.source === "ai" && (
                      <button type="button" onClick={() => load(false)}>
                        Use my form as written
                      </button>
                    )}
                  </div>
                )}

                <label className="care-message-modal__field">
                  <span>Subject</span>
                  <input value={subject} onChange={(e) => setSubject(e.target.value)} />
                </label>

                <label className="care-message-modal__field">
                  <span>Opening</span>
                  <textarea rows={3} value={intro} onChange={(e) => setIntro(e.target.value)} />
                </label>

                {sections.map((section, index) => (
                  <div key={index} className="care-message-modal__section">
                    <div className="care-message-modal__section-head">
                      <input
                        placeholder="Heading, e.g. 48 hours before"
                        value={section.heading}
                        onChange={(e) => updateSection(index, { heading: e.target.value })}
                      />
                      {sections.length > 1 && (
                        <button
                          type="button"
                          aria-label="Remove section"
                          onClick={() =>
                            setSections((prev) => prev.filter((_, i) => i !== index))
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={Math.min(10, Math.max(3, section.itemsText.split("\n").length + 1))}
                      placeholder="One instruction per line"
                      value={section.itemsText}
                      onChange={(e) => updateSection(index, { itemsText: e.target.value })}
                    />
                  </div>
                ))}

                <button
                  type="button"
                  className="care-message-modal__add-section"
                  onClick={() => setSections((prev) => [...prev, { heading: "", itemsText: "" }])}
                >
                  <Plus size={14} /> Add section
                </button>

                <label className="care-message-modal__field">
                  <span>Closing</span>
                  <textarea rows={2} value={closing} onChange={(e) => setClosing(e.target.value)} />
                </label>
              </div>
            )}
          </>
        )}

        {mode === "complete" && scheduleCheckInToo && (
          <>
            <h3 className="care-message-modal__part-title">Healing check-in</h3>
            <HealingCheckInFields checkIn={checkIn} firstName={firstName} />
            {checkIn.error && (
              <p className="care-message-modal__error">{checkIn.error}</p>
            )}
          </>
        )}

        {mode === "complete" && (
          <ul className="care-message-modal__summary" aria-label="What happens">
            <li>The appointment is marked complete</li>
            {sendEmail && (
              <li>Aftercare is emailed to {draft?.to ?? firstName} now</li>
            )}
            {scheduleCheckInToo && (
              <li>
                {checkIn.timingValid && checkIn.draft?.sendAt
                  ? `A healing check-in goes out ${formatSendAt(checkIn.draft.sendAt)}`
                  : "A healing check-in is scheduled (set when above)"}
              </li>
            )}
          </ul>
        )}

        {error && (
          <p className="care-message-modal__error">
            {error}
            {showEditor && !draft && !loading && (
              <>
                {" "}
                <button
                  type="button"
                  className="care-message-modal__retry"
                  onClick={() => load(false)}
                >
                  Try again
                </button>
              </>
            )}
          </p>
        )}

        <div className="care-message-modal__footer">
          <button type="button" className="care-message-modal__secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="care-message-modal__primary"
            onClick={handleSubmit}
            disabled={
              submitting ||
              (showEditor && (loading || !draft || !!noEmail)) ||
              (mode === "complete" && scheduleCheckInToo && !checkIn.ready)
            }
          >
            {submitting
              ? "Working..."
              : mode === "complete"
                ? completeLabel(sendEmail, scheduleCheckInToo)
                : `Send to ${firstName}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CareMessageModal;

import { Note } from "../redux/types";

/**
 * Emails (sent or scheduled) and client photos are logged by the app and
 * can't be edited or deleted. A scheduled email can be cancelled.
 */
export const isRecordNote = (note: Note) =>
  !!note.kind && note.kind !== "note";

export const isScheduledNote = (note: Note) =>
  note.kind === "scheduled-email" && !!note.messageId && !!note.appointmentId;

export const formatSendAt = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

/** "Sent", "Received", "Goes out" or the artist-note labels. */
export const recordDateLabel = (note: Note) =>
  note.kind === "email"
    ? "Sent"
    : note.kind === "client-photo"
      ? "Received"
      : "Goes out";

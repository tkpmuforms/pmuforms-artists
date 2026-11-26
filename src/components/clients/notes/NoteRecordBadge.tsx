import { Camera, Clock, Mail } from "lucide-react";
import type React from "react";
import { Note } from "../../../redux/types";
import { isRecordNote } from "../../../utils/notes";

// what the app emailed, in the artist's words
const MESSAGE_LABEL: Record<string, string> = {
  booking: "Forms request",
  "form-nudge-48h": "Forms reminder",
  "form-nudge-24h": "Forms reminder",
  "pre-care": "Pre-care instructions",
  aftercare: "Aftercare instructions",
  "healing-check-in": "Healing check-in",
};

interface NoteRecordBadgeProps {
  note: Note;
  // e.g. "Nov 20, 2026 · Microblading", when the appointment is known
  appointmentLabel?: string;
}

const NoteRecordBadge: React.FC<NoteRecordBadgeProps> = ({
  note,
  appointmentLabel,
}) => {
  if (!isRecordNote(note) && !note.appointmentId) return null;

  return (
    <div className="note-record">
      {note.kind === "email" && (
        <span className="note-record__badge">
          <Mail size={12} />
          Email sent
          {note.messageType && MESSAGE_LABEL[note.messageType]
            ? ` · ${MESSAGE_LABEL[note.messageType]}`
            : ""}
        </span>
      )}
      {note.kind === "scheduled-email" && (
        <span className="note-record__badge note-record__badge--scheduled">
          <Clock size={12} />
          Scheduled
          {note.messageType && MESSAGE_LABEL[note.messageType]
            ? ` · ${MESSAGE_LABEL[note.messageType]}`
            : ""}
        </span>
      )}
      {note.kind === "client-photo" && (
        <span className="note-record__badge note-record__badge--photo">
          <Camera size={12} />
          Photo from client
        </span>
      )}
      {note.appointmentId && (
        <span className="note-record__appointment">
          Appointment{appointmentLabel ? `: ${appointmentLabel}` : ""}
        </span>
      )}
    </div>
  );
};

export default NoteRecordBadge;

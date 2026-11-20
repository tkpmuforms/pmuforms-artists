"use client";

import { Camera, Eye, Trash2 } from "lucide-react";
import type React from "react";
import { Note } from "../../../redux/types";
import {
  formatSendAt,
  isRecordNote,
  isScheduledNote,
  recordDateLabel,
} from "../../../utils/notes";
import NoteRecordBadge from "./NoteRecordBadge";
import "./noteCard.scss";

interface NoteCardProps {
  note: Note;
  isSelected: boolean;
  onNoteClick: (note: Note) => void;
  onDeleteNote: (note: Note) => void;
  onImageClick?: (imageUrl: string) => void;
  formatDate: (date: string) => string;
  appointmentLabel?: string;
  // cancels a scheduled email
  onCancelScheduled?: (note: Note) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({
  note,
  isSelected,
  onNoteClick,
  onDeleteNote,
  onImageClick,
  formatDate,
  appointmentLabel,
  onCancelScheduled,
}) => {
  const isRecord = isRecordNote(note);

  const getDisplayDate = (note: Note) => {
    const isUpdated =
      note.updatedAt && note.createdAt && note.updatedAt !== note.createdAt;
    return isUpdated
      ? formatDate(note.updatedAt ?? note.date)
      : note.createdAt
      ? formatDate(note.createdAt ?? note.date)
      : formatDate(note.date);
  };

  const getDateLabel = (note: Note) => {
    if (isRecord) return recordDateLabel(note);
    return note.updatedAt && note.createdAt && note.updatedAt !== note.createdAt
      ? "Updated"
      : "Created";
  };

  return (
    <div
      className={`note-card ${isSelected ? "note-card--selected" : ""}`}
      onClick={() => onNoteClick(note)}
    >
      <NoteRecordBadge note={note} appointmentLabel={appointmentLabel} />
      <div className="note-card__content">
        {note.imageUrl && (
          <div
            className="note-card__image"
            onClick={(e) => {
              e.stopPropagation();
              onImageClick?.(note.imageUrl!);
            }}
          >
            <img
              src={note.imageUrl}
              alt="Note attachment"
              className="note-card__img"
            />
            <div className="note-card__icons">
              <Camera size={14} />
              <Eye size={14} />
            </div>
          </div>
        )}
        {note.kind === "email" || note.kind === "scheduled-email" ? (
          <p className="note-card__text note-card__text--record">
            {note.subject || note.note}
          </p>
        ) : (
          <p className="note-card__text">{note.note}</p>
        )}
        {/* records of communication with the client can't be deleted */}
        {!isRecord && (
          <div className="note-card__actions">
            <button
              className="note-action-btn note-action-btn--delete"
              aria-label="Delete note"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteNote(note);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
        {isScheduledNote(note) && onCancelScheduled && (
          <div className="note-card__actions">
            <button
              className="note-cancel-btn"
              onClick={(e) => {
                e.stopPropagation();
                onCancelScheduled(note);
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      <p className="note-card__timestamp">
        {getDateLabel(note)}:{" "}
        {note.kind === "scheduled-email"
          ? formatSendAt(note.sendAt)
          : getDisplayDate(note)}
      </p>
    </div>
  );
};

export default NoteCard;

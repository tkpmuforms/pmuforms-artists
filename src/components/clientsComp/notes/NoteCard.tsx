"use client";

import { Camera, Trash2 } from "lucide-react";
import type React from "react";
import "./noteCard.scss";

interface Note {
  id: string;
  note: string;
  createdAt?: string;
  updatedAt?: string;
  date: string;
  artistId: string;
  _id: string;
  imageUrl?: string;
}

interface NoteCardProps {
  note: Note;
  isSelected: boolean;
  onNoteClick: (note: Note) => void;
  onDeleteNote: (note: Note) => void;
  formatDate: (date: string) => string;
}

const NoteCard: React.FC<NoteCardProps> = ({
  note,
  isSelected,
  onNoteClick,
  onDeleteNote,
  formatDate,
}) => {
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
    return note.updatedAt && note.createdAt && note.updatedAt !== note.createdAt
      ? "Updated"
      : "Created";
  };

  return (
    <div
      className={`note-card ${isSelected ? "note-card--selected" : ""}`}
      onClick={() => onNoteClick(note)}
    >
      <div className="note-card__content">
        {note.imageUrl && (
          <div className="note-card__image">
            <img
              src={note.imageUrl}
              alt="Note attachment"
              className="note-card__img"
            />
            <Camera className="note-card__camera-icon" size={14} />
          </div>
        )}
        <p className="note-card__text">{note.note}</p>
        <div className="note-card__actions">
          <button
            className="note-action-btn note-action-btn--delete"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteNote(note);
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <p className="note-card__timestamp">
        {getDateLabel(note)}: {getDisplayDate(note)}
      </p>
    </div>
  );
};

export default NoteCard;

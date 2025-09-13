"use client";

import { Edit3, Plus, Save, Trash2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useParams } from "react-router-dom";
import DeleteModal from "../../../components/clientsComp/details/DeleteModal";
import NotesModal from "../../../components/clientsComp/notes/NotesModal";
import {
  addCustomerNote,
  deleteCustomerNote,
  getCustomerNotes,
  updateCustomerNote,
} from "../../../services/artistServices";
import { formatDate } from "../../../utils/utils";
import "./client-notes.scss";

interface Note {
  id: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  date: string;
  artistId: string;
  _id: string;
}

const ClientNotesPage: React.FC = () => {
  const location = useLocation();
  const { clientName } = location.state || {};
  const { clientId } = useParams<{ clientId: string }>();
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentNote, setCurrentNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    if (clientId) {
      loadNotes();
    }
  }, [clientId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const response = await getCustomerNotes(clientId!);
      setNotes(response.data?.notes || []);
    } catch (error) {
      console.error("Error loading notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = () => {
    setSelectedNote(null);
    setCurrentNote("");
    setShowNotesModal(true);
  };

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    setEditContent(note.note);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    if (selectedNote) {
      setEditContent(selectedNote.note);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedNote || !clientId) return;

    try {
      await updateCustomerNote(clientId, selectedNote.id, {
        note: editContent,
      });

      const updatedNote = {
        ...selectedNote,
        note: editContent,
        updatedAt: new Date().toISOString(),
      };

      setNotes(
        notes.map((note) => (note.id === selectedNote.id ? updatedNote : note))
      );

      setSelectedNote(updatedNote);
      setIsEditing(false);
      toast.success("Note updated successfully");
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Failed to update note");
    }
  };

  const handleCancelEdit = () => {
    if (selectedNote) {
      setEditContent(selectedNote.note);
    }
    setIsEditing(false);
  };

  const handleDeleteNote = (note: Note) => {
    setSelectedNote(note);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (selectedNote && clientId) {
      try {
        await deleteCustomerNote(clientId, selectedNote.id);
        setNotes(notes.filter((note) => note.id !== selectedNote.id));

        // Clear selection if deleted note was selected
        if (selectedNote.id === selectedNote.id) {
          setSelectedNote(null);
          setIsEditing(false);
        }

        toast.success("Note deleted successfully");
      } catch (error) {
        console.error("Error deleting note:", error);
        toast.error("Failed to delete note");
      }
    }
    setShowDeleteModal(false);
    setSelectedNote(null);
  };

  const handleSaveNote = async (content: string) => {
    if (!clientId) return;

    try {
      const response = await addCustomerNote(clientId, { note: content });
      setNotes([response.data.note, ...notes]);
      toast.success("Note added successfully");
      setShowNotesModal(false);
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note");
    }
  };

  if (loading) {
    return (
      <div className="client-notes-page">
        <div className="client-notes-page__loading">Loading notes...</div>
      </div>
    );
  }

  return (
    <div className="client-notes-page">
      <div className="client-notes-page__content">
        <div className="content-grid">
          <div className="notes-column">
            <div className="notes-column__header">
              <div className="appointment-info">
                <h2 className="appointment-info__title">{clientName}</h2>
                <p className="appointment-info__subtitle">
                  Important notes for your client
                </p>
              </div>
            </div>

            <div className="notes-list">
              {notes.length === 0 ? (
                <div className="notes-list__empty">
                  <p>No notes added yet</p>
                  <button className="add-note-btn" onClick={handleAddNote}>
                    <Plus size={16} />
                    Add Your First Note
                  </button>
                </div>
              ) : (
                notes?.map((note) => (
                  <div
                    key={note.id}
                    className={`note-card ${
                      selectedNote?.id === note.id ? "note-card--selected" : ""
                    }`}
                    onClick={() => handleNoteClick(note)}
                  >
                    <div className="note-card__content">
                      <p className="note-card__text">{note.note}</p>
                      <div className="note-card__actions">
                        <button
                          className="note-action-btn note-action-btn--delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note);
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="note-card__timestamp">
                      {note?.updatedAt !== note?.createdAt
                        ? `Updated: ${formatDate(note?.updatedAt)}`
                        : `Created: ${formatDate(note?.createdAt)}`}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column - Note Preview/Editor */}
          <div className="editor-column">
            <button className="add-note-btn" onClick={handleAddNote}>
              <Plus size={16} />
              Add a Note
            </button>
            <div className="editor-card">
              <div className="editor-card__header">
                <h3 className="editor-card__title">Note </h3>

                <div className="editor-card__actions">
                  {selectedNote && (
                    <>
                      {isEditing ? (
                        <>
                          <button
                            className="editor-action-btn editor-action-btn--cancel"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </button>
                          <button
                            className="editor-action-btn editor-action-btn--save"
                            onClick={handleSaveEdit}
                          >
                            <Save size={16} />
                            Save
                          </button>
                        </>
                      ) : (
                        <button
                          className="editor-action-btn editor-action-btn--edit"
                          onClick={handleEditClick}
                        >
                          <Edit3 size={16} />
                          Edit
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="editor-card__content">
                {selectedNote ? (
                  <div className="editor-preview">
                    {isEditing ? (
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="editor-preview__textarea"
                        rows={8}
                        placeholder="Enter your note here..."
                      />
                    ) : (
                      <p className="editor-preview__text">
                        {selectedNote.note}
                      </p>
                    )}
                    <div className="editor-preview__meta">
                      <p className="editor-preview__date">
                        {selectedNote.updatedAt !== selectedNote.createdAt
                          ? `Last updated: ${formatDate(
                              selectedNote.updatedAt
                            )}`
                          : `Created: ${formatDate(selectedNote.createdAt)}`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="editor-placeholder">
                    <p>Select a note to view its content</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showNotesModal && (
        <NotesModal
          onClose={() => setShowNotesModal(false)}
          onSave={handleSaveNote}
          initialContent={currentNote}
          title="Add a Note"
        />
      )}

      {showDeleteModal && (
        <DeleteModal
          onClose={() => setShowDeleteModal(false)}
          headerText="Delete this Note"
          shorterText="Are you sure you want to delete this note?"
          handleDelete={confirmDelete}
        />
      )}
    </div>
  );
};

export default ClientNotesPage;

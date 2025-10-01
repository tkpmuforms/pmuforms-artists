"use client";

import imageCompression from "browser-image-compression";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type React from "react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useParams } from "react-router-dom";
import DeleteModal from "../../../components/clientsComp/details/DeleteModal";
import EditCard from "../../../components/clientsComp/notes/EditNoteCard";
import NoteCard from "../../../components/clientsComp/notes/NoteCard";
import NotesModal from "../../../components/clientsComp/notes/NotesModal";
import useAuth from "../../../context/useAuth";
import { storage } from "../../../firebase/firebase";
import { Note } from "../../../redux/types";
import {
  addCustomerNote,
  deleteCustomerNote,
  getCustomerNotes,
  updateCustomerNote,
} from "../../../services/artistServices";
import { formatDate } from "../../../utils/utils";
import "./client-notes.scss";
import { LoadingSmall } from "../../../components/loading/Loading";
import { Plus } from "lucide-react";

const ClientNotesPage: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
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
  const [editImageUrl, setEditImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

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

  const handleImageUpload = async (file: File): Promise<string> => {
    if (!file) return "";

    setIsUploading(true);
    try {
      const options = {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 500,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      const storageRef = ref(
        storage,
        `images/${user._id}/${file.name}-${Date.now()}`
      );
      const snapshot = await uploadBytes(storageRef, compressedFile);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      toast.success("Image uploaded successfully");
      return downloadUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Error uploading image");
      return "";
    } finally {
      setIsUploading(false);
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
    setEditImageUrl(note.imageUrl || "");
    setIsEditing(false);
  };

  const handleEditClick = () => {
    if (selectedNote) {
      setEditContent(selectedNote.note);
      setEditImageUrl(selectedNote.imageUrl || "");
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedNote || !clientId) return;

    try {
      await updateCustomerNote(clientId, selectedNote.id, {
        note: editContent,
        imageUrl: editImageUrl,
      });

      const updatedNote = {
        ...selectedNote,
        note: editContent,
        imageUrl: editImageUrl,
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
      setEditImageUrl(selectedNote.imageUrl || "");
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

  const handleSaveNote = async (content: string, imageUrl?: string) => {
    if (!clientId) return;

    try {
      const response = await addCustomerNote(clientId, {
        note: content,
        imageUrl: imageUrl || undefined,
      });
      setNotes([response.data.note, ...notes]);
      toast.success("Note added successfully");
      setShowNotesModal(false);
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note");
    }
  };

  if (loading) {
    return <LoadingSmall />;
  }

  return (
    <div className="client-notes-page">
      <div className="client-notes-page__header">
        <div className="appointment-info__header">
          <h2 className="appointment-info__title">{clientName}</h2>
          <p className="appointment-info__subtitle">
            Important notes for your client
          </p>
        </div>
        <button className="add-note-btn" onClick={handleAddNote}>
          <Plus size={16} />
          Add a Note
        </button>
      </div>

      <div className="content-grid">
        <div className="notes-column">
          <div className="notes-list">
            {notes?.length === 0 ? (
              <div className="notes-list__empty">
                <p>No notes added yet</p>
              </div>
            ) : (
              notes?.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  isSelected={selectedNote?.id === note.id}
                  onNoteClick={handleNoteClick}
                  onDeleteNote={handleDeleteNote}
                  formatDate={formatDate}
                />
              ))
            )}
          </div>
        </div>

        <EditCard
          selectedNote={selectedNote}
          isEditing={isEditing}
          editContent={editContent}
          setEditContent={setEditContent}
          editImageUrl={editImageUrl}
          setEditImageUrl={setEditImageUrl}
          onEditClick={handleEditClick}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={handleCancelEdit}
          onImageUpload={handleImageUpload}
          formatDate={formatDate}
          isUploading={isUploading}
        />
      </div>

      {showNotesModal && (
        <NotesModal
          onClose={() => setShowNotesModal(false)}
          onSave={handleSaveNote}
          initialContent={currentNote}
          title="Add a Note"
          onImageUpload={handleImageUpload}
          isUploading={isUploading}
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

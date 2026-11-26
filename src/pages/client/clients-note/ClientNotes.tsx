"use client";

import imageCompression from "browser-image-compression";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useParams } from "react-router-dom";
import DeleteModal from "../../../components/clientsComp/details/DeleteModal";
import EditCard from "../../../components/clientsComp/notes/EditNoteCard";
import NoteCard from "../../../components/clientsComp/notes/NoteCard";
import ImageViewerModal from "../../../components/clientsComp/notes/ImageViewerModal";
import NotesModal from "../../../components/clientsComp/notes/NotesModal";
import useAuth from "../../../context/useAuth";
import { storage } from "../../../firebase/firebase";
import { ClientAppointmentData, Note } from "../../../redux/types";
import {
  addCustomerNote,
  cancelScheduledMessage,
  deleteCustomerNote,
  getAppointmentsForCustomer,
  getCustomerNotes,
  updateCustomerNote,
} from "../../../services/artistServices";
import { formatDate } from "../../../utils/utils";
import { getApiErrorMessage } from "../../../utils/formLinks";
import { formatSendAt } from "../../../utils/notes";
import { useWhoDid } from "../../../utils/teamPeople";
import {
  NOTE_RANGES,
  NOTE_TYPES,
  NO_NOTE_FILTERS,
  NoteFilters,
  NoteRange,
  NoteSort,
  filterNotes,
  hasNoteFilters,
} from "../../../utils/noteFilters";
import "./client-notes.scss";
import { LoadingSmall } from "../../../components/loading/Loading";
import { Camera, Plus, Search, X } from "lucide-react";

const ClientNotesPage: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const who = useWhoDid();
  // the app writes records (emails, client photos); people write notes
  const authorOf = (note: Note) =>
    who.hasTeam && (!note.kind || note.kind === "note")
      ? who.label(note.addedBy, { ownerIfMissing: true }) || undefined
      : undefined;
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
  const [viewerImageUrl, setViewerImageUrl] = useState<string | null>(null);
  const [scheduledToCancel, setScheduledToCancel] = useState<Note | null>(
    null,
  );
  // "Nov 20, 2026 · Microblading" by appointment id, to label emails and
  // photos with the appointment they belong to
  const [appointmentLabels, setAppointmentLabels] = useState<
    Record<string, string>
  >({});
  const [filters, setFilters] = useState<NoteFilters>(NO_NOTE_FILTERS);
  const setFilter = <K extends keyof NoteFilters>(
    key: K,
    value: NoteFilters[K],
  ) => setFilters((prev) => ({ ...prev, [key]: value }));
  const filtering = hasNoteFilters(filters);
  const { notes: shownNotes, counts } = useMemo(
    () => filterNotes(notes, filters),
    [notes, filters],
  );

  useEffect(() => {
    if (clientId) {
      loadNotes();
      loadAppointmentLabels();
    }
  }, [clientId]);

  const loadAppointmentLabels = async () => {
    try {
      const response = await getAppointmentsForCustomer(clientId!);
      const appointments: ClientAppointmentData[] =
        response.data?.appointments || [];
      setAppointmentLabels(
        Object.fromEntries(
          appointments.map((apt) => [
            apt.id,
            [
              new Date(apt.date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              apt.serviceDetails?.map((s) => s.service).join(", "),
            ]
              .filter(Boolean)
              .join(" · "),
          ]),
        ),
      );
    } catch {
      // labels are a nicety; the notes still show without them
    }
  };

  const labelFor = (note: Note | null) =>
    note?.appointmentId ? appointmentLabels[note.appointmentId] : undefined;

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
        `images/${user._id}/${file.name}-${Date.now()}`,
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
        notes.map((note) => (note.id === selectedNote.id ? updatedNote : note)),
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

  const confirmCancelScheduled = async () => {
    const note = scheduledToCancel;
    setScheduledToCancel(null);
    if (!note?.appointmentId || !note.messageId) return;

    try {
      await cancelScheduledMessage(note.appointmentId, note.messageId);
      setNotes((prev) => prev.filter((n) => n.id !== note.id));
      if (selectedNote?.id === note.id) setSelectedNote(null);
      toast.success("Scheduled email cancelled");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not cancel the email."));
      // it may have just been sent; show the latest
      loadNotes();
    }
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
            Your notes, plus every email sent or scheduled for {clientName?.split(" ")[0] || "your client"} and photos they send back
          </p>
        </div>
        <button className="add-note-btn" onClick={handleAddNote}>
          <Plus size={16} />
          Add a Note
        </button>
      </div>

      {notes?.length > 0 && (
        <div className="notes-filters" aria-label="Filter notes" role="search">
          <div className="notes-filters__row">
            <label className="notes-filters__search">
              <Search size={16} aria-hidden />
              <input
                type="search"
                aria-label="Search notes"
                placeholder="Search notes and email subjects"
                value={filters.search}
                onChange={(e) => setFilter("search", e.target.value)}
              />
            </label>
            <select
              aria-label="Date range"
              value={filters.range}
              onChange={(e) => setFilter("range", e.target.value as NoteRange)}
            >
              {NOTE_RANGES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {filters.range === "custom" && (
              <>
                <label className="notes-filters__date">
                  From
                  <input
                    type="date"
                    aria-label="From date"
                    value={filters.from}
                    max={filters.to || undefined}
                    onChange={(e) => setFilter("from", e.target.value)}
                  />
                </label>
                <label className="notes-filters__date">
                  To
                  <input
                    type="date"
                    aria-label="To date"
                    value={filters.to}
                    min={filters.from || undefined}
                    onChange={(e) => setFilter("to", e.target.value)}
                  />
                </label>
              </>
            )}
            <select
              aria-label="Sort"
              value={filters.sort}
              onChange={(e) => setFilter("sort", e.target.value as NoteSort)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
          <div className="notes-filters__chips">
            {NOTE_TYPES.map((t) => {
              const active = filters.type === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={active}
                  className={`notes-filters__chip ${active ? "notes-filters__chip--active" : ""}`}
                  onClick={() => setFilter("type", t.value)}
                >
                  {t.label}
                  <span className="notes-filters__count">{counts[t.value]}</span>
                </button>
              );
            })}
            <button
              type="button"
              aria-pressed={filters.photosOnly}
              className={`notes-filters__chip ${filters.photosOnly ? "notes-filters__chip--active" : ""}`}
              onClick={() => setFilter("photosOnly", !filters.photosOnly)}
            >
              <Camera size={14} aria-hidden />
              With photos
            </button>
          </div>
          {filtering && (
            <div className="notes-filters__result" aria-live="polite">
              <span>
                {shownNotes.length} of {notes.length} notes
              </span>
              <button
                type="button"
                className="notes-filters__clear"
                onClick={() => setFilters(NO_NOTE_FILTERS)}
              >
                <X size={14} aria-hidden />
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {notes?.length === 0 ? (
        <div className="notes-empty-state">
          <p>No notes added</p>
        </div>
      ) : shownNotes.length === 0 ? (
        <div className="notes-empty-state">
          <p>No notes match these filters.</p>
          <button
            type="button"
            className="notes-filters__clear"
            onClick={() => setFilters(NO_NOTE_FILTERS)}
          >
            <X size={14} aria-hidden />
            Clear filters
          </button>
        </div>
      ) : (
        <div className="content-grid">
          <div className="notes-column">
            <div className="notes-list">
              {shownNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  isSelected={selectedNote?.id === note.id}
                  onNoteClick={handleNoteClick}
                  onDeleteNote={handleDeleteNote}
                  onImageClick={setViewerImageUrl}
                  formatDate={formatDate}
                  appointmentLabel={labelFor(note)}
                  onCancelScheduled={setScheduledToCancel}
                  author={authorOf(note)}
                />
              ))}
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
            onImageClick={setViewerImageUrl}
            formatDate={formatDate}
            isUploading={isUploading}
            appointmentLabel={labelFor(selectedNote)}
            onCancelScheduled={setScheduledToCancel}
          />
        </div>
      )}

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

      {scheduledToCancel && (
        <DeleteModal
          onClose={() => setScheduledToCancel(null)}
          headerText="Cancel this email?"
          shorterText={`"${scheduledToCancel.subject ?? "This email"}" won't be sent ${formatSendAt(scheduledToCancel.sendAt)}.`}
          confirmLabel="Cancel email"
          cancelLabel="Keep it"
          handleDelete={confirmCancelScheduled}
        />
      )}

      {viewerImageUrl && (
        <ImageViewerModal
          imageUrl={viewerImageUrl}
          onClose={() => setViewerImageUrl(null)}
        />
      )}
    </div>
  );
};

export default ClientNotesPage;

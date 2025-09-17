"use client";

import { Camera, Edit3, Save, Trash2, Upload } from "lucide-react";
import type React from "react";
import { useRef } from "react";
import { Note } from "../../../redux/types";
import "./editNoteCard.scss";

interface EditCardProps {
  selectedNote: Note | null;
  isEditing: boolean;
  editContent: string;
  setEditContent: (content: string) => void;
  editImageUrl: string;
  setEditImageUrl: (url: string) => void;
  onEditClick: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onImageUpload: (file: File) => Promise<void>;
  formatDate: (date: string) => string;
  isUploading?: boolean;
}

const EditCard: React.FC<EditCardProps> = ({
  selectedNote,
  isEditing,
  editContent,
  setEditContent,
  editImageUrl,
  setEditImageUrl,
  onEditClick,
  onSaveEdit,
  onCancelEdit,
  onImageUpload,
  formatDate,
  isUploading = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      await onImageUpload(file);
    }
  };

  const handleRemoveImage = () => {
    setEditImageUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getDisplayDate = (note: Note, isUpdated: boolean = false) => {
    if (
      isUpdated &&
      note.updatedAt &&
      note.createdAt &&
      note.updatedAt !== note.createdAt
    ) {
      return formatDate(note.updatedAt);
    } else if (note.createdAt) {
      return formatDate(note.createdAt);
    } else {
      return formatDate(note.date);
    }
  };

  const getDateLabel = (note: Note) => {
    if (note.updatedAt && note.createdAt && note.updatedAt !== note.createdAt) {
      return "Updated";
    } else {
      return "Created";
    }
  };

  return (
    <div className="editor-column">
      <div className="editor-card">
        <div className="editor-card__header">
          <h3 className="editor-card__title">Note</h3>

          <div className="editor-card__actions">
            {selectedNote && (
              <>
                {isEditing ? (
                  <>
                    <button
                      className="editor-action-btn editor-action-btn--cancel"
                      onClick={onCancelEdit}
                    >
                      Cancel
                    </button>
                    <button
                      className="editor-action-btn editor-action-btn--save"
                      onClick={onSaveEdit}
                      disabled={isUploading}
                    >
                      <Save size={16} />
                      {isUploading ? "Saving..." : "Save"}
                    </button>
                  </>
                ) : (
                  <button
                    className="editor-action-btn editor-action-btn--edit"
                    onClick={onEditClick}
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
                <>
                  <div className="editor-preview__image-upload">
                    {editImageUrl && (
                      <div className="editor-preview__image">
                        <img
                          src={editImageUrl}
                          alt="Note attachment"
                          className="editor-preview__img"
                        />
                        <button
                          type="button"
                          className="editor-preview__remove-image"
                          onClick={handleRemoveImage}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                    <div className="image-upload-section">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="image-upload-input"
                        disabled={isUploading}
                      />
                      <button
                        type="button"
                        className="image-upload-btn"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <>Uploading...</>
                        ) : (
                          <>
                            <Upload size={16} />
                            {editImageUrl ? "Change Image" : "Add Image"}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="editor-preview__textarea"
                    rows={8}
                    placeholder="Enter your note here..."
                  />
                </>
              ) : (
                <>
                  {selectedNote.imageUrl && (
                    <div className="editor-preview__image">
                      <img
                        src={selectedNote.imageUrl}
                        alt="Note attachment"
                        className="editor-preview__img"
                      />
                      <Camera
                        className="editor-preview__camera-icon"
                        size={16}
                      />
                    </div>
                  )}
                  <p className="editor-preview__text">{selectedNote.note}</p>
                </>
              )}
              <div className="editor-preview__meta">
                <p className="editor-preview__date">
                  {getDateLabel(selectedNote)}: {getDisplayDate(selectedNote)}
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
  );
};

export default EditCard;

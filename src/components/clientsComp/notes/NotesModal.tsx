"use client";
import { useState, useEffect, useRef } from "react";
import { X, Upload, Trash2 } from "lucide-react";
import type React from "react";
import "./NotesModal.scss";

interface NotesModalProps {
  onClose: () => void;
  onSave: (content: string, imageUrl?: string) => void;
  initialContent?: string;
  title: string;
  onImageUpload?: (file: File) => Promise<string>;
  isUploading?: boolean;
}

const NotesModal: React.FC<NotesModalProps> = ({
  onClose,
  onSave,
  initialContent = "",
  title,
  onImageUpload,
  isUploading = false,
}) => {
  const [content, setContent] = useState(initialContent);
  const [imageUrl, setImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file && onImageUpload) {
      const url = await onImageUpload(file);
      setImageUrl(url);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = () => {
    const noteContent = content.trim() || (imageUrl ? "Image Only" : "");
    if (noteContent || imageUrl) {
      onSave(noteContent, imageUrl);
      setContent("");
      setImageUrl("");
      onClose();
    }
  };

  const handleClose = () => {
    setContent("");
    setImageUrl("");
    onClose();
  };

  return (
    <div className="notes-modal">
      <div className="notes-modal__overlay" onClick={handleClose} />
      <div className="notes-modal__content">
        <button className="notes-modal__close" onClick={handleClose}>
          <X size={20} />
        </button>

        <div className="notes-modal__header">
          <h2>{title}</h2>
          <p>Add your thoughts, observations, or important details here.</p>
        </div>

        <div className="notes-modal__form">
          {onImageUpload && (
            <div className="form-group">
              <label>Image Attachment (Optional)</label>
              <div className="image-upload-section">
                {imageUrl && (
                  <div className="image-preview">
                    <img
                      src={imageUrl}
                      alt="Note attachment"
                      className="image-preview__img"
                    />
                    <button
                      type="button"
                      className="image-preview__remove"
                      onClick={handleRemoveImage}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
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
                      {imageUrl ? "Change Image" : "Add Image"}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="note-content">Note Content</label>
            <textarea
              id="note-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your note here..."
              className="form-textarea"
              autoFocus
              rows={8}
            />
          </div>
        </div>

        <div className="notes-modal__actions">
          <button className="notes-modal__cancel" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="notes-modal__save"
            onClick={handleSave}
            disabled={(!content.trim() && !imageUrl) || isUploading}
          >
            {isUploading ? "Uploading..." : "Save Note"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotesModal;

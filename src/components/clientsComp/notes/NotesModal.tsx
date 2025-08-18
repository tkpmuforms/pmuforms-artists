"use client";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type React from "react";
import "./NotesModal.scss";

interface NotesModalProps {
  onClose: () => void;
  onSave: (content: string) => void;
  initialContent?: string;
  title: string;
}

const NotesModal: React.FC<NotesModalProps> = ({
  onClose,
  onSave,
  initialContent = "",
  title,
}) => {
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleSave = () => {
    if (content.trim()) {
      onSave(content.trim());
      setContent("");
      onClose();
    }
  };

  const handleClose = () => {
    setContent("");
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
            disabled={!content.trim()}
          >
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotesModal;

"use client";

import type React from "react";
import { useState } from "react";
import { X, ChevronLeft } from "lucide-react";
import "./edit-paragraph-modal.scss";

interface EditParagraphModalProps {
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  initialContent?: string; // Optional prop for initial content
}

const EditParagraphModal: React.FC<EditParagraphModalProps> = ({
  onClose,
  onSave,
  onDelete,
  initialContent,
}) => {
  const [content, setContent] = useState(initialContent || "");

  return (
    <div className="edit-paragraph-modal">
      <div className="edit-paragraph-modal__overlay" onClick={onClose} />
      <div className="edit-paragraph-modal__content">
        <div className="edit-paragraph-modal__header">
          <button className="edit-paragraph-modal__back">
            <ChevronLeft size={20} />
          </button>
          <h2>Edit Paragraph</h2>
          <button className="edit-paragraph-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="edit-paragraph-modal__body">
          <textarea
            className="edit-paragraph-modal__textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your paragraph content..."
          />
        </div>

        <div className="edit-paragraph-modal__actions">
          <button className="edit-paragraph-modal__cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="edit-paragraph-modal__save" onClick={onSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditParagraphModal;

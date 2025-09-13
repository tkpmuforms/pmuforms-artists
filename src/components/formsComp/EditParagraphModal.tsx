"use client";

import type React from "react";
import { useState } from "react";
import { X, ChevronLeft } from "lucide-react";
import "./edit-paragraph-modal.scss";

interface EditParagraphModalProps {
  onClose: () => void;
  onSave: (updatedContent: string, isRequired?: boolean) => void;
  initialContent?: string;
  initialRequired?: boolean;
  fieldType?: string;
}

const EditParagraphModal: React.FC<EditParagraphModalProps> = ({
  onClose,
  onSave,
  initialContent,
  initialRequired = false,
}) => {
  const [content, setContent] = useState(initialContent || "");
  const [isRequired] = useState(initialRequired);

  const handleSave = () => {
    onSave(content, isRequired);
    onClose();
  };

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
          <button className="edit-paragraph-modal__save" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditParagraphModal;

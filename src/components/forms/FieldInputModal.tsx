"use client";

import type React from "react";
import { useState } from "react";
import { X } from "lucide-react";
import "./field-input-modal.scss";

interface FieldInputModalProps {
  onClose: () => void;
  onSave: (title: string, isRequired: boolean) => void;
  /** the field is being saved */
  saving?: boolean;
  fieldType: {
    type: string;
    title: string;
  };
}

const FieldInputModal: React.FC<FieldInputModalProps> = ({
  onClose,
  onSave,
  fieldType,
  saving = false,
}) => {
  const [title, setTitle] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const isParagraph = fieldType.type === "paragraph";

  const handleSave = () => {
    if (!title.trim() || saving) {
      return;
    }
    onSave(title.trim(), isParagraph ? false : isRequired);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    }
  };

  return (
    <div className="field-input-modal">
      <div className="field-input-modal__overlay" onClick={onClose} />
      <div className="field-input-modal__content">
        <div className="field-input-modal__header">
          <h3>Add {fieldType.title}</h3>
          <button className="field-input-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="field-input-modal__body">
          <div className="form-group">
            <label htmlFor="field-title">
              {isParagraph ? "Paragraph text" : "Field Title"}
            </label>
            {isParagraph ? (
              <textarea
                id="field-title"
                rows={5}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Text clients read, such as instructions or a statement"
                disabled={saving}
                autoFocus
              />
            ) : (
              <input
                id="field-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Enter ${fieldType.title.toLowerCase()} title...`}
                disabled={saving}
                autoFocus
              />
            )}
          </div>

          {!isParagraph && (
            <div className="form-group">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  disabled={saving}
                />
                <span className="checkmark"></span>
                Required field
              </label>
            </div>
          )}
        </div>

        <div className="field-input-modal__footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!title.trim() || saving}
          >
            {saving ? "Adding…" : "Add Field"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FieldInputModal;

"use client";

import type React from "react";
import { X, FileText, Type, CheckSquare, Hash, Calendar } from "lucide-react";
import "./add-field-modal.scss";

interface AddFieldModalProps {
  onClose: () => void;
}

const AddFieldModal: React.FC<AddFieldModalProps> = ({ onClose }) => {
  const fieldTypes = [
    {
      icon: <FileText />,
      title: "Paragraph Only",
      description: "For texts sections without input",
    },
    {
      icon: <Type />,
      title: "Text Field",
      description: "For inputs like name, occupation etc.",
    },
    {
      icon: <CheckSquare />,
      title: "Checkbox",
      description: "For Yes/No questions",
    },
    {
      icon: <Hash />,
      title: "Number",
      description: "For Numeric input like age",
    },
    {
      icon: <Calendar />,
      title: "Date",
      description: "For Date input like birth date",
    },
  ];

  return (
    <div className="add-field-modal">
      <div className="add-field-modal__overlay" onClick={onClose} />
      <div className="add-field-modal__content">
        <button className="add-field-modal__close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="add-field-modal__grid">
          {fieldTypes.map((field, index) => (
            <button key={index} className="field-type-card" onClick={onClose}>
              <div className="field-type-card__icon">{field.icon}</div>
              <h3 className="field-type-card__title">{field.title}</h3>
              <p className="field-type-card__description">
                {field.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AddFieldModal;

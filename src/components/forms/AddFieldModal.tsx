"use client";
import type React from "react";
import { X } from "lucide-react";
import "./add-field-modal.scss";
import {
  CheckBoxFieldSvg,
  DateFieldSvg,
  NumberFieldSvg,
  ParagraphOnlyFieldSvg,
  TextfieldFieldSvg,
} from "../../assets/svgs/formsSvg";

interface FieldType {
  type: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface AddFieldModalProps {
  onClose: () => void;
  onSelectFieldType: (fieldType: FieldType) => void;
}

const AddFieldModal: React.FC<AddFieldModalProps> = ({
  onClose,
  onSelectFieldType,
}) => {
  const fieldTypes: FieldType[] = [
    {
      type: "paragraph",
      icon: <ParagraphOnlyFieldSvg />,
      title: "Paragraph Only",
      description: "For texts sections without input",
    },
    {
      type: "text",
      icon: <TextfieldFieldSvg />,
      title: "Text Field",
      description: "For inputs like name, occupation e.t.c",
    },
    {
      type: "checkbox",
      icon: <CheckBoxFieldSvg />,
      title: "Checkbox",
      description: "For Yes/No questions",
    },
    {
      type: "numberOfField",
      icon: <NumberFieldSvg />,
      title: "Number",
      description: "For Numeric input like age",
    },
    {
      type: "date",
      icon: <DateFieldSvg />,
      title: "Date",
      description: "For Date input like birth date",
    },
  ];

  const handleFieldTypeSelect = (fieldType: FieldType) => {
    onSelectFieldType(fieldType);
  };

  return (
    <div className="add-field-modal">
      <div className="add-field-modal__overlay" onClick={onClose} />
      <div className="add-field-modal__content">
        <button className="add-field-modal__close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="add-field-modal__grid">
          {fieldTypes.map((field, index) => (
            <button
              key={index}
              className="field-type-card"
              onClick={() => handleFieldTypeSelect(field)}
            >
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

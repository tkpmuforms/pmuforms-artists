"use client";

import type React from "react";
import {
  SmallDeleteIconSvg,
  SmallEditIConSvg,
} from "../../assets/svgs/formsSvg";

const FormInputTypes = {
  TEXT: "text",
  CHECKBOX: "checkbox",
  IMAGE: "image",
  DATE: "date",
  TEXTFIELD: "textfield",
  NUMBER: "numberOfField",
};

interface RenderEditFormsFieldsProps {
  fields: any[];
  onEditField: (field: any) => void;
  onDeleteField: (fieldId: string) => void;
  onAddParagraph: (fieldId: string) => void;
}

const RenderEditFormsFields: React.FC<RenderEditFormsFieldsProps> = ({
  fields,
  onEditField,
  onDeleteField,
  onAddParagraph,
}) => {
  const previewInputStyle = {
    backgroundColor: "#f9f9f9",
    border: "1px solid #ddd",
    cursor: "not-allowed",
    color: "#999",
  };

  const FieldActions = ({ field }: { field: any }) => (
    <div className="field-actions">
      <SmallEditIConSvg
        onClick={() => onEditField(field)}
        className="field-action-icon edit-icon"
        style={{ cursor: "pointer", width: "16px", height: "16px" }}
      />
      <SmallDeleteIconSvg
        onClick={() => onDeleteField(field.id)}
        className="field-action-icon delete-icon"
        style={{ cursor: "pointer", width: "16px", height: "16px" }}
      />
    </div>
  );

  const renderField = (field: any) => {
    if (!field || !field.id) return null;

    const isRequired = field?.required;

    if (!field.type) {
      return (
        <div key={field.id} className="read-only-field field-container">
          <div className="field-header">
            <label>{field.title}</label>
            <FieldActions field={field} />
          </div>
        </div>
      );
    }

    if (field.id === "signature") {
      return (
        <div key={field.id} className="field-container">
          <div className="field-header">
            <label>
              {field.title}
              {isRequired && <span className="required-star">*</span>}
            </label>
            <FieldActions field={field} />
          </div>
          <input
            type="text"
            value=""
            disabled
            style={previewInputStyle}
            placeholder="Signature field"
          />
        </div>
      );
    }

    switch (field.type) {
      case FormInputTypes.CHECKBOX:
        return (
          <div className="checkbox-group field-container" key={field.id}>
            <div className="field-header">
              <label>
                <input
                  type="checkbox"
                  checked={false}
                  disabled
                  style={{ cursor: "not-allowed" }}
                />
                <span>
                  {field.title}
                  {isRequired && <span className="required-star">*</span>}
                </span>
              </label>
              <FieldActions field={field} />
            </div>
          </div>
        );

      case FormInputTypes.DATE:
        return (
          <div key={field.id} className="field-container">
            <div className="field-header">
              <label>
                {field.title}
                {isRequired && <span className="required-star">*</span>}
              </label>
              <FieldActions field={field} />
            </div>
            <input type="date" value="" disabled style={previewInputStyle} />
          </div>
        );

      case FormInputTypes.IMAGE:
        return (
          <div key={field.id} className="field-container">
            <div className="field-header">
              <label>
                {field.title}
                {isRequired && <span className="required-star">*</span>}
              </label>
              <FieldActions field={field} />
            </div>
            <div
              style={{
                padding: "20px",
                backgroundColor: "#f9f9f9",
                border: "1px dashed #ddd",
                borderRadius: "4px",
                textAlign: "center",
                color: "#999",
                marginTop: "10px",
              }}
            >
              Image upload area
            </div>
          </div>
        );

      case FormInputTypes.NUMBER:
        return (
          <div key={field.id} className="field-container">
            <div className="field-header">
              <label>
                {field.title}
                {isRequired && <span className="required-star">*</span>}
              </label>
              <FieldActions field={field} />
            </div>
            <input type="number" value="" disabled style={previewInputStyle} />
          </div>
        );

      case FormInputTypes.TEXTFIELD:
        return (
          <div key={field.id} className="field-container">
            <div className="field-header">
              <label>
                {field.title}
                {isRequired && <span className="required-star">*</span>}
              </label>
              <FieldActions field={field} />
            </div>
            <textarea
              value=""
              disabled
              style={{
                ...previewInputStyle,
                width: "100%",
                minHeight: "100px",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
            <div className="add-paragraph-section">
              <button
                className="add-paragraph-btn"
                onClick={() => onAddParagraph(field.id)}
              >
                + Tap to add question or Paragraph
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div key={field.id} className="field-container">
            <div className="field-header">
              <label>
                {field.title}
                {isRequired && <span className="required-star">*</span>}
              </label>
              <FieldActions field={field} />
            </div>
            <input type="text" value="" disabled style={previewInputStyle} />
          </div>
        );
    }
  };

  return <>{fields.map(renderField)}</>;
};

export default RenderEditFormsFields;

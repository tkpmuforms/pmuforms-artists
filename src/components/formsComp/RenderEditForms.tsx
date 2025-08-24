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
  sectionId: string;
  onEditField: (field: any) => void;
  onDeleteField: (fieldId: string) => void;
  onAddParagraph: (fieldId: string) => void;
}

const RenderEditFormsFields: React.FC<RenderEditFormsFieldsProps> = ({
  fields,
  sectionId,
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
        onClick={() => onEditField({ ...field, sectionId })}
        className="field-action-icon edit-icon"
      />
      <SmallDeleteIconSvg
        onClick={() => onDeleteField({ ...field, sectionId })}
        className="field-action-icon delete-icon"
      />
    </div>
  );

  const AddParagraphSection = ({ fieldId }: { fieldId: string }) => (
    <div className="add-paragraph-section">
      <button
        className="add-paragraph-btn"
        onClick={() => onAddParagraph(fieldId)}
      >
        + Tap to add question or Paragraph
      </button>
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
          <AddParagraphSection fieldId={field.id} />
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
            className="form-input"
            value=""
            disabled
            style={previewInputStyle}
            placeholder="Signature field"
          />
          <AddParagraphSection fieldId={field.id} />
        </div>
      );
    }

    switch (field.type) {
      case FormInputTypes.CHECKBOX:
        return (
          <div className="field-container" key={field.id}>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={false}
                  disabled
                  style={{ cursor: "not-allowed" }}
                />
                <span className="checkbox-text">
                  {field.title}
                  {isRequired && <span className="required-star">*</span>}
                </span>
              </label>
              <FieldActions field={field} />
            </div>
            <AddParagraphSection fieldId={field.id} />
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
            <input
              type="date"
              className="form-input"
              value=""
              disabled
              style={previewInputStyle}
            />
            <AddParagraphSection fieldId={field.id} />
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
            <div className="image-upload-area">Image upload area</div>
            <AddParagraphSection fieldId={field.id} />
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
            <input
              type="number"
              className="form-input"
              value=""
              disabled
              style={previewInputStyle}
            />
            <AddParagraphSection fieldId={field.id} />
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
              className="form-textarea"
              value=""
              disabled
              style={previewInputStyle}
            />
            <AddParagraphSection fieldId={field.id} />
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
            <input
              type="text"
              className="form-input"
              value=""
              disabled
              style={previewInputStyle}
            />
            <AddParagraphSection fieldId={field.id} />
          </div>
        );
    }
  };

  return <>{fields.map(renderField)}</>;
};

export default RenderEditFormsFields;

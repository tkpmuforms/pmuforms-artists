import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

const FormInputTypes = {
  TEXT: "text",
  CHECKBOX: "checkbox",
  IMAGE: "image",
  DATE: "date",
  TEXTFIELD: "textfield",
  NUMBER: "numberOfField",
};

export const renderPreviewFormFields = (fields, formTemplateId, formResponse) =>
  fields.map((field) => {
    if (!field || !field.id) return null;
    const isRequired = field?.required;

    // Common styles for preview mode - disabled appearance
    const previewInputStyle = {
      backgroundColor: "#f9f9f9",
      border: "1px solid #ddd",
      cursor: "not-allowed",
      color: "#999",
    };

    if (!field.type) {
      return (
        <div key={field.id} className="read-only-field">
          <label>{field.title}</label>
        </div>
      );
    }

    if (field.id === "signature") {
      return (
        <div key={field.id}>
          <label>
            {field.title}
            {isRequired && <span className="required-star">*</span>}
            <input
              type="text"
              value=""
              disabled
              style={previewInputStyle}
              placeholder="Signature field"
            />
          </label>
        </div>
      );
    }

    switch (field.type) {
      case FormInputTypes.CHECKBOX:
        return (
          <div className="checkbox-group" key={field.id}>
            <label>
              <input
                type="checkbox"
                checked={false}
                disabled
                style={{ cursor: "not-allowed" }}
              />
              {field.title}
              {isRequired && <span className="required-star">*</span>}
            </label>
          </div>
        );

      case FormInputTypes.DATE:
        return (
          <div key={field.id}>
            <label>
              {field.title}
              {isRequired && <span className="required-star">*</span>}
              <input type="date" value="" disabled style={previewInputStyle} />
            </label>
          </div>
        );

      case FormInputTypes.IMAGE:
        return (
          <div key={field.id}>
            <label>
              {field.title}
              {isRequired && <span className="required-star">*</span>}
            </label>
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
          <div key={field.id}>
            <label>
              {field.title}
              {isRequired && <span className="required-star">*</span>}
              <input
                type="number"
                value=""
                disabled
                style={previewInputStyle}
              />
            </label>
          </div>
        );

      case FormInputTypes.TEXTFIELD:
        return (
          <div key={field.id}>
            <label>
              {field.title}
              {isRequired && <span className="required-star">*</span>}
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
            </label>
          </div>
        );

      default:
        return (
          <div key={field.id}>
            <label>
              {field.title}
              {isRequired && <span className="required-star">*</span>}
              <input type="text" value="" disabled style={previewInputStyle} />
            </label>
          </div>
        );
    }
  });

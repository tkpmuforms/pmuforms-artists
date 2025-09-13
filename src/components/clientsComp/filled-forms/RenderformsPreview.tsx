const FormInputTypes = {
  TEXT: "text",
  CHECKBOX: "checkbox",
  IMAGE: "image",
  DATE: "date",
  TEXTFIELD: "textfield",
  NUMBER: "numberOfField",
};

export const RenderFilledFormFields = ({ fields, filledData }) => {
  const renderFilledFormFields = (fields) => {
    return fields.map((field) => {
      if (!field || !field.id) return null;

      const fieldValue = filledData[field.id];
      const isRequired = field?.required;

      const filledInputStyle = {
        backgroundColor: "#f8f9fa",
        border: "1px solid #e9ecef",
        cursor: "default",
        color: "#495057",
        fontWeight: "500",
      };

      if (!field.type) {
        return (
          <div key={field.id} className="read-only-field">
            <label>{field.title}</label>
          </div>
        );
      }

      if (field.id === "signature" || field.id.includes("sign")) {
        return (
          <div key={field.id}>
            <label>
              {field.title}
              {isRequired && <span className="required-star">*</span>}
              <input
                type="text"
                value={fieldValue || ""}
                readOnly
                style={filledInputStyle}
                placeholder={fieldValue ? "" : "No signature provided"}
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
                  checked={Boolean(fieldValue)}
                  readOnly
                  style={{ cursor: "default" }}
                />
                {field.title}
                {isRequired && <span className="required-star">*</span>}
                {Boolean(fieldValue) && (
                  <span style={{ color: "#28a745", marginLeft: "8px" }}>
                    ✓ Acknowledged
                  </span>
                )}
              </label>
            </div>
          );

        case FormInputTypes.DATE:
          const dateValue = fieldValue
            ? new Date(fieldValue).toLocaleDateString()
            : "";
          return (
            <div key={field.id}>
              <label>
                {field.title}
                {isRequired && <span className="required-star">*</span>}
                <input
                  type="text"
                  value={dateValue}
                  readOnly
                  style={filledInputStyle}
                  placeholder={dateValue ? "" : "No date provided"}
                />
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
                  backgroundColor: fieldValue ? "#e8f5e8" : "#f8f9fa",
                  border: `1px solid ${fieldValue ? "#28a745" : "#e9ecef"}`,
                  borderRadius: "4px",
                  textAlign: "center",
                  color: fieldValue ? "#155724" : "#6c757d",
                  marginTop: "10px",
                }}
              >
                {fieldValue ? (
                  <>
                    <div>✓ Image uploaded</div>
                    {typeof fieldValue === "string" &&
                      fieldValue.startsWith("http") && (
                        <img
                          src={fieldValue}
                          alt="Uploaded content"
                          style={{ maxWidth: "200px", marginTop: "10px" }}
                        />
                      )}
                  </>
                ) : (
                  "No image uploaded"
                )}
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
                  type="text"
                  value={fieldValue || ""}
                  readOnly
                  style={filledInputStyle}
                  placeholder={fieldValue ? "" : "No number provided"}
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
                  value={fieldValue || ""}
                  readOnly
                  style={{
                    ...filledInputStyle,
                    width: "100%",
                    minHeight: "100px",
                    resize: "none",
                    fontFamily: "inherit",
                  }}
                  placeholder={fieldValue ? "" : "No text provided"}
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
                <input
                  type="text"
                  value={fieldValue || ""}
                  readOnly
                  style={filledInputStyle}
                  placeholder={fieldValue ? "" : "No data provided"}
                />
              </label>
            </div>
          );
      }
    });
  };

  return <>{renderFilledFormFields(fields)}</>;
};

export default RenderFilledFormFields;

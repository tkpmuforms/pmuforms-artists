import type React from "react";
import RenderFilledFormFields from "./RenderformsPreview";

export interface FilledFormSection {
  _id?: string;
  id?: string;
  title: string;
  data: unknown[];
  skip?: boolean;
}

export interface FilledFormTemplate {
  id?: string;
  title: string;
  sections?: FilledFormSection[];
}

interface FilledFormViewProps {
  template: FilledFormTemplate;
  filledData: Record<string, unknown>;
  businessName?: string;
  // shown beside the title (e.g. the PDF button on a single form)
  actions?: React.ReactNode;
}

// templates use {{user.businessName}} as a placeholder for the artist's name
const fillBusinessName = (text: string, businessName?: string) =>
  text.replace(
    /\(?\{\{user\.businessName\}\}\)?/g,
    businessName || "Your Business Name",
  );

/** One client form with their answers, as shown on screen and in the PDF. */
const FilledFormView: React.FC<FilledFormViewProps> = ({
  template,
  filledData,
  businessName,
  actions,
}) => {
  const filled = JSON.parse(
    fillBusinessName(JSON.stringify(template), businessName),
  ) as FilledFormTemplate;
  const sections = (filled.sections ?? []).filter((section) => !section.skip);

  return (
    <section className="filled-form">
      <div className="title-actions-row">
        <h2>{filled.title}</h2>
        {actions}
      </div>

      {sections.length > 0 ? (
        sections.map((section, index) => (
          <div key={section._id || section.id || index}>
            <h3>{section.title}</h3>
            {section.data && section.data.length > 0 ? (
              <RenderFilledFormFields
                fields={section.data}
                filledData={filledData}
              />
            ) : (
              <p>No fields in this section</p>
            )}
          </div>
        ))
      ) : (
        <p>No sections found in this form</p>
      )}
    </section>
  );
};

export default FilledFormView;

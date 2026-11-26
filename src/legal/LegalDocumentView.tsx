import type { LegalBlock, LegalDocument } from "./legalContent";
import "./legal-document.scss";

const Blocks: React.FC<{ blocks: LegalBlock[] }> = ({ blocks }) => (
  <>
    {blocks.map((block, i) =>
      typeof block === "string" ? (
        <p key={i}>{block}</p>
      ) : (
        <ul key={i}>
          {block.list.map((item, j) => (
            <li key={j}>{item}</li>
          ))}
        </ul>
      ),
    )}
  </>
);

/** the whole document, every section open, so it reads and prints in full */
const LegalDocumentView: React.FC<{ doc: LegalDocument }> = ({ doc }) => (
  <article className="legal-document">
    <h1>{doc.title}</h1>
    <p className="legal-document__updated">Last updated {doc.updated}</p>
    <Blocks blocks={doc.intro} />
    <nav className="legal-document__toc" aria-label="Contents">
      <ol>
        {doc.sections.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`}>{s.title.replace(/^\d+\.\s*/, "")}</a>
          </li>
        ))}
      </ol>
    </nav>
    {doc.sections.map((s) => (
      <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`}>
        <h2 id={`${s.id}-title`}>{s.title}</h2>
        <Blocks blocks={s.body} />
      </section>
    ))}
  </article>
);

export default LegalDocumentView;

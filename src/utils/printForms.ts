// Inline images as data URLs so they still show once the print window is
// detached from this page; falls back to the original URL.
export const imageToDataUrl = (url: string): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d")?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(url);
      }
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const signatureBlock = (label: string, src: string, caption?: string) => `
  <div class="signature-item">
    <h4>${label}</h4>
    <div class="signature-container">
      <img src="${escapeHtml(src)}" alt="${label}" style="max-width: 300px; max-height: 150px; border-bottom: 1px solid #999; display: block;" />
    </div>
    ${caption ? `<p class="signature-caption">${escapeHtml(caption)}</p>` : ""}
  </div>`;

const PRINT_STYLES = `
  body { font-family: Arial, sans-serif; margin: 20px; }
  h2 { color: #333; margin-bottom: 20px; }
  h3 { color: #444; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 30px; }
  h4 { color: #555; margin: 20px 0 10px 0; font-size: 16px; }
  .preview-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
  .preview-info h5 { color: #FF9500; margin: 0 0 5px 0; }
  .preview-info p { color: #FF9500; margin: 0; font-size: 14px; }
  .view-pdf-button, .preview-header, .no-print { display: none !important; }
  label { display: block; margin-bottom: 15px; font-weight: 500; }
  input, textarea { margin-top: 8px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
  .filled-form + .filled-form { page-break-before: always; break-before: page; }
  .signature-section { margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; page-break-inside: avoid; }
  .id-check-line { margin-top: 16px; font-size: 12px; color: #444; }
  .signatures-container { display: flex; flex-wrap: wrap; gap: 40px; margin-top: 15px; }
  .signature-item { flex: 1; min-width: 250px; }
  .signature-container { margin-top: 10px; }
  .signature-caption { margin: 8px 0 0; font-size: 14px; color: #333; }
  img { max-width: 100%; height: auto; }
  @media print {
    body { margin: 0; }
    .signatures-container { flex-direction: column; gap: 20px; }
  }`;

/**
 * Opens the browser's print dialog (save as PDF) for the given form HTML,
 * with the signatures once at the end. Returns false if pop-ups are blocked.
 */
export const printFormsAsPdf = async (params: {
  title: string;
  contentHtml: string;
  customerSignatureUrl?: string | null;
  artistSignatureUrl?: string | null;
  /**
   * Who did the procedure. The artist signature is the owner's on file (a
   * team member has none of their own yet), so the record names who did it.
   */
  performedBy?: string | null;
  /** e.g. "Driver's license · 18+ · Nov 26, 2026"; never the ID itself */
  idCheck?: string | null;
}): Promise<boolean> => {
  // open before any await so browsers treat it as user-initiated
  const printWindow = window.open("", "_blank");
  if (!printWindow) return false;

  const [customerSignature, artistSignature] = await Promise.all([
    params.customerSignatureUrl
      ? imageToDataUrl(params.customerSignatureUrl)
      : null,
    params.artistSignatureUrl ? imageToDataUrl(params.artistSignatureUrl) : null,
  ]);

  // the artist signs the appointment, so their signature only shows with the client's
  const signatures = customerSignature
    ? `<div class="signature-section"><div class="signatures-container">
        ${signatureBlock("Customer Signature", customerSignature)}
        ${
          artistSignature
            ? signatureBlock(
                "Artist Signature",
                artistSignature,
                params.performedBy ? `Performed by: ${params.performedBy}` : undefined,
              )
            : ""
        }
      </div></div>`
    : "";
  const idCheckLine = params.idCheck
    ? `<p class="id-check-line"><strong>ID checked in person:</strong> ${escapeHtml(params.idCheck)}</p>`
    : "";

  printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <title>${escapeHtml(params.title)}</title>
    <style>${PRINT_STYLES}</style>
  </head>
  <body>
    ${params.contentHtml}
    ${signatures}
    ${idCheckLine}
  </body>
</html>`);
  printWindow.document.close();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 1000);

  return true;
};

// File and review rules shared by the document modals.

export const DOCUMENT_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif";
const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];
const ACCEPTED_EXTENSIONS = /\.(pdf|jpe?g|png|webp|heic|heif)$/i;
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;

/** Why a file can't be uploaded, or null when it can. */
export const fileProblem = (file: File) => {
  const typeOk = file.type
    ? ACCEPTED_TYPES.includes(file.type)
    : ACCEPTED_EXTENSIONS.test(file.name);
  if (!typeOk) return "Choose a PDF or a photo (JPG, PNG, WebP or HEIC).";
  if (file.size > MAX_DOCUMENT_BYTES) return "Documents must be 20 MB or smaller.";
  return null;
};

export type ReviewChoice = "pending-review" | "reviewed" | "verified" | "rejected";

/** What the review form is missing, or null when it can be saved. */
export const reviewProblem = (status: ReviewChoice | "", method: string, notes: string) => {
  if (!status) return "Choose a status.";
  if (status === "verified" && !method.trim()) {
    return "Say how you verified it with the issuer.";
  }
  if (status === "rejected" && !notes.trim()) {
    return "Add a note saying why it was rejected.";
  }
  return null;
};

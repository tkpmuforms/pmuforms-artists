import type { FormType, Service } from "../redux/types";
import axiosInstance from "../utils/axios/axiosSetup";
import { getApiErrorMessage } from "../utils/apiError";

/** what each question is, in the builder */
export type FieldKind =
  | "paragraph"
  | "text"
  | "checkbox"
  | "date"
  | "number"
  | "image"
  | "signature";

export interface BuilderField {
  title: string;
  kind: FieldKind;
  required?: boolean;
  /** recognised field the client app fills in (client-name, date-of-birth…) */
  autofill?: string;
}

export interface BuilderSection {
  title: string;
  clientInformation?: boolean;
  fields: BuilderField[];
}

export interface FormDraft {
  title: string;
  type: FormType;
  sections: BuilderSection[];
}

export interface ScanResult {
  draft: FormDraft;
  notes: string[];
}

/** a form as the API returns it, enough to list and identify it */
export interface ApiForm {
  id: string;
  title: string;
  type: FormType;
  services: number[];
  artistId?: string;
  rootFormTemplateId?: string | null;
  versionNumber?: number;
  updatedAt?: string;
}

// --------------------------------------------------------------- services

export const createCustomService = (name: string) =>
  axiosInstance.post<{ service: Service; services: Service[] }>(
    "/api/services/custom",
    { name },
  );

export const renameCustomService = (serviceId: number, name: string) =>
  axiosInstance.patch<{ service: Service }>(`/api/services/custom/${serviceId}`, {
    name,
  });

export const deleteCustomService = (serviceId: number) =>
  axiosInstance.delete<{ services: Service[] }>(
    `/api/services/custom/${serviceId}`,
  );

// ------------------------------------------------------------------ forms

/** every form a client booking this service gets */
export const getFormsForService = (serviceId: number) =>
  axiosInstance.get<{ forms: ApiForm[] }>(`/api/forms/service/${serviceId}`);

/** the shared PMU Forms library */
export const getFormLibrary = () =>
  axiosInstance.get<{ forms: ApiForm[] }>("/api/forms/root-templates");

export const addServiceToForm = (formId: string, serviceId: number) =>
  axiosInstance.post<{ form: ApiForm }>(
    `/api/forms/${encodeURIComponent(formId)}/services/${serviceId}`,
  );

export const removeServiceFromForm = (formId: string, serviceId: number) =>
  axiosInstance.delete<{ form: ApiForm }>(
    `/api/forms/${encodeURIComponent(formId)}/services/${serviceId}`,
  );

export const createCustomForm = (
  form: FormDraft & { services: number[]; source: "scratch" | "scan" },
) => axiosInstance.post<{ form: ApiForm }>("/api/forms/custom", form);

export const getScanStatus = () =>
  axiosInstance.get<{ enabled: boolean; maxPages: number }>(
    "/api/forms/scan/status",
  );

/** reads photos of a paper form into a draft; nothing is saved */
export const scanPaperForm = (pages: Blob[]) => {
  const body = new FormData();
  pages.forEach((page, index) =>
    body.append("pages", page, `page-${index + 1}.jpg`),
  );
  return axiosInstance.post<ScanResult>("/api/forms/scan", body, {
    headers: { "content-type": "multipart/form-data" },
    timeout: 150_000,
  });
};

/** the message the API sent back, or a fallback */
export const apiMessage = (error: unknown, fallback: string) =>
  getApiErrorMessage(error, fallback);

export const FIELD_KIND_LABELS: Record<FieldKind, string> = {
  text: "Short answer",
  checkbox: "Checkbox (yes / I agree)",
  date: "Date",
  number: "Number",
  signature: "Signature (client types their name)",
  image: "Photo upload",
  paragraph: "Text to read (no answer)",
};

export const BLANK_DRAFT: FormDraft = {
  title: "",
  type: "consent",
  sections: [{ title: "", fields: [{ title: "", kind: "text" }] }],
};

/** the library form a form started from (or itself) */
export const rootOf = (form: Pick<ApiForm, "id" | "rootFormTemplateId">) =>
  form.rootFormTemplateId || form.id;

/** a form the artist built (from scratch or a scan), not from the library */
export const isOwnForm = (form: Pick<ApiForm, "id" | "rootFormTemplateId">) =>
  rootOf(form).startsWith("custom-");

export const FORM_TYPE_LABELS: Record<FormType, string> = {
  consent: "Consent",
  care: "Aftercare",
  "pre-care": "Pre-care",
};

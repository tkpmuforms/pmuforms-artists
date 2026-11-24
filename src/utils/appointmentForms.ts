import type { FilledForm } from "../redux/types";

type Service = { id: number; service: string };

/**
 * The services on this appointment that a form is for. Forms are added for
 * the appointment's services, so this is only empty if the form's services
 * were changed afterwards.
 */
export const formServices = (
  form: Pick<FilledForm, "formTemplate">,
  appointmentServices: Service[] = [],
): string[] => {
  const ids = new Set(form.formTemplate?.services ?? []);
  return appointmentServices
    .filter((s) => ids.has(s.id))
    .map((s) => s.service)
    .filter(Boolean);
};

export const isFormFilled = (status?: string) =>
  status === "completed" || status === "complete" || status === "signed";

/** plain words for a form's status */
export const formStatusLabel = (status?: string) => {
  if (status === "signed") return "Signed";
  if (isFormFilled(status)) return "Filled";
  return "Waiting for client";
};

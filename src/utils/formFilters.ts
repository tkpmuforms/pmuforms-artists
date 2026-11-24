import type { Form, FormType, Service } from "../redux/types";

export type FormSource = "all" | "mine" | "edited" | "library";
export type FormSort = "recent" | "az";
/** a service id, "none" for forms on none of the artist's services, or "" for all */
export type FormServiceFilter = string;

export interface FormFilters {
  search: string;
  service: FormServiceFilter;
  source: FormSource;
}

export const FORM_SOURCES: { value: FormSource; label: string }[] = [
  { value: "all", label: "All forms" },
  { value: "mine", label: "Made by you" },
  { value: "edited", label: "Library forms you edited" },
  { value: "library", label: "Library forms, unchanged" },
];

/** where a form came from */
export const sourceOf = (
  form: Pick<Form, "id" | "rootFormTemplateId" | "versionNumber">,
): Exclude<FormSource, "all"> => {
  const root = form.rootFormTemplateId || form.id;
  if (root.startsWith("custom-")) return "mine";
  return (form.versionNumber ?? 0) > 0 ? "edited" : "library";
};

/** the artist's services a form is used for, in the order the artist has them */
export const servicesOf = (
  form: Pick<Form, "services">,
  artistServices: Pick<Service, "id" | "service">[] = [],
) => {
  const ids = new Set((form.services ?? []).map(Number));
  return artistServices.filter((s) => ids.has(Number(s.id)));
};

export const matchesFilters = (
  form: Form,
  filters: FormFilters,
  artistServices: Pick<Service, "id" | "service">[] = [],
) => {
  const services = servicesOf(form, artistServices);

  const search = filters.search.trim().toLowerCase();
  if (
    search &&
    !form.title?.toLowerCase().includes(search) &&
    !services.some((s) => s.service.toLowerCase().includes(search))
  ) {
    return false;
  }

  if (filters.service === "none" && services.length > 0) return false;
  if (
    filters.service &&
    filters.service !== "none" &&
    !services.some((s) => String(s.id) === filters.service)
  ) {
    return false;
  }

  if (filters.source !== "all" && sourceOf(form) !== filters.source) {
    return false;
  }
  return true;
};

export const sortForms = (forms: Form[], sort: FormSort) =>
  [...forms].sort((a, b) =>
    sort === "az"
      ? (a.title ?? "").localeCompare(b.title ?? "", undefined, {
          sensitivity: "base",
        })
      : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

export const countByType = (forms: Form[]) =>
  forms.reduce<Partial<Record<FormType, number>>>((acc, form) => {
    acc[form.type] = (acc[form.type] ?? 0) + 1;
    return acc;
  }, {});

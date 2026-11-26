import type { ActorRef } from "../redux/types";

/**
 * That the artist looked at the client's ID in person. Never the ID number,
 * date of birth or a photo: our Terms forbid storing those, and this record
 * is what artists use instead.
 */
export type IdCheckType =
  | "drivers_license"
  | "state_id"
  | "passport"
  | "military_id"
  | "other";

export interface IdCheck {
  idType: IdCheckType;
  over18: boolean;
  checkedAt: string;
  checkedBy?: ActorRef;
}

export const ID_TYPE_LABELS: Record<IdCheckType, string> = {
  drivers_license: "Driver's license",
  state_id: "State ID card",
  passport: "Passport",
  military_id: "Military ID",
  other: "Other photo ID",
};

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

/** e.g. "Driver's license · 18+ · Nov 26, 2026 · by Ada" */
export const describeIdCheck = (
  check: IdCheck,
  checkedBy?: string,
): string =>
  [
    ID_TYPE_LABELS[check.idType] ?? "Photo ID",
    check.over18 ? "18+" : "Under 18",
    check.checkedAt ? shortDate(check.checkedAt) : "",
    checkedBy ? `by ${checkedBy}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

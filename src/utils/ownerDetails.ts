/**
 * The owner's own details (name and phone), kept apart from the business's.
 * Saved with PATCH /api/artists/my-profile/update.
 */

export interface OwnerDetails {
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

export type OwnerDetailsErrors = Partial<Record<keyof OwnerDetails, string>>;

export const validateOwnerName = (name: string): string | undefined => {
  const trimmed = name.trim();
  if (!trimmed) return "This field is required";
  if (trimmed.length < 2) return "Name must be at least 2 characters long";
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
    return "Name can only contain letters, spaces, hyphens, and apostrophes";
  }
  return undefined;
};

/** A US number (10 digits, or 11 starting with 1); empty is fine. */
export const validateUSPhone = (phone: string): string | undefined => {
  if (!phone.trim()) return undefined;
  const digits = phone.replace(/\D/g, "");
  const local =
    digits.length === 10
      ? digits
      : digits.length === 11 && digits[0] === "1"
        ? digits.slice(1)
        : null;
  if (!local) return "Please enter a valid USA phone number (10 digits)";
  if (local[0] === "0" || local[0] === "1") return "Invalid area code";
  if (local[3] === "0" || local[3] === "1") return "Invalid phone number format";
  return undefined;
};

export const validateOwnerDetails = (
  details: OwnerDetails,
): OwnerDetailsErrors => {
  const errors: OwnerDetailsErrors = {
    firstName: validateOwnerName(details.firstName),
    lastName: validateOwnerName(details.lastName),
    phoneNumber: validateUSPhone(details.phoneNumber),
  };
  (Object.keys(errors) as (keyof OwnerDetails)[]).forEach((key) => {
    if (!errors[key]) delete errors[key];
  });
  return errors;
};

/** "(555) 123-4567" as they type, for a 10- or 11-digit US number. */
export const formatUSPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === "1") {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
};

/**
 * The API validates with @IsPhoneNumber() and no default region, so it only
 * accepts international format. Returns "" when there is no number.
 */
export const toE164USPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 11 && digits[0] === "1") return `+${digits}`;
  return `+1${digits}`;
};

/** The API's error message(s) as one string, or the fallback. */
export const apiErrorText = (error: unknown, fallback: string): string => {
  // axiosSetup's interceptor rejects with the response body itself
  const err = error as {
    message?: unknown;
    response?: { data?: { message?: unknown } };
  };
  const raw = err?.response?.data?.message ?? err?.message;
  const messages = (Array.isArray(raw) ? raw : [raw]).filter(
    (m): m is string => typeof m === "string" && m.length > 0,
  );
  if (messages.some((m) => /phone/i.test(m))) {
    return "Please enter a valid USA phone number";
  }
  return messages.join(", ") || fallback;
};

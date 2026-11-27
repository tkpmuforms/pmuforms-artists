/**
 * Starter's limits, as the API reports them. Adding a client or booking an
 * appointment can fail with 403
 *   { message, code: "STARTER_CLIENT_LIMIT" | "STARTER_APPOINTMENT_LIMIT",
 *     kind: "clients" | "appointments", limit }
 * and the message is already written for the artist. axiosSetup rejects with
 * the response body, so it's usually the error itself; an axios error (or a
 * mock of one) keeps it under response.data.
 */
export interface PlanLimitError {
  code: "STARTER_CLIENT_LIMIT" | "STARTER_APPOINTMENT_LIMIT";
  kind: "clients" | "appointments";
  message: string;
  limit?: number;
}

const CODES = {
  STARTER_CLIENT_LIMIT: "clients",
  STARTER_APPOINTMENT_LIMIT: "appointments",
} as const;

/** the Starter limit that stopped this, or null for any other error */
export const planLimitFrom = (error: unknown): PlanLimitError | null => {
  const err = error as {
    code?: unknown;
    response?: { data?: unknown };
  } | null;
  const body = (
    err && typeof err.code === "string" && err.code in CODES
      ? err
      : err?.response?.data
  ) as { code?: unknown; kind?: unknown; message?: unknown; limit?: unknown } | null;
  if (!body || typeof body.code !== "string" || !(body.code in CODES)) {
    return null;
  }
  const code = body.code as PlanLimitError["code"];
  const kind = CODES[code];
  const message =
    typeof body.message === "string" && body.message.trim()
      ? body.message
      : kind === "clients"
        ? "You've reached the client limit on the Starter plan. Upgrade to Pro for unlimited clients, or delete a client you no longer need."
        : "You've reached this month's appointment limit on the Starter plan. Upgrade to Pro for unlimited appointments.";
  return {
    code,
    kind,
    message,
    ...(typeof body.limit === "number" ? { limit: body.limit } : {}),
  };
};

/** "2026-12" → "December" */
export const monthName = (month: string) => {
  const [year, number] = month.split("-").map(Number);
  if (!year || !number) return "this month";
  return new Date(year, number - 1, 1).toLocaleString("en-US", {
    month: "long",
  });
};

/** the browser's time zone, so "this month" is the artist's month */
export const browserTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
};

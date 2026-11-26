/**
 * The API's own message, or the fallback. axiosSetup's interceptor rejects
 * with the response body itself ({ message, error, statusCode }), so the
 * message is usually on the error directly; an axios error (or a mock of one)
 * keeps it under response.data. Nest sends a list for validation errors.
 */
export const getApiErrorMessage = (error: unknown, fallback: string) => {
  const err = error as {
    message?: unknown;
    response?: { data?: { message?: unknown } };
  };
  const message = err?.response?.data?.message ?? err?.message;
  if (Array.isArray(message)) {
    const parts = message.filter(
      (m): m is string => typeof m === "string" && m.length > 0,
    );
    if (parts.length) return parts.join(", ");
    return fallback;
  }
  return typeof message === "string" && message.trim() ? message : fallback;
};

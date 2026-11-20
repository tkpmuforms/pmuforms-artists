import toast from "react-hot-toast";
import { createFormLink } from "../services/artistServices";

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  const message = (error as { response?: { data?: { message?: unknown } } })
    ?.response?.data?.message;
  if (Array.isArray(message)) return message.join(", ");
  return typeof message === "string" && message ? message : fallback;
};

/**
 * Generates a fresh form link and opens it in a new tab so the client can
 * fill out their forms on this device. The tab is opened before the request
 * so browsers don't treat it as an unrequested pop-up.
 */
export const startFillingOnThisDevice = async (appointmentId: string) => {
  const tab = window.open("", "_blank");

  try {
    const { data } = await createFormLink(appointmentId);
    if (tab) {
      tab.opener = null;
      tab.location.href = data.url;
    } else {
      window.location.href = data.url;
    }
  } catch (error) {
    tab?.close();
    console.error("Error creating form link:", error);
    toast.error(
      getApiErrorMessage(error, "Could not open the forms. Please try again."),
    );
  }
};

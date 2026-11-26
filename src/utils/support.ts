/** Where artists reach PMU Forms support. */
export const SUPPORT_EMAIL = "contact@pmuforms.com";

/** Copies the support email; false if the browser won't allow it. */
export const copySupportEmail = async (): Promise<boolean> => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      return true;
    }
  } catch {
    // blocked (e.g. not a secure page): fall back below
  }
  try {
    const field = document.createElement("textarea");
    field.value = SUPPORT_EMAIL;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand("copy");
    field.remove();
    return ok;
  } catch {
    return false;
  }
};

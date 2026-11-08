const FIREBASE_TOKEN_PARAM = "pmu_firebase_token";
const RETURN_TO_PARAM = "pmu_return_to";
const DEFAULT_RETURN_TO = "/profile/payment";

export interface MobileAuthHandoff {
  firebaseToken: string;
  returnTo: string;
}

const safeReturnTo = (value: string | null): string => {
  if (value?.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return DEFAULT_RETURN_TO;
};

const consumeMobileAuthHandoff = (): MobileAuthHandoff | null => {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const firebaseToken = params.get(FIREBASE_TOKEN_PARAM);

  if (!firebaseToken) {
    return null;
  }

  const returnTo = safeReturnTo(params.get(RETURN_TO_PARAM));
  params.delete(FIREBASE_TOKEN_PARAM);
  params.delete(RETURN_TO_PARAM);

  const remainingHash = params.toString();
  const cleanUrl = `${returnTo}${remainingHash ? `#${remainingHash}` : ""}`;

  // Remove the bearer token before React or the router renders.
  window.history.replaceState(window.history.state, "", cleanUrl);

  return { firebaseToken, returnTo };
};

// Module initialization runs while the app is bootstrapping, so the token is
// removed from the visible address before the first React render.
export const mobileAuthHandoff = consumeMobileAuthHandoff();

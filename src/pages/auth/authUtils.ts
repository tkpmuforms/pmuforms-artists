import { auth, signInWithPopup } from "../../firebase/firebase";
import { createArtist } from "../../services/artistServices";
import type { AuthProvider, UserCredential, User } from "firebase/auth";

export type OnboardingStep =
  | "businessName"
  | "services"
  | "payment"
  | "completed";

interface Artist {
  businessName?: string;
  services?: unknown[];
  stripeSubscriptionActive?: boolean;
  appStorePurchaseActive?: boolean;
}

export const determineOnboardingStep = (artist: Artist): OnboardingStep => {
  if (artist.businessName === "New Business") {
    return "businessName";
  }

  if (!artist.services || artist.services.length === 0) {
    return "services";
  }

  if (!artist.stripeSubscriptionActive && !artist.appStorePurchaseActive) {
    return "payment";
  }

  return "completed";
};

export const HandleSocialLogin = async (
  provider: AuthProvider,
  navigate: (path: string, options?: { state?: any }) => void,
  handleAuthSuccess: (artist: any, accessToken: string) => void,
  showAlert: (
    type: "error" | "success" | "warning" | "info",
    message: string
  ) => void
) => {
  if (!provider) {
    console.error("Authentication provider is undefined");
    showAlert("error", "Authentication provider is not configured");
    return;
  }

  try {
    const result = await signInWithPopup(auth, provider);
    if (!result) throw new Error("Authentication failed. No result received.");

    const user: User = result.user;
    const userToken = await user.getIdToken();

    localStorage.setItem("userEmail", user.email ?? "");
    localStorage.setItem("userName", user.displayName ?? "");

    const res = await createArtist(userToken);

    localStorage.setItem("userId", res.data?.artist?.id ?? "");
    localStorage.setItem("accessToken", res.data?.access_token ?? "");
    handleAuthSuccess(res?.data?.artist, res.data?.access_token ?? "");

    const artist = res?.data?.artist;
    const onboardingStep = determineOnboardingStep(artist);

    if (res.data.userCreated === true || onboardingStep !== "completed") {
      navigate("/profile", {
        state: {
          newUser: true,
          onboardingStep,
        },
      });
    } else {
      navigate("/dashboard");
    }
  } catch (error: unknown) {
    console.error("Social login error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : (error as any)?.response?.data?.error ||
          "Login failed! Try again later.";

    showAlert("error", errorMessage);
  }
};

export const SignInSuccessWithAuthResult = async (
  authResult: UserCredential,
  navigate: (path: string, options?: { state?: any }) => void,
  handleAuthSuccess: (artist: any, accessToken: string) => void,
  showAlert: (
    type: "error" | "success" | "warning" | "info",
    message: string
  ) => void
) => {
  const user: User = authResult.user;
  const userToken = await user.getIdToken();

  try {
    localStorage.setItem("userEmail", user.email ?? "");
    localStorage.setItem("userName", user.displayName ?? "");

    const res = await createArtist(userToken);

    localStorage.setItem("userId", res.data?.artist?.id ?? "");
    localStorage.setItem("accessToken", res.data?.access_token ?? "");
    handleAuthSuccess(res?.data?.artist, res.data?.access_token ?? "");

    const artist = res?.data?.artist;
    const onboardingStep = determineOnboardingStep(artist);

    if (res.data.userCreated === true || onboardingStep !== "completed") {
      navigate("/profile", {
        state: {
          newUser: true,
          onboardingStep,
        },
      });
    } else {
      navigate("/dashboard");
    }
  } catch (error: unknown) {
    console.error("Error during login callback:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : (error as any)?.response?.data?.error ||
          "Login failed! Try again later.";

    showAlert("error", errorMessage);
  }
};

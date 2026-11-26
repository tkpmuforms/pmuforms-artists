import { auth, signInWithPopup } from "../../firebase/firebase";
import {
  createArtist,
  webSignup,
  sendEmailVerification,
} from "../../services/artistServices";
import { trackSignUp } from "../../utils/analytics";
import { forgetTeamInvite, teamInviteMismatch } from "../../utils/teamInvite";
import type { AuthProvider, UserCredential, User } from "firebase/auth";
import { getApiErrorMessage } from "../../utils/apiError";

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

// the API's message, or Firebase's (an Error), or a fallback
const getErrorMessage = (error: unknown): string =>
  getApiErrorMessage(error, "Login failed! Try again later.");

const isEmailNotVerifiedError = (message: string): boolean =>
  /e-?mail(?: address)?.*\bnot\b.*\bverified\b/i.test(message);

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

    // with a team invite open, another email would start a new business
    const mismatch = teamInviteMismatch(user.email);
    if (mismatch) {
      await auth.signOut();
      showAlert("error", mismatch);
      return;
    }

    localStorage.setItem("userEmail", user.email ?? "");
    localStorage.setItem("userName", user.displayName ?? "");

    const res = await createArtist(userToken, webSignup());

    localStorage.setItem("userId", res.data?.artist?.id ?? "");
    localStorage.setItem("accessToken", res.data?.access_token ?? "");
    handleAuthSuccess(res?.data?.artist, res.data?.access_token ?? "");

    // a team member works in the owner's account, which is already set up
    if (res.data?.teamMember) {
      forgetTeamInvite();
      navigate("/dashboard");
      return;
    }

    const artist = res?.data?.artist;
    const onboardingStep = determineOnboardingStep(artist);

    if (res.data.userCreated === true) {
      trackSignUp(provider.providerId || "social");
    }

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
    const errorMessage = getErrorMessage(error);

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
    // with a team invite open, another email would start a new business
    const mismatch = teamInviteMismatch(user.email);
    if (mismatch) {
      await auth.signOut();
      showAlert("error", mismatch);
      return;
    }

    localStorage.setItem("userEmail", user.email ?? "");
    localStorage.setItem("userName", user.displayName ?? "");

    const res = await createArtist(userToken, webSignup());

    localStorage.setItem("userId", res.data?.artist?.id ?? "");
    localStorage.setItem("accessToken", res.data?.access_token ?? "");
    handleAuthSuccess(res?.data?.artist, res.data?.access_token ?? "");

    // a team member works in the owner's account, which is already set up
    if (res.data?.teamMember) {
      forgetTeamInvite();
      navigate("/dashboard");
      return;
    }

    const artist = res?.data?.artist;
    const onboardingStep = determineOnboardingStep(artist);

    if (res.data.userCreated === true) {
      trackSignUp(authResult.providerId || "password");
    }

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

    const errorMessage = getErrorMessage(error);

    if (isEmailNotVerifiedError(errorMessage)) {
      try {
        await sendEmailVerification(user.uid);
        showAlert(
          "success",
          "Your email is not verified. A new verification link has been sent."
        );
        return;
      } catch (resendError) {
        console.error("Error resending verification email:", resendError);
        showAlert(
          "error",
          "Your email is not verified, and we could not resend the verification link. Please try again."
        );
        return;
      }
    }

    showAlert("error", errorMessage);
  }
};

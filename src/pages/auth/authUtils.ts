import { auth, signInWithPopup } from "../../firebase/firebase";
import { createArtist } from "../../services/artistServices";
import type { AuthProvider, UserCredential, User } from "firebase/auth";

export const HandleSocialLogin = async (
  provider: AuthProvider,
  navigate: (path: string) => void,
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
    const businessUri = localStorage.getItem("businessUri");

    localStorage.setItem("userEmail", user.email ?? "");
    localStorage.setItem("userName", user.displayName ?? "");

    const res = await createArtist(userToken);

    localStorage.setItem("userId", res.data?.artist?.id ?? "");
    localStorage.setItem("accessToken", res.data?.access_token ?? "");
    handleAuthSuccess(res?.data?.artist, res.data?.access_token ?? "");
    console.log(businessUri);
    if (businessUri) {
      navigate(`${businessUri}/dashboard`);
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
  navigate: (path: string) => void,
  handleAuthSuccess: (artist: any, accessToken: string) => void,
  showAlert: (
    type: "error" | "success" | "warning" | "info",
    message: string
  ) => void
) => {
  const user: User = authResult.user;
  const userToken = await user.getIdToken();
  const businessUri = localStorage.getItem("businessUri");

  try {
    localStorage.setItem("userEmail", user.email ?? "");
    localStorage.setItem("userName", user.displayName ?? "");

    const res = await createArtist(userToken);

    localStorage.setItem("userId", res.data?.artist?.id ?? "");
    localStorage.setItem("accessToken", res.data?.access_token ?? "");
    handleAuthSuccess(res?.data?.artist, res.data?.access_token ?? "");

    if (businessUri) {
      navigate(`${businessUri}/dashboard`);
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

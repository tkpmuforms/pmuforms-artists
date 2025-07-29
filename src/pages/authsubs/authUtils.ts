import { auth, signInWithPopup } from "../../firebase/firebase";
import { createArtist } from "../../services/artistServices";
import type { AuthProvider, UserCredential } from "firebase/auth";

export const HandleSocialLogin = async (
  provider: AuthProvider,
  navigate: (path: string) => void,
  handleAuthSuccess: (customer: any, accessToken: string) => void,
  showAlert: (type: string, message: string) => void
) => {
  if (!provider) {
    console.error("Authentication provider is undefined");
    showAlert("error", "Authentication provider is not configured");
    return;
  }

  try {
    const result = await signInWithPopup(auth, provider);
    if (!result) throw new Error("Authentication failed. No result received.");

    const user = result.user;
    const userToken = await user.getIdToken();
    const businessUri = localStorage.getItem("businessUri");

    localStorage.setItem("userEmail", user.email ?? "");
    localStorage.setItem("userName", user.displayName ?? "");

    const res = await createArtist(userToken);

    localStorage.setItem("userId", res.data?.customer?.id ?? "");
    localStorage.setItem("accessToken", res.data?.access_token ?? "");
    handleAuthSuccess(res?.data?.customer, res.data?.access_token ?? "");
    console.log(businessUri);
    if (businessUri) {
      navigate(`${businessUri}/customer/dashboard/`);
    } else {
      navigate("/customer/dashboard");
    }
  } catch (error: any) {
    console.error("Social login error:", error);
    showAlert(
      "error",
      error?.message ||
        error?.response?.data?.error ||
        "Login failed! Try again later."
    );
  }
};
export const SignInSuccessWithAuthResult = async (
  authResult: UserCredential,
  navigate: (path: string) => void,
  handleAuthSuccess: (customer: any, accessToken: string) => void,
  showAlert: (type: string, message: string) => void
) => {
  const user = authResult.user;
  const userToken = await user.getIdToken();
  const businessUri = localStorage.getItem("businessUri");

  try {
    localStorage.setItem("userEmail", user.email ?? "");
    localStorage.setItem("userName", user.displayName ?? "");

    const res = await createArtist(userToken);

    localStorage.setItem("userId", res.data?.customer?.id ?? "");
    localStorage.setItem("accessToken", res.data?.access_token ?? "");
    handleAuthSuccess(res?.data?.customer, res.data?.access_token ?? "");

    if (businessUri) {
      navigate(`${businessUri}/customer/dashboard/`);
    } else {
      navigate("/customer/dashboard");
    }
  } catch (error: any) {
    console.error("Error during login callback:", error);

    showAlert(
      "error",
      error?.message ||
        error?.response?.data?.error ||
        "Login failed! Try again later."
    );
  }
};

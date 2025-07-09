import { useState } from "react";
import { useNavigate } from "react-router-dom";
import EmailStep from "./EmailStep";
import PasswordStep from "./PasswordStep";
import "./signup.scss";

interface SignupPageProps {
  currentStep?: "email" | "password";
  email?: string;
  onEmailSubmit?: (email: string) => void;
  onBack?: () => void;
}

const SignupPage: React.FC<SignupPageProps> = ({
  currentStep: propCurrentStep,
  email: propEmail,
  onEmailSubmit: propOnEmailSubmit,
  onBack: propOnBack,
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<"email" | "password">(
    propCurrentStep || "email"
  );
  const [email, setEmail] = useState<string>(propEmail || "");

  const handleEmailSubmit = (submittedEmail: string) => {
    if (propOnEmailSubmit) {
      // Use the prop function if provided (managed by parent)
      propOnEmailSubmit(submittedEmail);
    } else {
      // Fallback to local state management
      setEmail(submittedEmail);
      setCurrentStep("password");
    }
  };

  const handlePasswordSubmit = async (email: string, password: string) => {
    // const artistId = localStorage.getItem("artistId");
    // if (!artistId) {
    //   console.error("Artist ID is missing");
    //   toast.error("error", "Artist ID is missing");
    //   return;
    // }
    // try {
    //   const userCredential = await createUserWithEmailAndPassword(
    //     auth,
    //     email,
    //     password
    //   );
    //   const user = userCredential.user;
    //   await createCustomer({
    //     accessToken: await user.getIdToken(),
    //     artistId: artistId,
    //   }).then((res) => {
    //     localStorage.setItem("userId", res.data?.customer?.id);
    //     localStorage.setItem("accessToken", res.data?.access_token);
    //     navigate("/dashboard");
    //   });
    // } catch (error) {
    //   console.error("Error creating user:", error);
    //   showAlert("error", error.message);
    // }

    console.log("Signup with:", email, password);
    // Navigate to next step or dashboard
    navigate("/dashboard");
  };

  const handleBack = () => {
    if (propOnBack) {
      // Use the prop function if provided (managed by parent)
      propOnBack();
    } else {
      // Fallback to local state management
      setCurrentStep("email");
    }
  };

  // Use prop values if provided, otherwise fall back to local state
  const activeStep = propCurrentStep || currentStep;
  const activeEmail = propEmail || email;

  if (activeStep === "email") {
    return <EmailStep onEmailSubmit={handleEmailSubmit} />;
  }

  return (
    <PasswordStep
      email={activeEmail}
      onPasswordSubmit={handlePasswordSubmit}
      onBack={handleBack}
    />
  );
};

export default SignupPage;

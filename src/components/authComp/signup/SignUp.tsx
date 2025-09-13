import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import toast from "react-hot-toast";
import { auth } from "../../../firebase/firebase";
import { sendEmailVerification } from "../../../services/artistServices";
import EmailVerificationStep from "../verifyEmail/EmailVerification";
import EmailStep from "./EmailStep";
import PasswordStep from "./PasswordStep";
import "./signup.scss";

type SignupStep = "email" | "password" | "verification";

interface SignupPageProps {
  currentStep?: SignupStep;
  email?: string;
  onEmailSubmit?: (email: string) => void;
  onStepChange?: (step: SignupStep) => void;
  onBack?: () => void;
  onNavigateToLogin?: () => void;
}

interface SignupData {
  email: string;
  password: string;
  verificationCode: string;
  businessName: string;
  selectedServices: string[];
}

const SignupPage: React.FC<SignupPageProps> = ({
  currentStep: propCurrentStep,
  email: propEmail,
  onEmailSubmit: propOnEmailSubmit,
  onStepChange: propOnStepChange,
  onBack: propOnBack,
  onNavigateToLogin,
}) => {
  const [currentStep, setCurrentStep] = useState<SignupStep>(
    propCurrentStep || "email"
  );
  const [signupData, setSignupData] = useState<Partial<SignupData>>({
    email: propEmail || "",
    password: "",
    verificationCode: "",
    businessName: "",
    selectedServices: [],
  });

  const changeStep = (newStep: SignupStep) => {
    if (propOnStepChange) {
      propOnStepChange(newStep);
    } else {
      setCurrentStep(newStep);
    }
  };

  const handleEmailSubmit = (submittedEmail: string) => {
    if (propOnEmailSubmit) {
      propOnEmailSubmit(submittedEmail);
    } else {
      setSignupData((prev) => ({ ...prev, email: submittedEmail }));
      changeStep("password");
    }
  };

  const handlePasswordSubmit = async (email: string, password: string) => {
    try {
      setSignupData((prev) => ({ ...prev, email, password }));

      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;
        localStorage.setItem("user", JSON.stringify(user));

        await sendEmailVerification(user?.uid).then((res) => {
          toast.success("Verification link sent to your email!");
        });
        changeStep("verification");
      } catch (error: any) {
        console.error("Error creating user:", error);
        toast.error(
          error?.message ?? "Failed to create account. Please try again."
        );
      }
    } catch (error) {
      console.error("Error during password submission:", error);
    }
  };

  const handleResendCode = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    sendEmailVerification(user?.uid)
      .then((res) => {
        toast.success("Verification email resent successfully!");
      })
      .catch((error) => {
        console.error("Error resending verification email:", error);
        toast.error("Failed to resend verification email.");
      });
  };

  const handleBack = () => {
    const activeStep = propCurrentStep || currentStep;

    if (activeStep === "verification") {
      if (onNavigateToLogin) {
        onNavigateToLogin();
      }
      return;
    }

    if (propOnBack && activeStep === "password") {
      propOnBack();
      return;
    }

    switch (activeStep) {
      case "password":
        changeStep("email");
        break;

      default:
        changeStep("email");
    }
  };

  const handleVerificationBack = () => {
    if (onNavigateToLogin) {
      onNavigateToLogin();
    }
  };

  const activeStep = propCurrentStep || currentStep;
  const activeEmail = propEmail || signupData.email || "";

  const getProgressPercentage = (step: SignupStep): number => {
    switch (step) {
      case "email":
        return 0;
      case "password":
        return 40;
      case "verification":
        return 80;
      default:
        return 0;
    }
  };

  const shouldShowBackButton = (step: SignupStep): boolean => {
    return step !== "email";
  };

  const shouldShowProgressBar = (step: SignupStep): boolean => {
    return step !== "email";
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case "email":
        return <EmailStep onEmailSubmit={handleEmailSubmit} />;

      case "password":
        return (
          <PasswordStep
            email={activeEmail}
            onPasswordSubmit={handlePasswordSubmit}
          />
        );

      case "verification":
        return (
          <EmailVerificationStep
            email={activeEmail}
            onResendCode={handleResendCode}
            onBack={handleVerificationBack}
          />
        );

      default:
        return <EmailStep onEmailSubmit={handleEmailSubmit} />;
    }
  };

  return (
    <div
      className={`signup-page${
        ["password", "verification", "business", "services"].includes(
          activeStep
        )
          ? " password-step"
          : ""
      }`}
    >
      <div className="signup-container">
        {(shouldShowBackButton(activeStep) ||
          shouldShowProgressBar(activeStep)) && (
          <div className="signup-header-row">
            {shouldShowBackButton(activeStep) && (
              <div className="back-button" onClick={handleBack}>
                <ArrowBackIcon />
              </div>
            )}
            {shouldShowProgressBar(activeStep) && (
              <div className="progress-bar">
                <div className="progress-line">
                  <div
                    className="progress-fill"
                    style={{ width: `${getProgressPercentage(activeStep)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}
        {renderStepContent()}
      </div>
    </div>
  );
};

export default SignupPage;

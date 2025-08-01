import { useState } from "react";
import { useNavigate } from "react-router-dom";
import EmailStep from "./EmailStep";
import PasswordStep from "./PasswordStep";
import "./signup.scss";
import BusinessNameStep from "../business-name/BusinessName";
import EmailVerificationStep from "../verifyEmail/EmailVerification";
import ServicesSelectionStep from "../servicesPage/ServicesSelection";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../firebase/firebase";
import toast from "react-hot-toast";
import { sendEmailVerification } from "../../../services/artistServices";

type SignupStep =
  | "email"
  | "password"
  | "verification"
  | "business"
  | "services";

interface SignupPageProps {
  currentStep?: SignupStep;
  email?: string;
  onEmailSubmit?: (email: string) => void;
  onStepChange?: (step: SignupStep) => void;
  onBack?: () => void;
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
}) => {
  const navigate = useNavigate();
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

        await sendEmailVerification(user?.uid).then((res) => {
          console.log("Verification email sent:", res.data);
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

  const handleVerificationComplete = async (code: string) => {
    try {
      setSignupData((prev) => ({ ...prev, verificationCode: code }));

      console.log("Verifying code:", code);

      changeStep("business");
    } catch (error) {
      console.error("Error during verification:", error);
    }
  };

  const handleBusinessNameSubmit = async (businessName: string) => {
    try {
      setSignupData((prev) => ({ ...prev, businessName }));
      changeStep("services");
    } catch (error) {
      console.error("Error during business name submission:", error);
    }
  };

  const handleServicesSubmit = async (selectedServices: string[]) => {
    try {
      const completeSignupData = {
        ...signupData,
        selectedServices,
      };

      console.log("Complete signup data:", completeSignupData);

      navigate("/dashboard");
    } catch (error) {
      console.error("Error during services submission:", error);
    }
  };

  const handleResendCode = async () => {
    try {
      console.log("Resending verification code to:", signupData.email);
    } catch (error) {
      console.error("Error resending code:", error);
    }
  };

  const handleBack = () => {
    const activeStep = propCurrentStep || currentStep;

    if (propOnBack && activeStep === "password") {
      propOnBack();
      return;
    }

    switch (activeStep) {
      case "password":
        changeStep("email");
        break;
      // Remove the ability to go back from verification to password
      case "business":
        changeStep("verification");
        break;
      case "services":
        changeStep("business");
        break;
      default:
        changeStep("email");
    }
  };

  const activeStep = propCurrentStep || currentStep;
  const activeEmail = propEmail || signupData.email || "";

  // Function to get progress percentage based on current step
  const getProgressPercentage = (step: SignupStep): number => {
    switch (step) {
      case "email":
        return 0;
      case "password":
        return 20;
      case "verification":
        return 40;
      case "business":
        return 60;
      case "services":
        return 80;
      default:
        return 0;
    }
  };

  // Function to determine if back button should be shown
  const shouldShowBackButton = (step: SignupStep): boolean => {
    return step !== "email";
  };

  // Function to determine if progress bar should be shown
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
            onVerificationComplete={handleVerificationComplete}
            onResendCode={handleResendCode}
          />
        );

      case "business":
        return (
          <BusinessNameStep
            onBusinessNameSubmit={handleBusinessNameSubmit}
            initialBusinessName={signupData.businessName}
          />
        );

      case "services":
        return (
          <ServicesSelectionStep
            onServicesSubmit={handleServicesSubmit}
            initialSelectedServices={signupData.selectedServices}
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

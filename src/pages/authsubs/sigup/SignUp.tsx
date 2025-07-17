import { useState } from "react";
import { useNavigate } from "react-router-dom";
import EmailStep from "./EmailStep";
import PasswordStep from "./PasswordStep";
import "./signup.scss";
import BusinessNameStep from "../business-name/BusinessName";
import EmailVerificationStep from "../verifyEmail/EmailVerification";
import ServicesSelectionStep from "../servicesPage/ServicesSelection";

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

      console.log("Sending verification email to:", email);

      changeStep("verification");
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
      case "verification":
        changeStep("password");
        break;
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

  switch (activeStep) {
    case "email":
      return <EmailStep onEmailSubmit={handleEmailSubmit} />;

    case "password":
      return (
        <PasswordStep
          email={activeEmail}
          onPasswordSubmit={handlePasswordSubmit}
          onBack={handleBack}
        />
      );

    case "verification":
      return (
        <EmailVerificationStep
          email={activeEmail}
          onVerificationComplete={handleVerificationComplete}
          onBack={handleBack}
          onResendCode={handleResendCode}
        />
      );

    case "business":
      return (
        <BusinessNameStep
          onBusinessNameSubmit={handleBusinessNameSubmit}
          onBack={handleBack}
          initialBusinessName={signupData.businessName}
        />
      );

    case "services":
      return (
        <ServicesSelectionStep
          onServicesSubmit={handleServicesSubmit}
          onBack={handleBack}
          initialSelectedServices={signupData.selectedServices}
        />
      );

    default:
      return <EmailStep onEmailSubmit={handleEmailSubmit} />;
  }
};

export default SignupPage;

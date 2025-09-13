import React, { useEffect, useState } from "react";
import { EmailVerificationSvg } from "../../../assets/svgs/AuthSvg";
import "./emailVerification.scss";

interface EmailVerificationStepProps {
  email: string;
  onResendCode: () => void;
  onBack: () => void;
}

const EmailVerificationStep: React.FC<EmailVerificationStepProps> = ({
  email,
  onResendCode,
  onBack,
}) => {
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleResendCode = () => {
    if (resendTimer > 0) return;

    onResendCode();
    setResendTimer(60);
  };

  return (
    <div className="email-verification-step">
      <div className="verification-container">
        <div className="email-icon">
          <EmailVerificationSvg />
        </div>

        <h2>Verify your email address</h2>
        <p className="verification-subtext">
          We've sent a verification link to{" "}
          <span className="email-highlight">
            {email}. {""}
          </span>
          Please check your inbox and click the verification link to continue.
        </p>

        <div className="instructions">
          <p className="spam-note">
            Didn't get the email? Check your spam folder or{" "}
            <button
              type="button"
              onClick={handleResendCode}
              className={`resend-link ${resendTimer > 0 ? "disabled" : ""}`}
              disabled={resendTimer > 0}
            >
              {resendTimer > 0
                ? `resend link (${resendTimer}s)`
                : "resend link"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationStep;

import React, { useState, useEffect } from "react";
import "./emailVerification.scss";

interface EmailVerificationStepProps {
  email: string;
  onVerificationComplete: (code: string) => void;
  onBack: () => void;
  onResendCode: () => void;
}

const EmailVerificationStep: React.FC<EmailVerificationStepProps> = ({
  email,
  onVerificationComplete,
  onBack,
  onResendCode,
}) => {
  const [verificationCode, setVerificationCode] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }

    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = verificationCode.join("");

    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onVerificationComplete(code);
    } catch (err) {
      setError("Invalid verification code. Please try again.");
      console.error("Verification error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = () => {
    if (resendTimer > 0) return;

    onResendCode();
    setResendTimer(60); // 60 seconds cooldown
    setVerificationCode(["", "", "", "", "", ""]);
    setError("");

    // Focus first input
    const firstInput = document.getElementById("code-0");
    firstInput?.focus();
  };

  return (
    <div className="email-verification-step">
      <div className="verification-container">
        <div className="progress-bar">
          <div className="progress-line">
            <div className="progress-fill" style={{ width: "40%" }}></div>
          </div>
        </div>

        <h2>Verify your email address</h2>
        <p className="verification-subtext">
          Enter the 6 digits code that was sent to{" "}
          <span className="email-highlight">{email}</span>
        </p>

        <form onSubmit={handleSubmit} className="verification-form">
          <div className="code-inputs">
            {verificationCode.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`code-input ${error ? "error" : ""}`}
                autoComplete="off"
              />
            ))}
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="button"
            onClick={handleResendCode}
            className={`resend-button ${resendTimer > 0 ? "disabled" : ""}`}
            disabled={resendTimer > 0}
          >
            {resendTimer > 0 ? `Resend Code (${resendTimer}s)` : "Resend Code"}
          </button>

          <button
            type="submit"
            className="continue-button"
            disabled={isLoading || verificationCode.join("").length !== 6}
          >
            {isLoading ? "Verifying..." : "Continue"}
          </button>
        </form>

        <button type="button" onClick={onBack} className="back-button">
          ← Back
        </button>
      </div>
    </div>
  );
};

export default EmailVerificationStep;

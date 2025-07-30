import React, { useState } from "react";
import "./businessName.scss";

interface RegistrationSuccess {
  onBusinessNameSubmit: (businessName: string) => void;
  onBack?: () => void;
  initialBusinessName?: string;
}

const RegistrationSuccess: React.FC<RegistrationSuccess> = ({
  onBusinessNameSubmit,
  initialBusinessName = "",
}) => {
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!businessName.trim()) {
      setError("Business name is required");
      return;
    }

    if (businessName.trim().length < 2) {
      setError("Business name must be at least 2 characters long");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      onBusinessNameSubmit(businessName.trim());
    } catch (err) {
      console.error("Error submitting business name:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusinessName(e.target.value);
    if (error) setError("");
  };

  return (
    <div className="business-name-step">
      <div className="business-name-container">
        <h2>Tell us your Business name</h2>
        <p className="business-name-subtext">
          Ensure all spelling is accurate and professional as it will be
          <br />
          the first impression clients have of your form
        </p>

        <form onSubmit={handleSubmit} className="business-name-form">
          <div className="form-group">
            <label htmlFor="businessName">Business Name</label>
            <input
              id="businessName"
              type="text"
              value={businessName}
              onChange={handleInputChange}
              placeholder="Enter your Business Name"
              className={error ? "error" : ""}
              maxLength={100}
              autoComplete="organization"
              autoFocus
            />
            {error && <div className="error-message">{error}</div>}
          </div>

          <button
            type="submit"
            className="continue-button"
            disabled={isLoading || !businessName.trim()}
          >
            {isLoading ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegistrationSuccess;

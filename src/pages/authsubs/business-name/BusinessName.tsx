import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./businessName.scss";

const BusinessNamePage = () => {
  const [businessName, setBusinessName] = useState("");
  const navigate = useNavigate();

  const handleContinue = () => {
    if (businessName.trim()) {
      localStorage.setItem("businessName", businessName);
      navigate("/select-services");
    }
  };

  return (
    <div className="page-container">
      <div className="status-bar">
        <div className="time">9:41</div>
        <div className="icons">
          <div className="signal"></div>
          <div className="wifi"></div>
          <div className="battery"></div>
        </div>
      </div>

      <div className="content">
        <div className="back-button">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 18L9 12L15 6"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="progress-bar">
          <div className="progress-filled"></div>
          <div className="progress-empty"></div>
        </div>

        <h1 className="title">Tell us your Business name</h1>
        <p className="description">
          Ensure all spelling is accurate and professional as it will be the
          first impression clients have of your form
        </p>

        <div className="form-group">
          <label htmlFor="businessName">Business Name</label>
          <input
            type="text"
            id="businessName"
            placeholder="Enter your Business Name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
        </div>

        <button
          className={`continue-button ${businessName.trim() ? "active" : ""}`}
          onClick={handleContinue}
          disabled={!businessName.trim()}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default BusinessNamePage;

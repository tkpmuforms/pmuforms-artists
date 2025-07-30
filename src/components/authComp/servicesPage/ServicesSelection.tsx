import React, { useState } from "react";
import "./servicesSelection.scss";

interface Service {
  id: string;
  name: string;
  category?: string;
}

interface ServicesSelectionStepProps {
  onServicesSubmit: (selectedServices: string[]) => void;
  onBack?: () => void;
  initialSelectedServices?: string[];
}

const ServicesSelectionStep: React.FC<ServicesSelectionStepProps> = ({
  onServicesSubmit,
  initialSelectedServices = [],
}) => {
  // PMU Services based on the image provided
  const services: Service[] = [
    { id: "microblading", name: "Microblading" },
    { id: "lip-shading", name: "Lips Shading" },
    { id: "beauty-marks", name: "Beauty Marks" },
    { id: "tattoo-removal", name: "Tattoo Removal" },
    { id: "lashes", name: "Lashes" },
    { id: "bb-glow", name: "BB Glow" },
    { id: "dry-needling", name: "Dry Needling" },
    { id: "nano-brows", name: "Nano Brows" },
    { id: "lash-lift", name: "Lash Lift" },
    { id: "brow-lamination", name: "Brow Lamination" },
    { id: "areola-reconstruction", name: "Areola Reconstruction" },
    { id: "touch-ups", name: "Touch Ups" },
    { id: "beauty-marks", name: "Beauty Marks" },
    { id: "coverup-work", name: "Coverup Work" },
    { id: "tooth-gems", name: "Tooth Gems" },
    { id: "teeth-whitening", name: "Teeth Whitening" },
    { id: "brows", name: "Brows" },
    { id: "chemical-peel", name: "Chemical Peel" },
    { id: "combo-brows", name: "Combo Brows" },
    { id: "plasma-skin-tightening", name: "Plasma Skin Tightening" },
    { id: "micro-needling", name: "Micro Needling" },
    { id: "henna-brows", name: "Henna Brows" },
    { id: "scalp-micropigmentation", name: "Scalp Micropigmentation" },
  ];

  const [selectedServices, setSelectedServices] = useState<string[]>(
    initialSelectedServices
  );
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices((prev) => {
      if (prev.includes(serviceId)) {
        return prev.filter((id) => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedServices.length === 0) {
      setError("Please select at least one service");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      onServicesSubmit(selectedServices);
    } catch (err) {
      console.error("Error submitting services:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="services-selection-step">
      <div className="services-container">
        <h2>Select your PMU Services</h2>
        <p className="services-subtext">
          Please select the Permanent make up services you offer
        </p>

        <form onSubmit={handleSubmit} className="services-form">
          <div className="services-section">
            <label className="section-label">Select Services</label>
            <div className="services-grid">
              {services.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => handleServiceToggle(service.id)}
                  className={`service-button ${
                    selectedServices.includes(service.id) ? "selected" : ""
                  }`}
                >
                  {service.name}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="selected-count">
            {selectedServices.length} service
            {selectedServices.length !== 1 ? "s" : ""} selected
          </div>

          <button
            type="submit"
            className="continue-button"
            disabled={isLoading || selectedServices.length === 0}
          >
            {isLoading ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ServicesSelectionStep;

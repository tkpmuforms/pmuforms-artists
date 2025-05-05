import { useState } from "react";
import "./servicePage.scss";

interface Service {
  id: string;
  name: string;
}

const SelectServicePage = () => {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const businessName = localStorage.getItem("businessName") || "";

  const services: Service[] = [
    { id: "microblading", name: "Microblading" },
    { id: "lips-shading", name: "Lips Shading" },
    { id: "beauty-marks", name: "Beauty Marks" },
    { id: "tattoo-removal", name: "Tattoo Removal" },
    { id: "areola-reconstruction", name: "Areola Reconstruction" },
    { id: "bb-glow", name: "BB Glow" },
    { id: "dry-needling", name: "Dry Needling" },
    { id: "brow-lamination", name: "Brow Lamination" },
    { id: "coverup-work", name: "Coverup Work" },
    { id: "lash-lift", name: "Lash Lift" },
    { id: "tooth-gums", name: "Tooth Gums" },
    { id: "teeth-whitening", name: "Teeth Whitening" },
    { id: "nano-brows", name: "Nano Brows" },
    { id: "chemical-peel", name: "Chemical Peel" },
    { id: "micro-needling", name: "Micro Needling" },
    { id: "henna-brows", name: "Henna Brows" },
    { id: "combo-brows", name: "Combo Brows" },
    { id: "plasma-skin-tightening", name: "Plasma Skin Tightening" },
    { id: "scalp-micropigmentation", name: "Scalp Micropigmentation" },
    { id: "lashes", name: "Lashes" },
    { id: "touch-ups", name: "Touch Ups" },
    { id: "brows", name: "Brows" },
  ];

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleContinue = () => {
    // Here you would typically save the selected services and navigate to the next page
    console.log("Selected services:", selectedServices);
    alert(
      `Business: ${businessName}\nSelected services: ${selectedServices
        .map((id) => services.find((s) => s.id === id)?.name)
        .join(", ")}`
    );
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

        <h1 className="title">Select your PMU Services</h1>
        <p className="description">
          Please select the Permanent make up services you offer
        </p>

        <div className="services-container">
          <h3>Select Services</h3>
          <div className="services-grid">
            {services.map((service) => (
              <div
                key={service.id}
                className={`service-item ${
                  selectedServices.includes(service.id) ? "selected" : ""
                }`}
                onClick={() => toggleService(service.id)}
              >
                {service.name}
              </div>
            ))}
          </div>
        </div>

        <button
          className={`continue-button ${
            selectedServices.length > 0 ? "active" : ""
          }`}
          onClick={handleContinue}
          disabled={selectedServices.length === 0}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default SelectServicePage;

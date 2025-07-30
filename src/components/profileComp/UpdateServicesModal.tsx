"use client";

import type React from "react";
import { useState } from "react";
import { X } from "lucide-react";
import "./update-services-modal.scss";

interface UpdateServicesModalProps {
  onClose: () => void;
  onGoBack: () => void;
}

const UpdateServicesModal: React.FC<UpdateServicesModalProps> = ({
  onClose,
  onGoBack,
}) => {
  const [selectedServices, setSelectedServices] = useState<string[]>([
    "Tattoo Removal",
    "Nano Brows",
    "Brow Lamination",
    "Teeth Whitening",
    "Henna Brows",
  ]);

  const allServices = [
    "Microblading",
    "Lips Shading",
    "Beauty Marks",
    "Tattoo Removal",
    "Lashes",
    "BB Glow",
    "Dry Needling",
    "Nano Brows",
    "Lash Lift",
    "Brow Lamination",
    "Areola Reconstruction",
    "Touch Ups",
    "Beauty Marks",
    "Coverup Work",
    "Tooth Gums",
    "Teeth Whitening",
    "Brows",
    "Chemical Peel",
    "Combo Brows",
    "Plasma Skin Tightening",
    "Micro Needling",
    "Henna Brows",
    "Scalp Micropigmentation",
  ];

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const handleSave = () => {
    console.log("Selected services:", selectedServices);
    onClose();
  };

  return (
    <div className="update-services-modal">
      <div className="update-services-modal__overlay" onClick={onClose} />
      <div className="update-services-modal__content">
        <button className="update-services-modal__close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="update-services-modal__header">
          <h2>Update your Services</h2>
          <p>Please select the services you'd like to offer.</p>
        </div>

        <div className="update-services-modal__body">
          <h3>Select services</h3>
          <div className="services-grid">
            {allServices.map((service) => (
              <button
                key={service}
                className={`service-tag ${
                  selectedServices.includes(service)
                    ? "service-tag--selected"
                    : ""
                }`}
                onClick={() => toggleService(service)}
              >
                {service}
              </button>
            ))}
          </div>
        </div>

        <div className="update-services-modal__actions">
          <button className="update-services-modal__go-back" onClick={onGoBack}>
            Go Back
          </button>
          <button className="update-services-modal__save" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateServicesModal;

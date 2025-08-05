import React, { useState } from "react";
import { Service } from "../../redux/types";
import "./edit-form-services-modal.scss";

interface EditFormServicesProps {
  isOpen: boolean;
  onClose: () => void;
  allServices: Service[];
  selectedServices: number[];
  onUpdateServices: (selectedIds: number[]) => void;
  loading?: boolean;
}

const EditFormServices: React.FC<EditFormServicesProps> = ({
  isOpen,
  onClose,
  allServices,
  selectedServices,
  onUpdateServices,
  loading = false,
}) => {
  const [tempSelectedServices, setTempSelectedServices] =
    useState<(string | number)[]>(selectedServices);

  if (!isOpen) return null;

  const handleServiceToggle = (serviceId: string | number) => {
    setTempSelectedServices((prev) => {
      if (prev.includes(serviceId)) {
        return prev.filter((id) => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleSave = () => {
    onUpdateServices(tempSelectedServices);
    onClose();
  };

  const handleCancel = () => {
    setTempSelectedServices(selectedServices);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="services-modal">
        <div className="modal-header">
          <h2>Edit Form Services</h2>
          <button className="close-button" onClick={handleCancel}>
            ×
          </button>
        </div>

        <div className="modal-subtitle">
          Please select the Permanent make up services you offer
        </div>

        <div className="modal-content">
          <div className="services-section">
            <h3>Select Services</h3>

            {loading ? (
              <div className="loading-container">
                <p>Loading services...</p>
              </div>
            ) : (
              <div className="services-grid">
                {allServices.map((service) => {
                  const serviceId = service.id || service._id;
                  const isSelected = tempSelectedServices.includes(serviceId);

                  return (
                    <button
                      key={serviceId}
                      className={`service-tag ${isSelected ? "selected" : ""}`}
                      onClick={() => handleServiceToggle(serviceId)}
                    >
                      {service.service}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="continue-btn"
            onClick={handleSave}
            disabled={loading}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditFormServices;

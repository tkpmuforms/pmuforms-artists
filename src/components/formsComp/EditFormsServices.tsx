import React, { useState } from "react";
import { Service } from "../../redux/types";
import "./edit-form-services-modal.scss";

interface EditFormServicesProps {
  isOpen: boolean;
  onClose: () => void;
  allServices: Service[];
  selectedServices: (string | number)[];
  onUpdateServices: (selectedIds: (string | number)[]) => void;
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
          <h3>Update Form Services</h3>
          <button className="close-button" onClick={handleCancel}>
            ×
          </button>
        </div>

        <div className="modal-content">
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
                  <div key={serviceId} className="service-checkbox">
                    <label className={isSelected ? "selected" : ""}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleServiceToggle(serviceId)}
                      />
                      {service.service}
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={handleCancel}>
            Cancel
          </button>
          <button className="save-btn" onClick={handleSave} disabled={loading}>
            Update Services
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditFormServices;

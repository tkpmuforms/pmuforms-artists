import React, { useEffect, useState } from "react";
import "./servicesSelection.scss";
import { Service } from "../../../redux/auth";
import {
  getAuthMe,
  getServices,
  updateServices,
} from "../../../services/artistServices";
import toast from "react-hot-toast";

interface ServicesSelectionStepProps {
  onServicesSubmit: (selectedServices: string[]) => void;
  onBack?: () => void;
  initialSelectedServices?: string[];
}

const ServicesSelectionStep: React.FC<ServicesSelectionStepProps> = ({
  onServicesSubmit,
  initialSelectedServices = [],
}) => {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    getServices()
      .then((response) => {
        console.log("Fetched services:", response.data.services);
        const services: Service[] = response.data.services.map(
          (service: Service) => ({
            _id: service._id,
            id: service.id,
            service: service.service,
          })
        );
        setServices(services);
      })
      .catch((error) => {
        console.error("Error fetching services:", error);
      });
  }, []);

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

  const handleSubmit = () => {
    if (selectedServices.length === 0) {
      setError("Please select at least one service");
      return;
    }
    const serviceIds = selectedServices.map((s) => s.id);
    updateServices({ services: serviceIds })
      .then(() => {
        getAuthUser();
        console.log("Services updated successfully");
        toast.success("Services updated successfully!");
      })
      .catch((error) => {
        console.error("Error updating services:", error);
        toast.error("Failed to update services. Please try again.");
      });
  };

  const getAuthUser = () => {
    getAuthMe()
      .then((response) => {
        // dispatch(setUser(response?.data?.user));
      })
      .catch((error) => {
        console.error("Error fetching auth user:", error);
      });
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
                  onClick={() => handleServiceToggle(String(service.id))}
                  className={`service-button ${
                    selectedServices.includes(String(service.id))
                      ? "selected"
                      : ""
                  }`}
                >
                  {service?.service}
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

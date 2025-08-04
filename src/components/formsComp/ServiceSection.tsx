import React from "react";
import { Service } from "../../redux/types";
import "./services-section.scss";

interface ServicesSectionProps {
  services: (string | number)[];
  allServices: Service[];
  onChangeServices: () => void;
  loading?: boolean;
}

const ServicesSection: React.FC<ServicesSectionProps> = ({
  services,
  allServices,
  onChangeServices,
  loading = false,
}) => {
  const getServicesByIds = (serviceIds: (string | number)[]) => {
    return allServices.filter(
      (service) =>
        serviceIds.includes(service.id) || serviceIds.includes(service._id)
    );
  };

  const selectedServices = getServicesByIds(services);

  return (
    <div className="services-section">
      <div className="services-header">
        <h3>Services This Form Is Used For</h3>
      </div>
      <p className="services-description">
        This form template is linked to the services listed below. You can
        update the services at any time. To hide this template from clients,
        click 'Update Services for Form Template' and remove all services.
      </p>

      {loading ? (
        <p>Loading services...</p>
      ) : (
        <div className="services-list">
          {selectedServices.length > 0 ? (
            selectedServices.map((service) => (
              <div key={service._id || service.id} className="service-item">
                <div className="checkmark">✓</div>
                <span className="service-name">{service.service}</span>
              </div>
            ))
          ) : (
            <p className="no-services-text">
              No services assigned to this form
            </p>
          )}
        </div>
      )}

      <button
        className="change-services-btn"
        onClick={onChangeServices}
        disabled={loading}
      >
        Change Services this Form is Used For
      </button>
    </div>
  );
};

export default ServicesSection;

"use client";

import { Edit } from "lucide-react";
import type React from "react";
import { useState } from "react";
import UpdateServicesModal from "../../components/profileComp/UpdateServicesModal";
import useAuth from "../../context/useAuth";
import { Service } from "../../redux/types";
import "./services-page.scss";

const ServicesPage: React.FC = () => {
  const { user } = useAuth();
  const [showUpdateServices, setShowUpdateServices] = useState(false);
  const registeredServices = user?.services || [];

  return (
    <div className="services-page">
      <div className="services-page__container">
        <div className="services-page__header">
          <p>Manage the services you offer to your clients.</p>
        </div>

        <div className="services-page__content">
          <div className="services-page__section">
            <div className="section-content">
              <label>Registered Services</label>
              {registeredServices.length > 0 ? (
                <div className="services-list">
                  {registeredServices.map((service: Service, index: number) => (
                    <div key={index} className="service-item">
                      <span className="service-bullet">•</span>
                      {service.service}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-services">
                  No services added yet. Click the button below to add your
                  services.
                </div>
              )}
            </div>
            <button
              className="edit-button"
              onClick={() => setShowUpdateServices(true)}
            >
              <Edit size={16} />
              {registeredServices.length > 0 ? "Edit Services" : "Add Services"}
            </button>
          </div>
        </div>
      </div>

      {showUpdateServices && (
        <UpdateServicesModal
          onClose={() => setShowUpdateServices(false)}
          onGoBack={() => setShowUpdateServices(false)}
          noGoBack={true}
        />
      )}
    </div>
  );
};

export default ServicesPage;

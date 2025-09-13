"use client";
import { X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import useAuth from "../../context/useAuth";
import { setUser } from "../../redux/auth";
import {
  getAuthMe,
  getServices,
  updateServices,
} from "../../services/artistServices";
import { LoadingSmall } from "../loading/Loading";
import "./update-services-modal.scss";
import { Service } from "../../redux/types";

interface UpdateServicesModalProps {
  onClose: () => void;
  onGoBack: () => void;
}

const UpdateServicesModal: React.FC<UpdateServicesModalProps> = ({
  onClose,
  onGoBack,
}) => {
  const { user } = useAuth();
  const [selectedServices, setSelectedServices] = useState<Service[]>([
    ...(user?.services || []),
  ]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const dispatch = useDispatch();

  useEffect(() => {
    setLoading(true);
    getServices()
      .then((response) => {
        const services: Service[] = response.data.services.map(
          (service: Service) => ({
            _id: service._id,
            id: service.id,
            service: service.service,
          })
        );
        setSelectedServices((prev) => {
          return services.filter((service) =>
            prev.some(
              (selected) =>
                selected._id === service._id || selected.id === service.id
            )
          );
        });
        setAllServices(services);
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        toast.error("Failed to fetch services. Please try again.");
        console.error("Error fetching services:", error);
      });
  }, []);

  const toggleService = (service: Service) => {
    setSelectedServices((prev) => {
      const isSelected = prev.some((s) => s._id === service._id);
      if (isSelected) {
        return prev.filter((s) => s._id !== service._id);
      } else {
        return [...prev, service];
      }
    });
  };

  const handleSave = () => {
    const serviceIds = selectedServices.map((s) => s.id);
    updateServices({ services: serviceIds })
      .then(() => {
        getAuthUser();
        toast.success("Services updated successfully!");
        onGoBack();
      })
      .catch((error) => {
        console.error("Error updating services:", error);
        toast.error("Failed to update services. Please try again.");
      });
  };

  const getAuthUser = () => {
    getAuthMe()
      .then((response) => {
        dispatch(setUser(response?.data?.user));
      })
      .catch((error) => {
        console.error("Error fetching auth user:", error);
      });
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
          {loading ? (
            <div className="services-loading">
              <LoadingSmall height="300px" />
            </div>
          ) : (
            <div className="services-grid">
              {allServices.map((service) => (
                <button
                  key={service._id}
                  className={`service-tag ${
                    selectedServices.some((s) => s._id === service._id)
                      ? "service-tag--selected"
                      : ""
                  }`}
                  onClick={() => toggleService(service)}
                >
                  {service.service}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="update-services-modal__actions">
          <button className="update-services-modal__go-back" onClick={onGoBack}>
            Go Back
          </button>
          <button
            className="update-services-modal__save"
            onClick={handleSave}
            disabled={loading}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateServicesModal;

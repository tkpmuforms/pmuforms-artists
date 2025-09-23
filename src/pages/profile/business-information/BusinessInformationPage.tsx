"use client";

import type React from "react";
import { Edit } from "lucide-react";
import "./business-information-page.scss";
import useAuth from "../../../context/useAuth";
import { useState } from "react";
import { Service } from "../../../redux/types";
import EditBusinessNameModal from "../../../components/profileComp/EditBusinessNameModal";
import UpdateServicesModal from "../../../components/profileComp/UpdateServicesModal";
import { Avatar } from "@mui/material";
import EditBusinessInformationModal from "../../../components/profileComp/EditBusinessInformationModal";

const BusinessInformationPage: React.FC = () => {
  const [showEditBusinessName, setShowEditBusinessName] = useState(false);
  const [showUpdateServices, setShowUpdateServices] = useState(false);
  const { user } = useAuth();
  const registeredServices = user?.services || [];

  const handleEditBusinessName = () => {
    setShowEditBusinessName(true);
  };

  const handleEditServices = () => {
    setShowUpdateServices(true);
  };

  const handleCloseEditBusinessName = () => {
    setShowEditBusinessName(false);
  };

  const handleSaveBusinessName = () => {
    setShowEditBusinessName(false);
  };

  const handleCloseUpdateServices = () => {
    setShowUpdateServices(false);
  };

  const handleGoBackUpdateServices = () => {
    setShowUpdateServices(false);
  };

  return (
    <div className="business-information-page">
      <div className="business-information-page__container">
        <div className="business-information-page__header">
          <h1>Business Information</h1>
        </div>

        <div className="business-information-page__content">
          <div className="business-information-page__section">
            <div className="section-content">
              <label>Business Name</label>
              <div className="business-name-container">
                <Avatar
                  src={user?.avatarUrl || ""}
                  alt="Profile Avatar"
                  sx={{
                    width: 60,
                    height: 60,
                    backgroundColor: !user?.avatarUrl ? "#8E2D8E1A" : undefined,
                  }}
                >
                  {user?.firstName && user?.lastName
                    ? (user.firstName + user.lastName).slice(0, 2).toUpperCase()
                    : "Logo"}
                </Avatar>
                <div className="business-name">{user?.businessName}</div>
              </div>

              <label>Phone Number</label>
              <div className="business-info">{user?.phoneNumber || "N/A"}</div>

              <label>Address</label>
              <div className="business-info">{user?.address || "N/A"}</div>

              <label>Website</label>
              <div className="business-info">{user?.website || "N/A"}</div>
            </div>
            <button className="edit-button" onClick={handleEditBusinessName}>
              <Edit size={16} />
              Edit Business Info
            </button>
          </div>

          <div className="business-information-page__section">
            <div className="section-content">
              <label>Registered Services</label>
              <div className="services-list">
                {registeredServices.length > 0 ? (
                  registeredServices.map((service: Service, index) => (
                    <div key={index} className="service-item">
                      <span className="service-bullet">•</span>
                      {service.service}
                    </div>
                  ))
                ) : (
                  <div className="no-services">No services registered yet</div>
                )}
              </div>
            </div>
            <button className="edit-button" onClick={handleEditServices}>
              <Edit size={16} />
              {registeredServices.length > 0
                ? "Edit Business Services"
                : "Add Business Services"}
            </button>
          </div>
        </div>
      </div>

      {showEditBusinessName && (
        <EditBusinessInformationModal
          onClose={handleCloseEditBusinessName}
          onSave={handleSaveBusinessName}
        />
      )}
      {showUpdateServices && (
        <UpdateServicesModal
          onClose={handleCloseUpdateServices}
          onGoBack={handleGoBackUpdateServices}
          noGoBack={true}
        />
      )}
    </div>
  );
};

export default BusinessInformationPage;

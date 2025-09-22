"use client";

import type React from "react";
import { useState } from "react";
import { X, Upload } from "lucide-react";
import "./edit-business-name-modal.scss";
import useAuth from "../../context/useAuth";
import toast from "react-hot-toast";
import { getAuthMe, updateBusinessName } from "../../services/artistServices";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/auth";
import { Avatar } from "@mui/material";

interface EditBusinessInformationModalProps {
  onClose: () => void;
  onSave: () => void;
}

const EditBusinessInformationModal: React.FC<
  EditBusinessInformationModalProps
> = ({ onClose, onSave }) => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const [businessName, setBusinessName] = useState(user?.businessName || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [address, setAddress] = useState(user?.address || "");
  const [website, setWebsite] = useState(user?.website || "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState(user?.avatarUrl || "");

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!businessName.trim()) {
      toast.error("Business name cannot be empty");
      return;
    }

    const businessData = {
      businessName: businessName.trim(),
      phoneNumber: phoneNumber.trim(),
      address: address.trim(),
      website: website.trim(),
    };

    updateBusinessName(businessData)
      .then(() => {
        getAuthUser();
        onSave();
        toast.success("Business information updated successfully!");
      })
      .catch((error) => {
        console.error("Error saving business information:", error);
        toast.error("Failed to save business information");
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
    <div className="edit-business-name-modal">
      <div className="edit-business-name-modal__overlay" onClick={onClose} />
      <div className="edit-business-name-modal__content">
        <button className="edit-business-name-modal__close" onClick={onClose}>
          <X size={20} />
        </button>

        <h2>Edit Business Information</h2>

        <div className="edit-business-name-modal__form">
          <div className="logo-upload-section">
            <div className="logo-preview">
              <Avatar
                src={logoPreview}
                alt="Business Logo"
                sx={{
                  width: 80,
                  height: 80,
                  backgroundColor: !logoPreview ? "#8E2D8E1A" : undefined,
                }}
              >
                <Upload size={24} />
              </Avatar>
            </div>
            <div className="logo-upload-text">
              <p>Upload Business Logo</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="logo-input"
                id="logo-upload"
              />
              <label htmlFor="logo-upload" className="upload-label">
                Choose File
              </label>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="businessName">Business Name</label>
              <input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="form-input"
                placeholder="Enter business name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Business Phone Number</label>
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="form-input"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="address">Business Address</label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="form-input"
                placeholder="Enter business address"
              />
            </div>

            <div className="form-group">
              <label htmlFor="website">Business Website (Optional)</label>
              <input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="form-input"
                placeholder="Enter website URL"
              />
            </div>
          </div>
        </div>

        <button className="edit-business-name-modal__save" onClick={handleSave}>
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default EditBusinessInformationModal;

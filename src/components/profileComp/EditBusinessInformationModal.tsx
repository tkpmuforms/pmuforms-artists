"use client";

import { X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import useAuth from "../../context/useAuth";
import { updateBusinessInfo } from "../../services/artistServices";
import { refreshAuthUser } from "../../utils/authUtils";
import "./edit-business-information-modal.scss";

const DEFAULT_BUSINESS_NAME = "New Business";

interface EditBusinessInformationModalProps {
  onClose: () => void;
  onSave: () => void;
}

const EditBusinessInformationModal: React.FC<
  EditBusinessInformationModalProps
> = ({ onClose, onSave }) => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  // "New Business" is the placeholder the API gives new accounts; showing it
  // in the field made the form look complete when it wasn't.
  const [businessName, setBusinessName] = useState(
    user?.businessName === DEFAULT_BUSINESS_NAME ? "" : user?.businessName || ""
  );
  const [phoneNumber, setPhoneNumber] = useState(
    user?.businessPhoneNumber || ""
  );
  const [address, setAddress] = useState(user?.businessAddress || "");
  const [website, setWebsite] = useState(user?.website || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!businessName.trim()) {
      toast.error("Business name cannot be empty");
      return;
    }

    if (businessName.trim() === DEFAULT_BUSINESS_NAME) {
      toast.error("Please enter your own business name");
      return;
    }

    setIsSaving(true);

    const businessData: Parameters<typeof updateBusinessInfo>[0] = {
      businessName: businessName.trim(),
      businessPhoneNumber: phoneNumber.trim(),
      businessAddress: address.trim(),
      website: website.trim(),
    };

    try {
      await updateBusinessInfo(businessData);
      await refreshAuthUser(dispatch);
      toast.success("Business information updated successfully!");
      onSave();
    } catch (error) {
      console.error("Error saving business information:", error);
      let errorMessage = "Failed to update business information";

      const err = error as {
        response?: { data?: { message?: unknown } };
        message?: unknown;
        msg?: unknown;
      };
      // prefer the API's own message over axios' "Request failed with status code 400"
      const messageOrMsg =
        err?.response?.data?.message ?? err?.message ?? err?.msg;
      if (typeof messageOrMsg === "string") {
        errorMessage = messageOrMsg;
      } else if (Array.isArray(messageOrMsg)) {
        errorMessage = messageOrMsg.join(", ");
      }

      toast.error(errorMessage);
      setIsSaving(false);
    }
  };

  return (
    <div className="edit-business-information-modal">
      <div
        className="edit-business-information-modal__overlay"
        onClick={onClose}
      />
      <div className="edit-business-information-modal__content">
        <button
          className="edit-business-information-modal__close"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        <h2>Edit Business Information</h2>

        <div className="edit-business-information-modal__form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="businessName">Business Name</label>
              <input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="form-input"
                placeholder="Business Name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={user?.email || ""}
                className="form-input"
                placeholder="Email"
                disabled
                style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phoneNumber">Business Phone Number</label>
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="form-input"
                placeholder="Business Phone Number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Business Address</label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="form-input"
                placeholder="Business Address"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="website">Business Website</label>
              <input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="form-input"
                placeholder="Business Website"
              />
            </div>
          </div>
        </div>

        <button
          className="edit-business-information-modal__save"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default EditBusinessInformationModal;

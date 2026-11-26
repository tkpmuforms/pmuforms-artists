"use client";

import { X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import useAuth from "../../context/useAuth";
import {
  updateBusinessInfo,
  updateHeardFrom,
} from "../../services/artistServices";
import { HEARD_FROM_OPTIONS, type HeardFrom } from "../../utils/heardFrom";
import { refreshAuthUser } from "../../utils/authUtils";
import "./edit-business-information-modal.scss";

const DEFAULT_BUSINESS_NAME = "New Business";

interface EditBusinessInformationModalProps {
  onClose: () => void;
  onSave: () => void;
  /** onboarding: also ask "How did you hear about PMU Forms?" (optional) */
  askHeardFrom?: boolean;
}

const EditBusinessInformationModal: React.FC<
  EditBusinessInformationModalProps
> = ({ onClose, onSave, askHeardFrom = false }) => {
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
  const [heardFrom, setHeardFrom] = useState<HeardFrom | "">("");
  const [heardFromOther, setHeardFromOther] = useState("");

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
      // optional, and never holds up onboarding: a failure is only logged
      if (askHeardFrom && heardFrom) {
        updateHeardFrom({
          heardFrom,
          ...(heardFrom === "other" && heardFromOther.trim()
            ? { heardFromOther: heardFromOther.trim() }
            : {}),
        }).catch((error) =>
          console.error("Error saving how they heard about us:", error),
        );
      }
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

          {askHeardFrom && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="heardFrom">
                  How did you hear about PMU Forms? (optional)
                </label>
                <select
                  id="heardFrom"
                  value={heardFrom}
                  onChange={(e) => setHeardFrom(e.target.value as HeardFrom)}
                  className="form-input"
                >
                  <option value="">Choose one</option>
                  {HEARD_FROM_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {heardFrom === "other" && (
                  <input
                    id="heardFromOther"
                    type="text"
                    aria-label="Where did you hear about us?"
                    value={heardFromOther}
                    onChange={(e) => setHeardFromOther(e.target.value)}
                    className="form-input heard-from-other"
                    placeholder="Where did you hear about us?"
                    maxLength={100}
                  />
                )}
              </div>
            </div>
          )}
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

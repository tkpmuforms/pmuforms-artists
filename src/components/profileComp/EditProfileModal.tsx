"use client";

import { Avatar, CircularProgress } from "@mui/material";
import { X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import useAuth from "../../context/useAuth";
import { getMyProfile, updateMyProfile } from "../../services/artistServices";
import "./edit-profile-modal.scss";

interface EditProfileModalProps {
  onClose: () => void;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
}

const PROFILE_CACHE_KEY = "user_profile_cache";
const CACHE_EXPIRY_TIME = 30 * 60 * 1000;

const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phoneNumber: user?.phoneNumber || "",
    email: user?.email || "",
  });
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );

  // Utility functions for localStorage
  const getCachedProfile = () => {
    try {
      const cached = localStorage.getItem(PROFILE_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();

        // Check if cache is still valid (within 30 minutes)
        if (now - timestamp < CACHE_EXPIRY_TIME) {
          return data;
        } else {
          // Remove expired cache
          localStorage.removeItem(PROFILE_CACHE_KEY);
        }
      }
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      localStorage.removeItem(PROFILE_CACHE_KEY);
    }
    return null;
  };

  const setCachedProfile = (data: any) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error("Error writing to localStorage:", error);
    }
  };

  const clearProfileCache = () => {
    try {
      localStorage.removeItem(PROFILE_CACHE_KEY);
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
  };

  // Validation functions
  const validateName = (name: string): string | undefined => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return "This field is required";
    }
    if (trimmedName.length < 2) {
      return "Name must be at least 2 characters long";
    }
    if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
      return "Name can only contain letters, spaces, hyphens, and apostrophes";
    }
    return undefined;
  };

  const validateUSAPhone = (phone: string): string | undefined => {
    if (!phone.trim()) {
      return undefined; // Phone is optional
    }

    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, "");

    // USA phone number validation
    if (digits.length === 10) {
      // Format: 1234567890
      const areaCode = digits.substring(0, 3);
      const exchange = digits.substring(3, 6);

      // Area code cannot start with 0 or 1
      if (areaCode[0] === "0" || areaCode[0] === "1") {
        return "Invalid area code";
      }

      // Exchange cannot start with 0 or 1
      if (exchange[0] === "0" || exchange[0] === "1") {
        return "Invalid phone number format";
      }

      return undefined;
    } else if (digits.length === 11 && digits[0] === "1") {
      // Format: 11234567890 (with country code)
      const areaCode = digits.substring(1, 4);
      const exchange = digits.substring(4, 7);

      if (areaCode[0] === "0" || areaCode[0] === "1") {
        return "Invalid area code";
      }

      if (exchange[0] === "0" || exchange[0] === "1") {
        return "Invalid phone number format";
      }

      return undefined;
    }

    return "Please enter a valid USA phone number (10 digits)";
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return undefined; // Email is optional
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return "Please enter a valid email address";
    }

    return undefined;
  };

  const validateForm = (data: ProfileData): ValidationErrors => {
    const errors: ValidationErrors = {};

    errors.firstName = validateName(data.firstName);
    errors.lastName = validateName(data.lastName);
    errors.phoneNumber = validateUSAPhone(data.phoneNumber);
    errors.email = validateEmail(data.email);

    // Remove undefined errors
    Object.keys(errors).forEach((key) => {
      if (!errors[key as keyof ValidationErrors]) {
        delete errors[key as keyof ValidationErrors];
      }
    });

    return errors;
  };

  // Format phone number for display
  const formatPhoneNumber = (phone: string): string => {
    const digits = phone.replace(/\D/g, "");

    if (digits.length === 10) {
      return `(${digits.substring(0, 3)}) ${digits.substring(
        3,
        6
      )}-${digits.substring(6)}`;
    } else if (digits.length === 11 && digits[0] === "1") {
      return `+1 (${digits.substring(1, 4)}) ${digits.substring(
        4,
        7
      )}-${digits.substring(7)}`;
    }

    return phone;
  };

  // Fetch current profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      // First, try to get cached profile
      const cachedProfile = getCachedProfile();

      if (cachedProfile) {
        setProfileData({
          firstName: cachedProfile.profile.firstName || user?.firstName || "",
          lastName: cachedProfile.profile.lastName || user?.lastName || "",
          phoneNumber: cachedProfile.profile.phone || user?.phoneNumber || "",
          email: cachedProfile.profile.email || user?.email || "",
        });

        if (cachedProfile.avatarUrl) {
          setAvatarUrl(cachedProfile.avatarUrl);
        }
        return;
      }

      // If no cache, fetch from API
      try {
        setIsLoading(true);
        setError(null);

        const response = await getMyProfile();

        const newProfileData = {
          firstName: response.data?.profile.firstName || user?.firstName || "",
          lastName: response.data?.profile.lastName || user?.lastName || "",
          phoneNumber: response.data?.profile.phone || user?.phoneNumber || "",
          email: response.data?.profile.email || user?.email || "",
        };

        setProfileData(newProfileData);

        // Update avatar if available
        if (response.data?.avatarUrl) {
          setAvatarUrl(response.data.avatarUrl);
        }

        // Cache the response
        setCachedProfile(response.data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadingAvatar(true);

      // Create a preview URL for the selected image
      const previewUrl = URL.createObjectURL(file);
      setAvatarUrl(previewUrl);

      setTimeout(() => {
        setUploadingAvatar(false);
      }, 2000); // Simulate upload delay
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    let processedValue = value;

    // Format phone number as user types
    if (field === "phoneNumber") {
      processedValue = formatPhoneNumber(value);
    }

    setProfileData((prev) => ({ ...prev, [field]: processedValue }));

    // Clear general error when user starts typing
    if (error) setError(null);

    // Clear specific field validation error
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Validate form
      const errors = validateForm(profileData);

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }

      // Prepare data for API call
      const updateData = {
        firstName: profileData.firstName.trim(),
        lastName: profileData.lastName.trim(),
        email: profileData.email.trim(),
        phoneNumber: profileData.phoneNumber.replace(/\D/g, ""), // Send only digits
      };

      // Remove empty optional fields
      if (!updateData.email) {
        const { email, ...rest } = updateData;
        updateData = rest;
      }
      if (!updateData.phoneNumber) {
        const { phoneNumber, ...rest } = updateData;
        updateData = rest;
      }

      await updateMyProfile(updateData);

      // Clear cache after successful update so fresh data is fetched next time
      clearProfileCache();

      onClose();
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update profile. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = () => {
    const errors = validateForm(profileData);
    return (
      Object.keys(errors).length === 0 &&
      profileData.firstName.trim().length >= 2 &&
      profileData.lastName.trim().length >= 2
    );
  };

  if (isLoading) {
    return (
      <div className="edit-profile-modal">
        <div className="edit-profile-modal__overlay" onClick={onClose} />
        <div className="edit-profile-modal__content">
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "200px",
            }}
          >
            <CircularProgress size={40} sx={{ color: "#8e2d8e" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-profile-modal">
      <div className="edit-profile-modal__overlay" onClick={onClose} />
      <div className="edit-profile-modal__content">
        <button
          className="edit-profile-modal__close"
          onClick={onClose}
          disabled={isSaving}
        >
          <X size={20} />
        </button>

        <div className="edit-profile-modal__header">
          <h2>Edit Your Profile</h2>
          <p>Enhance your profile information</p>
        </div>

        {error && (
          <div
            className="edit-profile-modal__error"
            style={{
              backgroundColor: "#fee",
              border: "1px solid #fcc",
              borderRadius: "4px",
              padding: "12px",
              marginBottom: "20px",
              color: "#c33",
            }}
          >
            {error}
          </div>
        )}

        <div className="edit-profile-modal__avatar">
          <div className="avatar-section">
            <label
              htmlFor="avatar-upload"
              style={{ cursor: "pointer", position: "relative" }}
            >
              {uploadingAvatar ? (
                <div
                  style={{
                    position: "relative",
                    width: 100,
                    height: 100,
                  }}
                >
                  <Avatar
                    src={avatarUrl || ""}
                    alt="Profile Avatar"
                    sx={{ width: 100, height: 100, opacity: 0.5 }}
                  >
                    {user?.displayName
                      ? user.displayName.slice(0, 2).toUpperCase()
                      : (profileData.firstName + profileData.lastName)
                          .slice(0, 2)
                          .toUpperCase()}
                  </Avatar>
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <CircularProgress size={40} sx={{ color: "#8e2d8e" }} />
                  </div>
                </div>
              ) : (
                <Avatar
                  src={avatarUrl || ""}
                  alt="Profile Avatar"
                  sx={{ width: 100, height: 100 }}
                >
                  {user?.displayName
                    ? user.displayName.slice(0, 2).toUpperCase()
                    : (profileData.firstName + profileData.lastName)
                        .slice(0, 2)
                        .toUpperCase()}
                </Avatar>
              )}
            </label>
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: "none" }}
              disabled={uploadingAvatar || isSaving}
            />
          </div>
        </div>

        <div className="edit-profile-modal__form">
          <div className="form-group">
            <label htmlFor="firstName">First Name *</label>
            <input
              id="firstName"
              type="text"
              value={profileData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              className={`form-input ${
                validationErrors.firstName ? "error" : ""
              }`}
              required
              disabled={isSaving}
              style={{
                borderColor: validationErrors.firstName ? "#f56565" : undefined,
              }}
            />
            {validationErrors.firstName && (
              <div
                style={{ color: "#f56565", fontSize: "12px", marginTop: "4px" }}
              >
                {validationErrors.firstName}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Last Name *</label>
            <input
              id="lastName"
              type="text"
              value={profileData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              className={`form-input ${
                validationErrors.lastName ? "error" : ""
              }`}
              required
              disabled={isSaving}
              style={{
                borderColor: validationErrors.lastName ? "#f56565" : undefined,
              }}
            />
            {validationErrors.lastName && (
              <div
                style={{ color: "#f56565", fontSize: "12px", marginTop: "4px" }}
              >
                {validationErrors.lastName}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={profileData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={`form-input ${validationErrors.email ? "error" : ""}`}
              disabled={isSaving}
              style={{
                borderColor: validationErrors.email ? "#f56565" : undefined,
              }}
            />
            {validationErrors.email && (
              <div
                style={{ color: "#f56565", fontSize: "12px", marginTop: "4px" }}
              >
                {validationErrors.email}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number (USA)</label>
            <input
              id="phoneNumber"
              type="tel"
              value={profileData.phoneNumber}
              onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
              className={`form-input ${
                validationErrors.phoneNumber ? "error" : ""
              }`}
              disabled={isSaving}
              placeholder="(123) 456-7890"
              style={{
                borderColor: validationErrors.phoneNumber
                  ? "#f56565"
                  : undefined,
              }}
            />
            {validationErrors.phoneNumber && (
              <div
                style={{ color: "#f56565", fontSize: "12px", marginTop: "4px" }}
              >
                {validationErrors.phoneNumber}
              </div>
            )}
          </div>
        </div>

        <button
          className="edit-profile-modal__save"
          onClick={handleSaveProfile}
          disabled={!isFormValid() || isSaving}
          style={{
            opacity: !isFormValid() || isSaving ? 0.6 : 1,
            cursor: !isFormValid() || isSaving ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {isSaving && <CircularProgress size={16} sx={{ color: "white" }} />}
          {isSaving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
};

export default EditProfileModal;

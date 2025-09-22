"use client";

import { Avatar, CircularProgress } from "@mui/material";
import { Camera, ArrowLeft, Edit3 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import "./edit-profile-page.scss";
import useAuth from "../../../context/useAuth";
import {
  getAuthMe,
  getMyProfile,
  updateMyProfile,
  updateMySignature,
} from "../../../services/artistServices";
import SignatureModal from "../../../components/clientsComp/signature/SignatureModal";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../../../firebase/firebase";
import { useDispatch } from "react-redux";
import { setUser } from "../../../redux/auth";

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

const EditProfilePage: React.FC = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
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
  const [showSignModal, setShowSignModal] = useState(false);

  const getCachedProfile = () => {
    try {
      const cached = localStorage.getItem(PROFILE_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();

        if (now - timestamp < CACHE_EXPIRY_TIME) {
          return data;
        } else {
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
      return undefined;
    }

    const digits = phone.replace(/\D/g, "");

    if (digits.length === 10) {
      const areaCode = digits.substring(0, 3);
      const exchange = digits.substring(3, 6);

      if (areaCode[0] === "0" || areaCode[0] === "1") {
        return "Invalid area code";
      }

      if (exchange[0] === "0" || exchange[0] === "1") {
        return "Invalid phone number format";
      }

      return undefined;
    } else if (digits.length === 11 && digits[0] === "1") {
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
      return undefined;
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

    Object.keys(errors).forEach((key) => {
      if (!errors[key as keyof ValidationErrors]) {
        delete errors[key as keyof ValidationErrors];
      }
    });

    return errors;
  };

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

  useEffect(() => {
    const fetchProfile = async () => {
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

        if (response.data?.avatarUrl) {
          setAvatarUrl(response.data.avatarUrl);
        }

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

      const previewUrl = URL.createObjectURL(file);
      setAvatarUrl(previewUrl);

      setTimeout(() => {
        setUploadingAvatar(false);
      }, 2000);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    let processedValue = value;

    if (field === "phoneNumber") {
      processedValue = formatPhoneNumber(value);
    }

    setProfileData((prev) => ({ ...prev, [field]: processedValue }));

    if (error) setError(null);

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

      const errors = validateForm(profileData);

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }

      let updateData: any = {
        firstName: profileData.firstName.trim(),
        lastName: profileData.lastName.trim(),
        email: profileData.email.trim(),
        phoneNumber: profileData.phoneNumber.replace(/\D/g, ""),
      };

      if (!updateData.email) {
        const { email, ...rest } = updateData;
        updateData = rest;
      }
      if (!updateData.phoneNumber) {
        const { phoneNumber, ...rest } = updateData;
        updateData = rest;
      }

      await updateMyProfile(updateData);

      clearProfileCache();
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

  const handleSignatureSubmit = async (signatureDataUrl: string) => {
    try {
      const response = await fetch(signatureDataUrl);
      const blob = await response.blob();

      const timestamp = Date.now();
      const fileName = `signature_${user?._id}_${timestamp}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      const options = {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 500,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      const storageRef = ref(storage, `signatures/artists/${user?._id}`);
      const snapshot = await uploadBytes(storageRef, compressedFile);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      await updateMySignature({ signature_url: downloadUrl });
      getAuthUser();
      setShowSignModal(false);
      toast.success("Signature updated successfully");
    } catch (error) {
      console.error("Failed to update signature:", error);
      toast.error("Failed to update signature. Please try again.");
    }
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
      <div className="edit-profile-page">
        <div className="edit-profile-page__container">
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
    <div className="edit-profile-page">
      <div className="edit-profile-page__container">
        <div className="edit-profile-page__header">
          <h1>Edit Your Profile</h1>
          <button
            className="signature-btn"
            onClick={() => setShowSignModal(true)}
          >
            <Edit3 size={16} />
            Add Signature
          </button>
        </div>

        {error && (
          <div
            className="edit-profile-page__error"
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

        <div className="edit-profile-page__avatar">
          <div className="avatar-section">
            <label htmlFor="avatar-upload" className="avatar-upload-label">
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
                    sx={{
                      width: 100,
                      height: 100,
                      opacity: 0.5,
                      backgroundColor: !avatarUrl ? "#8E2D8E1A" : undefined,
                    }}
                  >
                    {user?.firstName && user?.lastName
                      ? (user.firstName + user.lastName)
                          .slice(0, 2)
                          .toUpperCase()
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
                <div className="avatar-container">
                  <Avatar
                    src={avatarUrl || ""}
                    alt="Profile Avatar"
                    sx={{
                      width: 100,
                      height: 100,
                      backgroundColor: !avatarUrl ? "#8E2D8E1A" : undefined,
                    }}
                  >
                    {user?.businessName
                      ? user.businessName.slice(0, 2).toUpperCase()
                      : (profileData.firstName + profileData.lastName)
                          .slice(0, 2)
                          .toUpperCase()}
                  </Avatar>
                  <div className="camera-icon">
                    <Camera size={16} />
                  </div>
                </div>
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
            <p className="upload-hint">Click to upload photo</p>
          </div>
        </div>

        <div className="edit-profile-page__form">
          <div className="form-row">
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
                  borderColor: validationErrors.firstName
                    ? "#f56565"
                    : undefined,
                }}
              />
              {validationErrors.firstName && (
                <div
                  style={{
                    color: "#f56565",
                    fontSize: "12px",
                    marginTop: "4px",
                  }}
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
                  borderColor: validationErrors.lastName
                    ? "#f56565"
                    : undefined,
                }}
              />
              {validationErrors.lastName && (
                <div
                  style={{
                    color: "#f56565",
                    fontSize: "12px",
                    marginTop: "4px",
                  }}
                >
                  {validationErrors.lastName}
                </div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number (USA)</label>
              <input
                id="phoneNumber"
                type="tel"
                value={profileData.phoneNumber}
                onChange={(e) =>
                  handleInputChange("phoneNumber", e.target.value)
                }
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
                  style={{
                    color: "#f56565",
                    fontSize: "12px",
                    marginTop: "4px",
                  }}
                >
                  {validationErrors.phoneNumber}
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
                className={`form-input ${
                  validationErrors.email ? "error" : ""
                }`}
                disabled={isSaving}
                style={{
                  borderColor: validationErrors.email ? "#f56565" : undefined,
                }}
              />
              {validationErrors.email && (
                <div
                  style={{
                    color: "#f56565",
                    fontSize: "12px",
                    marginTop: "4px",
                  }}
                >
                  {validationErrors.email}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="edit-profile-page__save-container">
          <button
            className="edit-profile-page__save"
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
      {showSignModal && (
        <SignatureModal
          onClose={() => setShowSignModal(false)}
          onSubmit={handleSignatureSubmit}
          title="Add Your Signature"
          existingSignature={user?.signature_url}
        />
      )}
    </div>
  );
};

export default EditProfilePage;

"use client";

import imageCompression from "browser-image-compression";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Edit, Edit3 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import SignatureModal from "../../../components/clientsComp/signature/SignatureModal";
import EditBusinessInformationModal from "../../../components/profileComp/EditBusinessInformationModal";
import EditOwnerDetailsModal from "../../../components/profileComp/EditOwnerDetailsModal";
import UpdateServicesModal from "../../../components/profileComp/UpdateServicesModal";
import useAuth from "../../../context/useAuth";
import { storage } from "../../../firebase/firebase";
import { Service } from "../../../redux/types";
import {
  getMyProfile,
  updateMySignature,
} from "../../../services/artistServices";
import { refreshAuthUser } from "../../../utils/authUtils";
import { formatUSPhone, type OwnerDetails } from "../../../utils/ownerDetails";
import "./business-information-page.scss";

/** The business's details, the owner's own details, and the services offered. */
const BusinessInformationPage: React.FC = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const [showEditBusiness, setShowEditBusiness] = useState(false);
  const [showEditOwner, setShowEditOwner] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [showUpdateServices, setShowUpdateServices] = useState(false);
  // the owner's name and phone live on their profile, apart from the business
  const [owner, setOwner] = useState<OwnerDetails | null>(null);
  const registeredServices = user?.services || [];
  const hasSignature = Boolean(user?.signature_url);

  useEffect(() => {
    getMyProfile()
      .then((response) => {
        const profile = response.data?.profile ?? {};
        setOwner({
          firstName: profile.firstName || user?.firstName || "",
          lastName: profile.lastName || user?.lastName || "",
          phoneNumber: profile.phoneNumber || user?.phoneNumber || "",
        });
      })
      .catch(() =>
        // still show (and let them edit) what we know
        setOwner({
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          phoneNumber: user?.phoneNumber || "",
        }),
      );
    // the profile only needs loading once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ownerName = [owner?.firstName, owner?.lastName]
    .filter(Boolean)
    .join(" ");

  const saveSignature = async (signatureDataUrl: string) => {
    try {
      const blob = await (await fetch(signatureDataUrl)).blob();
      const file = new File([blob], `signature_${user?._id}_${Date.now()}.png`, {
        type: "image/png",
      });
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 500,
        useWebWorker: true,
      });
      const snapshot = await uploadBytes(
        ref(storage, `signatures/artists/${user?._id}`),
        compressed,
      );
      await updateMySignature({
        signature_url: await getDownloadURL(snapshot.ref),
      });
      await refreshAuthUser(dispatch);
      setShowSignature(false);
      toast.success("Signature saved");
    } catch (error) {
      console.error("Failed to update signature:", error);
      toast.error("Couldn't save your signature. Please try again.");
    }
  };

  return (
    <div className="business-information-page">
      <div className="business-information-page__container">
        <div className="business-information-page__header">
          <h1>Business Information</h1>
          <p>Your business, you as its owner, and the services you offer.</p>
        </div>

        <div className="business-information-page__content">
          <section
            className="business-information-page__section"
            aria-label="Business details"
          >
            <div className="section-content">
              <label>Business Name</label>
              <div className="business-name-container">
                <div className="business-name">{user?.businessName}</div>
              </div>

              <label>Business Phone Number</label>
              <div className="business-info">
                {user?.businessPhoneNumber || "N/A"}
              </div>

              <label>Business Address</label>
              <div className="business-info">
                {user?.businessAddress || "N/A"}
              </div>

              <label>Website</label>
              <div className="business-info">{user?.website || "N/A"}</div>
            </div>
            <button
              className="edit-button"
              onClick={() => setShowEditBusiness(true)}
            >
              <Edit size={16} />
              Edit Business Info
            </button>
          </section>

          <section
            className="business-information-page__section"
            aria-label="Owner's details"
          >
            <div className="section-content">
              <label>Owner's Name</label>
              <div className="business-info">{ownerName || "N/A"}</div>

              <label>Owner's Phone Number</label>
              <div className="business-info">
                {owner?.phoneNumber ? formatUSPhone(owner.phoneNumber) : "N/A"}
              </div>

              <label>Owner's Email</label>
              <div className="business-info">{user?.email || "N/A"}</div>

              <label>Signature</label>
              {hasSignature ? (
                <img
                  className="signature-preview"
                  src={user?.signature_url}
                  alt="Your signature"
                />
              ) : (
                <div className="business-info">Not added yet</div>
              )}
            </div>
            <div className="section-actions">
              <button
                className="edit-button"
                onClick={() => setShowEditOwner(true)}
                disabled={!owner}
              >
                <Edit size={16} />
                Edit Owner's Details
              </button>
              <button
                className="edit-button edit-button--outline"
                onClick={() => setShowSignature(true)}
              >
                <Edit3 size={16} />
                {hasSignature ? "Update Signature" : "Add Signature"}
              </button>
            </div>
          </section>

          <section
            className="business-information-page__section"
            aria-label="Services"
          >
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
            <button
              className="edit-button"
              onClick={() => setShowUpdateServices(true)}
            >
              <Edit size={16} />
              {registeredServices.length > 0
                ? "Edit Business Services"
                : "Add Business Services"}
            </button>
          </section>
        </div>
      </div>

      {showEditBusiness && (
        <EditBusinessInformationModal
          onClose={() => setShowEditBusiness(false)}
          onSave={() => setShowEditBusiness(false)}
        />
      )}
      {showEditOwner && owner && (
        <EditOwnerDetailsModal
          initial={owner}
          email={user?.email}
          onClose={() => setShowEditOwner(false)}
          onSaved={(details) => {
            setOwner(details);
            setShowEditOwner(false);
            // the dashboard greets the owner by first name
            refreshAuthUser(dispatch);
          }}
        />
      )}
      {showSignature && (
        <SignatureModal
          onClose={() => setShowSignature(false)}
          onSubmit={saveSignature}
          title={hasSignature ? "Update Your Signature" : "Add Your Signature"}
          existingSignature={user?.signature_url}
        />
      )}
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

export default BusinessInformationPage;

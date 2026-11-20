"use client";

import { Check, Copy, ExternalLink, Share2, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { LoadingSmall } from "../../loading/Loading";
import { createFormLink, FormLink } from "../../../services/artistServices";
import { getApiErrorMessage } from "../../../utils/formLinks";
import "./share-form-link-modal.scss";

interface ShareFormLinkModalProps {
  appointmentId: string;
  clientName: string;
  onClose: () => void;
  title?: string;
  description?: string;
}

const formatExpiry = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });

const ShareFormLinkModal: React.FC<ShareFormLinkModalProps> = ({
  appointmentId,
  clientName,
  onClose,
  title = "Consent form link",
  description,
}) => {
  const [link, setLink] = useState<FormLink | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const firstName = clientName?.split(" ")[0] || "your client";
  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  const generate = useCallback(() => {
    setLink(null);
    setError(null);
    createFormLink(appointmentId)
      .then(({ data }) => setLink(data))
      .catch((err) => {
        console.error("Error creating form link:", err);
        setError(
          getApiErrorMessage(
            err,
            "Could not create the link. Please try again.",
          ),
        );
      });
  }, [appointmentId]);

  useEffect(() => {
    generate();
  }, [generate]);

  const handleCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy. Select the link and copy it instead.");
    }
  };

  const handleShare = async () => {
    if (!link) return;
    try {
      await navigator.share({
        title: "Your appointment forms",
        text: `Hi ${firstName}, please fill out your forms before your appointment:`,
        url: link.url,
      });
    } catch {
      // the share sheet was dismissed
    }
  };

  const handleOpenHere = () => {
    if (!link) return;
    const tab = window.open(link.url, "_blank");
    if (tab) tab.opener = null;
  };

  return (
    <div className="share-form-link-modal">
      <div className="share-form-link-modal__overlay" onClick={onClose} />
      <div
        className="share-form-link-modal__content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-form-link-title"
      >
        <button
          type="button"
          className="share-form-link-modal__close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h2 id="share-form-link-title">{title}</h2>
        <p className="share-form-link-modal__description">
          {description ??
            `${firstName} can open this link to fill out and sign their forms. No account or login needed.`}
        </p>

        {error ? (
          <div className="share-form-link-modal__error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={generate}>
              Try again
            </button>
          </div>
        ) : !link ? (
          <LoadingSmall height="120px" />
        ) : (
          <>
            <div className="share-form-link-modal__link">
              <input
                type="text"
                value={link.url}
                readOnly
                onFocus={(e) => e.target.select()}
                aria-label="Form link"
              />
              <button
                type="button"
                onClick={handleCopy}
                aria-label={copied ? "Copied" : "Copy link"}
                title={copied ? "Copied!" : "Copy link"}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
            <p className="share-form-link-modal__expiry">
              Works for 24 hours, until {formatExpiry(link.expiresAt)}. You can
              create a new link any time.
            </p>

            <div className="share-form-link-modal__actions">
              <button
                type="button"
                className="share-form-link-modal__primary"
                onClick={handleOpenHere}
              >
                <ExternalLink size={18} />
                Start filling on this device
              </button>
              {canShare ? (
                <button
                  type="button"
                  className="share-form-link-modal__secondary"
                  onClick={handleShare}
                >
                  <Share2 size={18} />
                  Share link
                </button>
              ) : (
                <button
                  type="button"
                  className="share-form-link-modal__secondary"
                  onClick={handleCopy}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? "Copied!" : "Copy link"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShareFormLinkModal;

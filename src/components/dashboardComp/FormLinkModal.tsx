import React, { useState } from "react";
import { X, Copy, Check } from "lucide-react";
import "./FormLinkModal.scss";

interface FormLinkModalProps {
  onClose: () => void;
  businessUri: string;
}

const FormLinkModal: React.FC<FormLinkModalProps> = ({
  onClose,
  businessUri,
}) => {
  const [copied, setCopied] = useState(false);

  const formLink = `https://business.pmuforms.com/#/${businessUri}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(formLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);

      const textArea = document.createElement("textarea");
      textArea.value = formLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="form-link-modal-overlay">
      <div className="form-link-modal">
        <div className="form-link-modal__header">
          <h2>Your Business Form Link</h2>
          <button className="form-link-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="form-link-modal__content">
          <p className="form-link-modal__subtitle">
            Share this link with your Clients
          </p>

          <p className="form-link-modal__description">
            The Link to your business's form page that you can share with your
            clients is:
          </p>

          <div className="form-link-modal__link-container">
            <div className="form-link-modal__link-input">
              <input
                type="text"
                value={formLink}
                readOnly
                className="form-link-modal__link-field"
              />
              <button
                className="form-link-modal__copy-btn"
                onClick={handleCopyLink}
                title={copied ? "Copied!" : "Copy link"}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <p className="form-link-modal__instruction">
            Copy and paste this link into your appointment confirmation email.
          </p>
          <div className="form-link-modal__divider"></div>
          <div className="form-link-modal__actions">
            <button
              className="form-link-modal__copy-action"
              onClick={handleCopyLink}
            >
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormLinkModal;

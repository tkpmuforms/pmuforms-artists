"use client";

import React, { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import "./ConnectIntegrationModal.scss";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconBgColor: string;
  isConnected: boolean;
}

interface ConnectIntegrationModalProps {
  integration: Integration;
  onClose: () => void;
  onConnect: (
    integrationId: string,
    credentials: { apiKey?: string; token?: string }
  ) => void;
}

const ConnectIntegrationModal: React.FC<ConnectIntegrationModalProps> = ({
  integration,
  onClose,
  onConnect,
}) => {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [error, setError] = useState("");

  const getInputLabel = () => {
    switch (integration.id) {
      case "stripe":
        return "Stripe Secret Key";
      case "square":
        return "Square Access Token";
      case "calendly":
        return "Calendly Personal Access Token";
      default:
        return "API Key or Token";
    }
  };

  const getInputPlaceholder = () => {
    switch (integration.id) {
      case "stripe":
        return "sk_test_51...";
      case "square":
        return "EAAAE...";
      case "calendly":
        return "eyJhbGciOiJIUzI1NiJ9...";
      default:
        return "Enter your API key or token";
    }
  };

  const getHelpText = () => {
    switch (integration.id) {
      case "stripe":
        return "You can find your secret key in your Stripe Dashboard under Developers > API keys";
      case "square":
        return "Generate an access token in your Square Developer Dashboard";
      case "calendly":
        return "Create a personal access token in your Calendly integrations settings";

      default:
        return "Enter your API credentials to connect this integration";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey.trim()) {
      setError("Please enter your API key or token");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Call the onConnect callback with credentials
      onConnect(integration.id, {
        apiKey: apiKey.trim(),
        token: apiKey.trim(),
      });
    } catch (err) {
      setError(
        "Failed to connect. Please check your credentials and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="connect-modal-overlay">
      <div className="connect-modal">
        <div className="connect-modal__header">
          <div className="connect-modal__title-section">
            <div
              className="connect-modal__icon"
              style={{ backgroundColor: integration.iconBgColor }}
            >
              {integration.icon}
            </div>
            <div>
              <h2 className="connect-modal__title">
                Connect {integration.name}
              </h2>
              <p className="connect-modal__subtitle">
                Enter your API Key/Token to connect {integration.name} to PMU
                Forms.
              </p>
            </div>
          </div>
          <button className="connect-modal__close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="connect-modal__form">
          <div className="connect-modal__field">
            <label className="connect-modal__label">{getInputLabel()}</label>
            <div className="connect-modal__input-wrapper">
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={getInputPlaceholder()}
                className="connect-modal__input"
                disabled={isLoading}
              />
              <button
                type="button"
                className="connect-modal__toggle-visibility"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="connect-modal__help-text">{getHelpText()}</p>
            {error && <p className="connect-modal__error">{error}</p>}
          </div>

          <div className="connect-modal__actions">
            <button
              type="button"
              className="connect-modal__cancel"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="connect-modal__connect"
              disabled={isLoading || !apiKey.trim()}
            >
              {isLoading ? "Connecting..." : "Connect"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConnectIntegrationModal;

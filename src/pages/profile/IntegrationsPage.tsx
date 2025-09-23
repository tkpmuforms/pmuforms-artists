"use client";

import React, { useState } from "react";
import ConnectIntegrationModal from "../../components/profileComp/integrationsComp/ConnectIntegrationModal";
import "./integrations.scss";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconBgColor: string;
  isConnected: boolean;
  connectionLabel?: string;
}

const IntegrationsPage: React.FC = () => {
  const [selectedIntegration, setSelectedIntegration] =
    useState<Integration | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const integrations: Integration[] = [
    {
      id: "stripe",
      name: "Stripe",
      description: "Accept online payments",
      icon: "S",
      iconBgColor: "#635BFF",
      isConnected: true,
      connectionLabel: "Connected",
    },
    {
      id: "square",
      name: "Square",
      description: "POS & payments",
      icon: "⬛",
      iconBgColor: "#000000",
      isConnected: false,
    },
    {
      id: "calendly",
      name: "Calendly",
      description: "Manage client bookings",
      icon: "C",
      iconBgColor: "#006BFF",
      isConnected: false,
    },
  ];

  const handleIntegrationClick = (integration: Integration) => {
    if (!integration.isConnected) {
      setSelectedIntegration(integration);
      setShowConnectModal(true);
    }
  };

  const handleConnectionSuccess = (integrationId: string) => {
    console.log(`Successfully connected ${integrationId}`);
    setShowConnectModal(false);
    setSelectedIntegration(null);
  };

  return (
    <div className="integrations-page">
      <div className="integrations-page__content">
        <h1 className="integrations-page__title">Integrations</h1>

        <div className="integrations-page__grid">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="integrations-page__card"
              onClick={() => handleIntegrationClick(integration)}
            >
              <div className="integrations-page__card-content">
                <div
                  className="integrations-page__icon"
                  style={{ backgroundColor: integration.iconBgColor }}
                >
                  {integration.icon}
                </div>

                <div className="integrations-page__info">
                  <h3 className="integrations-page__name">
                    {integration.name}
                  </h3>
                  <p className="integrations-page__description">
                    {integration.description}
                  </p>
                </div>
              </div>

              <div className="integrations-page__status">
                {integration.isConnected ? (
                  <div className="integrations-page__connected">
                    <span className="integrations-page__connected-indicator"></span>
                    <span className="integrations-page__connected-text">
                      {integration.connectionLabel || "Connected"}
                    </span>
                  </div>
                ) : (
                  <button className="integrations-page__connect-btn">
                    Connect
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showConnectModal && selectedIntegration && (
        <ConnectIntegrationModal
          integration={selectedIntegration}
          onClose={() => {
            setShowConnectModal(false);
            setSelectedIntegration(null);
          }}
          onConnect={handleConnectionSuccess}
        />
      )}
    </div>
  );
};

export default IntegrationsPage;

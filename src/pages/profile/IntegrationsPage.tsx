"use client";

import { Settings } from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  disconnectSquare,
  getIntegrations,
  getSquareConnectUrl,
} from "../../services/artistServices";
import {
  CalendlyLogo,
  CalLogo,
  SquareLogo,
  SquarespaceLogo,
} from "../../assets/svgs/IntegrationsSvg";
import "./integrations.scss";

interface Integration {
  id: string;
  provider: string;
  name: string;
  mappingPath?: string;
  // shown but not connectable yet
  comingSoon?: boolean;
  logo: React.ReactNode;
}

const integrations: Integration[] = [
  {
    id: "square",
    provider: "square",
    name: "Square",
    mappingPath: "/integrations/square/mapping",
    logo: <SquareLogo />,
  },
  {
    id: "squarespace",
    provider: "squarespace",
    name: "Squarespace",
    comingSoon: true,
    logo: <SquarespaceLogo />,
  },
  {
    id: "calendly",
    provider: "calendly",
    name: "Calendly",
    comingSoon: true,
    logo: <CalendlyLogo />,
  },
  {
    id: "cal",
    provider: "cal.com",
    name: "Cal.com",
    comingSoon: true,
    logo: <CalLogo />,
  },
];

interface IntegrationStatus {
  provider: string;
  status: "connected" | "disconnected" | "error";
  externalAccountName?: string | null;
}

const IntegrationsPage: React.FC = () => {
  const [connectingSquare, setConnectingSquare] = useState(false);
  const [disconnectingSquare, setDisconnectingSquare] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, IntegrationStatus>>(
    {},
  );
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("provider") !== "square") {
      return;
    }

    const status = searchParams.get("status");
    if (status === "connected") {
      navigate("/integrations/square/mapping", { replace: true });
      return;
    }

    if (status === "error") {
      console.error(
        "Square connection failed:",
        searchParams.get("reason") || "unknown",
      );
      toast.error(
        "We couldn't connect your Square account. Please try again.",
        {
          id: "square-connect-error",
        },
      );
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, navigate]);

  const fetchIntegrations = () => {
    setLoadingStatuses(true);
    getIntegrations()
      .then((response) => {
        const list: IntegrationStatus[] = response?.data?.integrations ?? [];
        setStatuses(
          list.reduce<Record<string, IntegrationStatus>>((acc, item) => {
            acc[item.provider] = item;
            return acc;
          }, {}),
        );
      })
      .catch((error) => {
        console.error("Error fetching integrations:", error);
      })
      .finally(() => setLoadingStatuses(false));
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const isConnected = (integration: Integration) =>
    statuses[integration.provider]?.status === "connected";

  const handleDisconnect = (integration: Integration) => {
    if (integration.id !== "square") return;
    if (
      !window.confirm(
        `Disconnect ${integration.name}? New bookings will no longer sync.`,
      )
    ) {
      return;
    }

    setDisconnectingSquare(true);
    disconnectSquare()
      .then(() => {
        toast.success("Square disconnected");
        setStatuses((prev) => ({
          ...prev,
          [integration.provider]: {
            ...prev[integration.provider],
            provider: integration.provider,
            status: "disconnected",
          },
        }));
      })
      .catch((error) => {
        console.error("Error disconnecting Square:", error);
        toast.error("Could not disconnect Square. Please try again.");
      })
      .finally(() => setDisconnectingSquare(false));
  };

  const handleConnect = (integration: Integration) => {
    if (integration.id !== "square") {
      toast(`${integration.name} connection is coming soon.`);
      return;
    }

    setConnectingSquare(true);
    getSquareConnectUrl()
      .then((response) => {
        const url = response?.data?.url;
        if (!url) {
          throw new Error("Missing Square authorize URL");
        }
        window.location.href = url;
      })
      .catch((error) => {
        console.error("Error starting Square connection:", error);
        setConnectingSquare(false);
        toast.error("Could not start the Square connection. Please try again.");
      });
  };

  return (
    <div className="integrations-page">
      <div className="integrations-page__content">
        <div className="integrations-page__header">
          <h1>Connect your booking tools</h1>
          <p>
            Connect the booking tool you already use and map its services to
            your PMU Forms services. When a client books, we automatically
            create the client and appointment and send the consent form for that
            service, if one is needed.
          </p>
        </div>

        <h2 className="integrations-page__section-title">
          Available integrations
        </h2>

        <div className="integrations-page__grid">
          {integrations.map((integration) => {
            const canManage =
              isConnected(integration) && Boolean(integration.mappingPath);

            return (
              <div
                key={integration.id}
                className={`integrations-page__card ${
                  canManage ? "integrations-page__card--clickable" : ""
                } ${
                  integration.comingSoon
                    ? "integrations-page__card--coming-soon"
                    : ""
                }`}
                aria-disabled={integration.comingSoon || undefined}
                onClick={
                  canManage
                    ? () => navigate(integration.mappingPath as string)
                    : undefined
                }
              >
                <div className="integrations-page__card-content">
                  <div className="integrations-page__icon">
                    {integration.logo}
                  </div>

                  <div className="integrations-page__info">
                    <div className="integrations-page__name-row">
                      <h3 className="integrations-page__name">
                        {integration.name}
                      </h3>
                      {integration.comingSoon ? (
                        <span className="integrations-page__badge integrations-page__badge--muted">
                          Coming soon
                        </span>
                      ) : (
                        isConnected(integration) && (
                          <span className="integrations-page__badge">
                            <span className="integrations-page__badge-dot" />
                            Connected
                          </span>
                        )
                      )}
                    </div>
                    {isConnected(integration) &&
                      statuses[integration.provider]?.externalAccountName && (
                        <p
                          className="integrations-page__account"
                          title={
                            statuses[integration.provider]
                              ?.externalAccountName ?? ""
                          }
                        >
                          {statuses[integration.provider]?.externalAccountName}
                        </p>
                      )}
                  </div>
                </div>

                <div className="integrations-page__status">
                  {isConnected(integration) ? (
                    <>
                      {canManage && (
                        <button
                          type="button"
                          className="integrations-page__settings-btn"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(integration.mappingPath as string);
                          }}
                          aria-label={`Manage ${integration.name} service mappings`}
                          title="Manage service mappings"
                        >
                          <Settings size={18} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="integrations-page__connect-btn integrations-page__connect-btn--disconnect"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDisconnect(integration);
                        }}
                        aria-label={`Disconnect ${integration.name}`}
                        disabled={
                          integration.id === "square" && disconnectingSquare
                        }
                      >
                        {integration.id === "square" && disconnectingSquare
                          ? "Disconnecting..."
                          : "Disconnect"}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="integrations-page__connect-btn"
                      onClick={() => handleConnect(integration)}
                      aria-label={
                        integration.comingSoon
                          ? `${integration.name} is coming soon`
                          : `Connect ${integration.name}`
                      }
                      disabled={
                        integration.comingSoon ||
                        loadingStatuses ||
                        (integration.id === "square" && connectingSquare)
                      }
                    >
                      {integration.id === "square" && connectingSquare
                        ? "Connecting..."
                        : "Connect"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default IntegrationsPage;

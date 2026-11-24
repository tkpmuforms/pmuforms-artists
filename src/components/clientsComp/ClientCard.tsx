"use client";

import type React from "react";
import { ChevronRight } from "lucide-react";
import "./client-card.scss";
import { Client } from "../../redux/types";

interface ClientCardProps {
  client: Client;
  onClick: () => void;
}

const shortDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year:
      new Date(value).getFullYear() === new Date().getFullYear()
        ? undefined
        : "numeric",
  });

/** one line about the client's appointments, e.g. "Next: Dec 1" */
const visitLine = (summary?: Client["summary"]) => {
  if (!summary) return null;
  if (summary.nextAppointment) return `Next: ${shortDate(summary.nextAppointment)}`;
  if (summary.lastVisit) return `Last visit: ${shortDate(summary.lastVisit)}`;
  return "No appointments yet";
};

const ClientCard: React.FC<ClientCardProps> = ({ client, onClick }) => {
  const visit = visitLine(client.summary);
  return (
    <button className="client-card" onClick={onClick}>
      <div
        className="client-card__avatar"
        style={{
          backgroundColor: "#5555550D",
          color: client.color,
        }}
      >
        {client.initials}
      </div>
      <div className="client-card__info">
        <h3 className="client-card__name">
          {client.name?.trim() || "No name provided"}
        </h3>
        <p className="client-card__email">{client.email}</p>
        {(visit || client.summary?.formsPending) && (
          <div className="client-card__visit">
            {visit && (
              <span
                className={
                  client.summary?.nextAppointment
                    ? "client-card__visit-text client-card__visit-text--next"
                    : "client-card__visit-text"
                }
              >
                {visit}
              </span>
            )}
            {client.summary?.formsPending && (
              <span className="client-card__pill">Forms pending</span>
            )}
          </div>
        )}
      </div>
      <ChevronRight size={20} className="client-card__arrow" />
    </button>
  );
};

export default ClientCard;

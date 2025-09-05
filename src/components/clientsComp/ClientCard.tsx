"use client";

import type React from "react";
import { ChevronRight } from "lucide-react";
import "./client-card.scss";
import { Client } from "../../redux/types";

interface ClientCardProps {
  client: Client;
  onClick: () => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onClick }) => {
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
        <h3 className="client-card__name">{client.name}</h3>
        <p className="client-card__email">{client.email}</p>
      </div>
      <ChevronRight size={20} className="client-card__arrow" />
    </button>
  );
};

export default ClientCard;

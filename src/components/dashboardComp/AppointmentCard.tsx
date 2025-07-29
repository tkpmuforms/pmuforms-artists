"use client";

import type React from "react";
import "./appointment-card.scss";

interface AppointmentCardProps {
  name: string;
  avatar: string;
  time: string;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  name,
  avatar,
  time,
}) => {
  return (
    <div className="appointment-card">
      <div className="appointment-card__avatar">
        <img
          src={avatar || "/placeholder.svg"}
          alt={`${name}'s avatar`}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNBODU4RjAiLz4KPHRleHQgeD0iNTAlIiB5PSI1NSUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPiR7bmFtZVswXX08L3RleHQ+Cjwvc3ZnPg==`;
          }}
        />
      </div>
      <div className="appointment-card__info">
        <h4 className="appointment-card__name">{name}</h4>
        <p className="appointment-card__time">{time}</p>
      </div>
    </div>
  );
};

export default AppointmentCard;

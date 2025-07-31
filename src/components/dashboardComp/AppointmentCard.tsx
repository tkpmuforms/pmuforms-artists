"use client";
import type React from "react";
import "./appointment-card.scss";

interface AppointmentCardProps {
  name?: string;
  avatar?: string;
  time?: string;
  service?: string;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  name,
  avatar,
  time,
  service,
}) => {
  return (
    <div className="appointment-card">
      <div className="appointment-card__header">
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
        <h3 className="appointment-card__name">{name}</h3>
      </div>

      <div className="appointment-card__service">
        <span className="appointment-card__service-icon">✂️</span>
        <span className="appointment-card__service-text">{service}</span>
      </div>

      <div className="appointment-card__time">
        <span className="appointment-card__time-icon">🕒</span>
        <span className="appointment-card__time-text">{time}</span>
      </div>

      <button className="appointment-card__schedule-button">
        View Full Schedule
      </button>
    </div>
  );
};

export default AppointmentCard;

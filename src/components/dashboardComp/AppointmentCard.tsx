"use client";
import type React from "react";
import {
  DashboardServiceIcon,
  DashboardTimeIcon,
} from "../../assets/svgs/DashboardSvg";
import "./appointment-card.scss";

interface AppointmentCardProps {
  name?: string;
  avatar?: string;
  time?: string;
  /** every service on the appointment */
  services?: string[];
  /** opens this appointment's forms */
  onViewForms?: () => void;
  /** e.g. Forms pending, on the appointments page */
  status?: { label: string; tone: "pending" | "signed" | "completed" };
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  name,
  avatar,
  time,
  services = [],
  onViewForms,
  status,
}) => {
  const names = services.filter(Boolean);
  return (
    <div className="appointment-card-dashboard">
      <div className="appointment-card-dashboard__header">
        <div className="appointment-card-dashboard__avatar">
          <img src={avatar || "/placeholder.svg"} alt={`${name}'s avatar`} />
        </div>
        <h3 className="appointment-card-dashboard__name">{name}</h3>
      </div>

      {status && (
        <span
          className={`appointment-card-dashboard__status appointment-card-dashboard__status--${status.tone}`}
        >
          {status.label}
        </span>
      )}

      <div className="appointment-card-dashboard__service">
        <span className="appointment-card-dashboard__service-icon">
          <DashboardServiceIcon />
        </span>
        {names.length ? (
          <ul
            className="appointment-card-dashboard__services"
            aria-label="Services"
          >
            {names.map((name, i) => (
              <li key={`${name}-${i}`}>{name}</li>
            ))}
          </ul>
        ) : (
          <span className="appointment-card-dashboard__service-text">
            Service not specified
          </span>
        )}
      </div>

      <div className="appointment-card-dashboard__time">
        <span className="appointment-card-dashboard__time-icon">
          <DashboardTimeIcon />
        </span>
        <span className="appointment-card-dashboard__time-text">{time}</span>
      </div>

      <button
        className="appointment-card-dashboard__schedule-button"
        onClick={onViewForms}
        aria-label={`View appointment forms for ${name}`}
      >
        View appointment forms
      </button>
    </div>
  );
};

export default AppointmentCard;

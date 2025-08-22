"use client";
import type React from "react";
import "./appointment-card.scss";
import {
  DashboardServiceIcon,
  DashboardTimeIcon,
} from "../../assets/svgs/DashboardSvg";

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
          <img src={avatar || "/placeholder.svg"} alt={`${name}'s avatar`} />
        </div>
        <h3 className="appointment-card__name">{name}</h3>
      </div>

      <div className="appointment-card__service">
        <span className="appointment-card__service-icon">
          <DashboardServiceIcon />
        </span>
        <span className="appointment-card__service-text">{service}</span>
      </div>

      <div className="appointment-card__time">
        <span className="appointment-card__time-icon">
          <DashboardTimeIcon />
        </span>
        <span className="appointment-card__time-text">{time}</span>
      </div>

      <button className="appointment-card__schedule-button">
        View Full Schedule
      </button>
    </div>
  );
};

export default AppointmentCard;

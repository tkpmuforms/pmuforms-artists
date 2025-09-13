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
  service?: string;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  name,
  avatar,
  time,
  service,
}) => {
  return (
    <div className="appointment-card-dashboard">
      <div className="appointment-card-dashboard__header">
        <div className="appointment-card-dashboard__avatar">
          <img src={avatar || "/placeholder.svg"} alt={`${name}'s avatar`} />
          {/* <AppointmentCardIconSvg /> */}
        </div>
        <h3 className="appointment-card-dashboard__name">{name}</h3>
      </div>

      <div className="appointment-card-dashboard__service">
        <span className="appointment-card-dashboard__service-icon">
          <DashboardServiceIcon />
        </span>
        <span className="appointment-card-dashboard__service-text">
          {service}
        </span>
      </div>

      <div className="appointment-card-dashboard__time">
        <span className="appointment-card-dashboard__time-icon">
          <DashboardTimeIcon />
        </span>
        <span className="appointment-card-dashboard__time-text">{time}</span>
      </div>

      <button className="appointment-card-dashboard__schedule-button">
        View Full Schedule
      </button>
    </div>
  );
};

export default AppointmentCard;

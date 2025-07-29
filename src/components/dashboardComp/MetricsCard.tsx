"use client";

import type React from "react";
import "./metrics-card.scss";

interface MetricsCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
}

const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  icon,
  color,
}) => {
  return (
    <div className="metrics-card">
      <div className="metrics-card__header">
        <div className="metrics-card__icon" style={{ color }}>
          {icon}
        </div>
        <h3 className="metrics-card__title">{title}</h3>
      </div>
      <div className="metrics-card__value" style={{ color }}>
        {value}
      </div>
    </div>
  );
};

export default MetricsCard;

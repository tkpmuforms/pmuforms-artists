"use client";

import React from "react";
import "./metrics-card.scss";

export interface MetricsCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
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
          {React.createElement(icon, { size: 24 })}
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

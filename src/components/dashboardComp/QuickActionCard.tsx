"use client";

import type React from "react";
import "./quick-action-card.scss";

interface QuickActionCardProps {
  title: string;
  icon: string;
  color: string;
  onClick: () => void;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  icon,
  color,
  onClick,
}) => {
  return (
    <button className="quick-action-card" onClick={onClick}>
      <div
        className="quick-action-card__icon"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>
      <span className="quick-action-card__title">{title}</span>
    </button>
  );
};

export default QuickActionCard;

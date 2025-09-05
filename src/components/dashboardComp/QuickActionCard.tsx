"use client";
import React from "react";
import "./quick-action-card.scss";

interface QuickActionCardProps {
  title: string;
  icon: React.ElementType;
  onClick: () => void;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  icon,

  onClick,
}) => {
  return (
    <button className="quick-action-card" onClick={onClick}>
      <span className="quick-action-card__title">{title}</span>
      <div className="quick-action-card__icon">
        {" "}
        {React.createElement(icon, { size: 24 })}
      </div>
    </button>
  );
};

export default QuickActionCard;

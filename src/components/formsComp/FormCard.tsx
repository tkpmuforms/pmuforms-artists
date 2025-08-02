"use client";

import type React from "react";
import "./form-card.scss";
import { FormsIconSvg } from "../../assets/svgs/formsSvg";

interface FormCardProps {
  id: string;
  title: string;
  lastUpdated: string;
  usedFor: string;

  onPreview: () => void;
  onEdit: () => void;
}

const FormCard: React.FC<FormCardProps> = ({
  title,
  lastUpdated,
  usedFor,

  onPreview,
  onEdit,
}) => {
  return (
    <div className="form-card">
      <div className="form-card__header">
        <div className="form-card__icon">
          <FormsIconSvg />
        </div>
        <h3 className="form-card__title">{title}</h3>
      </div>
      <div className="form-card__meta">
        <p className="form-card__updated">{lastUpdated}</p>
        <p className="form-card__usage">{usedFor}</p>
      </div>
      <div className="form-card__actions">
        <button
          className="form-card__btn form-card__btn--preview"
          onClick={onPreview}
        >
          Preview
        </button>
        <button
          className="form-card__btn form-card__btn--edit"
          onClick={onEdit}
        >
          Edit
        </button>
      </div>
    </div>
  );
};

export default FormCard;

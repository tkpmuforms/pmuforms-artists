"use client";
import type React from "react";
import "./form-card.scss";
import { FormsIconSvg } from "../../assets/svgs/formsSvg";

interface FormCardProps {
  id: string;
  title: string;
  lastUpdated: string;
  usedFor: string;
  /** names of the artist's services this form is used for */
  serviceNames?: string[];
  /** e.g. "Made by you"; nothing for an unchanged library form */
  sourceLabel?: string;

  onPreview: () => void;
  onEdit: () => void;
}

const FormCard: React.FC<FormCardProps> = ({
  title,
  lastUpdated,
  usedFor,
  serviceNames,
  sourceLabel,

  onPreview,
  onEdit,
}) => {
  return (
    <div className="form-card">
      <div className="form-card__content">
        <div className="form-card__header">
          <div className="form-card__icon">
            <FormsIconSvg />
          </div>
          <h3 className="form-card__title">{title}</h3>
          {sourceLabel && (
            <span className="form-card__source">{sourceLabel}</span>
          )}
        </div>
        {serviceNames &&
          (serviceNames.length > 0 ? (
            <ul className="form-card__services" aria-label={`${title} services`}>
              {serviceNames.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          ) : (
            <p className="form-card__no-services">Not on any of your services</p>
          ))}
        <div className="form-card__meta">
          <p className="form-card__updated">{lastUpdated}</p>
          {!serviceNames && (
            <>
              <span className="form-card__separator">•</span>
              <p className="form-card__usage">{usedFor}</p>
            </>
          )}
        </div>
      </div>
      <div className="form-card__actions">
        <button
          className="form-card__btn form-card__btn--preview"
          onClick={onPreview}
          aria-label={`Preview ${title}`}
        >
          Preview
        </button>
        <button
          className="form-card__btn form-card__btn--edit"
          onClick={onEdit}
          aria-label={`Edit ${title}`}
        >
          Edit
        </button>
      </div>
    </div>
  );
};

export default FormCard;

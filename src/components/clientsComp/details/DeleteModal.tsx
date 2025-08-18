"use client";

import { X } from "lucide-react";
import type React from "react";
import { GarbageIconSvg } from "../../../assets/svgs/formsSvg";
import "./delete-modal.scss";

interface DeleteModalProps {
  onClose: () => void;
  headerText: string;
  shorterText: string;
  handleDelete?: () => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
  onClose,
  headerText,
  shorterText,
  handleDelete,
}) => {
  return (
    <div className="delete-client-confirm-modal">
      <div className="delete-client-confirm-modal__overlay" onClick={onClose} />
      <div className="delete-client-confirm-modal__content">
        <button
          className="delete-client-confirm-modal__close"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        <div className="delete-client-confirm-modal__icon">
          <GarbageIconSvg />
        </div>

        <h2>{headerText}</h2>
        <p>{shorterText}</p>
        <div className="delete-client-confirm-modal__actions">
          <button
            className="delete-client-confirm-modal__cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="delete-client-confirm-modal__confirm"
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;

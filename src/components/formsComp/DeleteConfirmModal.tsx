"use client";

import { X } from "lucide-react";
import type React from "react";
import { GarbageIconSvg } from "../../assets/svgs/formsSvg";
import "./delete-confirm-modal.scss";

interface DeleteConfirmModalProps {
  onClose: () => void;
  onConfirm: () => void;
  type?: "section" | "form";
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  onClose,
  onConfirm,
  type,
}) => {
  return (
    <div className="delete-confirm-modal">
      <div className="delete-confirm-modal__overlay" onClick={onClose} />
      <div className="delete-confirm-modal__content">
        <button className="delete-confirm-modal__close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="delete-confirm-modal__icon">
          <GarbageIconSvg />
        </div>

        <h2>Are you sure you want to delete?</h2>
        <p>
          If you do, you will need to contact us to fix any mistakes that have
          been made
        </p>

        <div className="delete-confirm-modal__actions">
          <button className="delete-confirm-modal__cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="delete-confirm-modal__confirm" onClick={onConfirm}>
            Delete this {type === "section" ? "Section" : "Form"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;

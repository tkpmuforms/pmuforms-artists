"use client";

import type React from "react";
import { X, Trash2 } from "lucide-react";
import "./delete-confirm-modal.scss";

interface DeleteConfirmModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  onClose,
  onConfirm,
}) => {
  return (
    <div className="delete-confirm-modal">
      <div className="delete-confirm-modal__overlay" onClick={onClose} />
      <div className="delete-confirm-modal__content">
        <button className="delete-confirm-modal__close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="delete-confirm-modal__icon">
          <Trash2 size={48} />
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
            Delete this Section
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;

"use client";

import type React from "react";
import { X } from "lucide-react";
import "./delete-client-modal.scss";

interface DeleteClientModalProps {
  onClose: () => void;
}

const DeleteClientModal: React.FC<DeleteClientModalProps> = ({ onClose }) => {
  const handleDelete = () => {
    console.log("Deleting client");
    onClose();
  };

  return (
    <div className="delete-client-modal">
      <div className="delete-client-modal__overlay" onClick={onClose} />
      <div className="delete-client-modal__content">
        <button className="delete-client-modal__close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="delete-client-modal__icon">
          <div className="delete-icon">🗑️</div>
        </div>

        <h2>Delete this Client?</h2>
        <p>
          Are you sure you want to permanently delete this client and all
          associated data?
        </p>

        <div className="delete-client-modal__actions">
          <button className="delete-client-modal__cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="delete-client-modal__confirm"
            onClick={handleDelete}
          >
            Delete Client
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteClientModal;

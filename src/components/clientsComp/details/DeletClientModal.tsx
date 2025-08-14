"use client";

import type React from "react";
import { X } from "lucide-react";
import "./delete-client-modal.scss";
import { deleteCustomer } from "../../../services/artistServices";
import { GarbageIconSvg } from "../../../assets/svgs/formsSvg";

interface DeleteClientModalProps {
  onClose: () => void;
  id: string;
}

const DeleteClientModal: React.FC<DeleteClientModalProps> = ({
  onClose,
  id,
}) => {
  const handleDelete = () => {
    deleteCustomer(id).then(() => {
      onClose();
    });
  };

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

        <h2>Delete this Client?</h2>
        <p>
          Are you sure you want to permanently delete this client and all
          associated data?
        </p>

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

export default DeleteClientModal;

import { X } from "lucide-react";
import type React from "react";
import { useEffect } from "react";

interface InventoryModalProps {
  title: string;
  subtitle?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}

/** The shell every inventory dialog uses. Escape or the backdrop closes it. */
const InventoryModal: React.FC<InventoryModalProps> = ({
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide,
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="inv-modal">
      <div className="inv-modal__overlay" onClick={onClose} />
      <div
        className={`inv-modal__content ${wide ? "inv-modal__content--wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <button className="inv-modal__close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
        <div className="inv-modal__header">
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="inv-modal__body">{children}</div>
        {footer && <div className="inv-modal__footer">{footer}</div>}
      </div>
    </div>
  );
};

export default InventoryModal;

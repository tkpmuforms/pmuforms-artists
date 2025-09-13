"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { X, Trash2, Check, Undo } from "lucide-react";
import "./SignatureModal.scss";

interface SignatureModalProps {
  onClose: () => void;
  onSubmit: (signatureDataUrl: string) => Promise<void>;
  title: string;
  isSubmitting?: boolean;
}

const SignatureModal: React.FC<SignatureModalProps> = ({
  onClose,
  onSubmit,
  title,
  isSubmitting = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 300;

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleConfirm = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    try {
      const signatureDataUrl = canvas.toDataURL("image/png");

      await onSubmit(signatureDataUrl);
    } catch (error) {
      console.error("Error submitting signature:", error);
    }
  };

  return (
    <div className="signature-modal">
      <div className="signature-modal__overlay" onClick={onClose} />
      <div className="signature-modal__content">
        <button className="signature-modal__close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="signature-modal__header">
          <h2>{title}</h2>
        </div>

        <div className="signature-modal__body">
          <div className="canvas-container">
            <canvas
              ref={canvasRef}
              className="signature-canvas"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </div>

          <div className="action-buttons">
            <button
              className="action-button delete-button"
              onClick={clearSignature}
              disabled={isSubmitting}
            >
              <Trash2 size={20} />
            </button>

            <button
              className="action-button confirm-button"
              onClick={handleConfirm}
              disabled={!hasSignature || isSubmitting}
            >
              <Check size={20} />
              {isSubmitting ? "Submitting..." : ""}
            </button>

            <button
              className="action-button undo-button"
              onClick={clearSignature}
              disabled={isSubmitting}
            >
              <Undo size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;

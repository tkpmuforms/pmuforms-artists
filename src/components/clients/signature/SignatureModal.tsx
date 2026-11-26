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
  existingSignature?: string;
}

const SignatureModal: React.FC<SignatureModalProps> = ({
  onClose,
  onSubmit,
  title,
  isSubmitting = false,
  existingSignature,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const strokeHistoryRef = useRef<string[]>([]);
  const hasInitialContentRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

  const applyCtxSettings = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 300;

    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    applyCtxSettings(ctx);

    if (existingSignature) {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(
          canvas.width / img.width,
          canvas.height / img.height
        );
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;

        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        applyCtxSettings(ctx);
        strokeHistoryRef.current = [canvas.toDataURL()];
        hasInitialContentRef.current = true;
        setHasSignature(true);
      };
      img.src = existingSignature;
    } else {
      strokeHistoryRef.current = [canvas.toDataURL()];
      hasInitialContentRef.current = false;
    }
  }, [existingSignature]);

  const getScaledPos = (
    canvas: HTMLCanvasElement,
    clientX: number,
    clientY: number
  ) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getScaledPos(canvas, e.clientX, e.clientY);

    isDrawingRef.current = true;
    applyCtxSettings(ctx);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getScaledPos(canvas, e.clientX, e.clientY);

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (isDrawingRef.current) {
      const canvas = canvasRef.current;
      if (canvas) {
        strokeHistoryRef.current = [
          ...strokeHistoryRef.current,
          canvas.toDataURL(),
        ];
        setCanUndo(true);
      }
    }
    isDrawingRef.current = false;
  };

  const handleUndo = () => {
    if (strokeHistoryRef.current.length <= 1) return;

    const newHistory = strokeHistoryRef.current.slice(0, -1);
    strokeHistoryRef.current = newHistory;
    setCanUndo(newHistory.length > 1);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prevDataUrl = newHistory[newHistory.length - 1];
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      applyCtxSettings(ctx);
      setHasSignature(newHistory.length > 1 || hasInitialContentRef.current);
    };
    img.src = prevDataUrl;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    applyCtxSettings(ctx);

    strokeHistoryRef.current = [canvas.toDataURL()];
    hasInitialContentRef.current = false;
    setHasSignature(false);
    setCanUndo(false);
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

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const touch = e.touches[0];
    const { x, y } = getScaledPos(canvas, touch.clientX, touch.clientY);

    isDrawingRef.current = true;
    applyCtxSettings(ctx);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const touch = e.touches[0];
    const { x, y } = getScaledPos(canvas, touch.clientX, touch.clientY);

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
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
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={stopDrawing}
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
              onClick={handleUndo}
              disabled={!canUndo || isSubmitting}
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

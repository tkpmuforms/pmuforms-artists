"use client";

import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import "./imageViewerModal.scss";

interface ImageViewerModalProps {
  imageUrl: string;
  onClose: () => void;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  imageUrl,
  onClose,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const MIN_SCALE = 0.5;
  const MAX_SCALE = 5;
  const ZOOM_STEP = 0.5;

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + ZOOM_STEP, MAX_SCALE));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - ZOOM_STEP, MIN_SCALE));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.2 : 0.2;
      setScale((prev) => Math.min(Math.max(prev + delta, MIN_SCALE), MAX_SCALE));
    },
    []
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-") handleZoomOut();
      if (e.key === "0") handleReset();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, [handleWheel]);

  return (
    <div className="image-viewer-modal" onClick={handleOverlayClick}>
      <div className="image-viewer-modal__toolbar">
        <div className="image-viewer-modal__zoom-controls">
          <button
            className="image-viewer-modal__btn"
            onClick={handleZoomOut}
            disabled={scale <= MIN_SCALE}
            title="Zoom out (-)"
          >
            <ZoomOut size={20} />
          </button>
          <span className="image-viewer-modal__zoom-level">
            {Math.round(scale * 100)}%
          </span>
          <button
            className="image-viewer-modal__btn"
            onClick={handleZoomIn}
            disabled={scale >= MAX_SCALE}
            title="Zoom in (+)"
          >
            <ZoomIn size={20} />
          </button>
          <button
            className="image-viewer-modal__btn"
            onClick={handleReset}
            title="Reset (0)"
          >
            <RotateCcw size={20} />
          </button>
        </div>
        <button
          className="image-viewer-modal__btn image-viewer-modal__btn--close"
          onClick={onClose}
          title="Close (Esc)"
        >
          <X size={22} />
        </button>
      </div>

      <div
        ref={containerRef}
        className="image-viewer-modal__container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
      >
        <img
          src={imageUrl}
          alt="Full size view"
          className="image-viewer-modal__image"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          }}
          draggable={false}
        />
      </div>
    </div>
  );
};

export default ImageViewerModal;

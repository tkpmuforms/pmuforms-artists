"use client";

import type React from "react";
import {
  X,
  Edit,
  FileText,
  LinkIcon,
  PenTool,
  StickyNote,
  BookTemplate,
  Mail,
  Users,
} from "lucide-react";
import "./features-modal.scss";

interface FeaturesModalProps {
  onClose: () => void;
  onSubscribe: () => void;
}

const FeaturesModal: React.FC<FeaturesModalProps> = ({
  onClose,
  onSubscribe,
}) => {
  const features = [
    {
      icon: <Edit />,
      title: "Edit Forms",
      description: "Edit form templates to better match your business",
    },
    {
      icon: <FileText />,
      title: "Print Forms",
      description: "Edit form templates to better match your business",
    },
    {
      icon: <LinkIcon />,
      title: "Personal Business Link",
      description:
        "A link to your forms page to send to clients so they can begin filling out forms immediately",
    },
    {
      icon: <PenTool />,
      title: "Sign Forms",
      description:
        "Signing forms in person at the appointment using the iOS App",
    },
    {
      icon: <StickyNote />,
      title: "Make Notes",
      description: "Make notes about client appointments for future references",
    },
    {
      icon: <BookTemplate />,
      title: "Templates Access",
      description: "Access to dozens of free PMU form templates",
    },
    {
      icon: <Mail />,
      title: "Service Request",
      description:
        "Request for new PMU forms and services to be added to the app",
    },
    {
      icon: <Users />,
      title: "Facebook Group",
      description: "Access to the PMU Forms Facebook Group",
    },
  ];

  return (
    <div className="features-modal">
      <div className="features-modal__overlay" onClick={onClose} />
      <div className="features-modal__content">
        <button className="features-modal__close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="features-modal__header">
          <div className="features-modal__crown">
            <div className="crown-icon">👑</div>
          </div>
          <h2>Your First 7 days is on us</h2>
          <p>
            Subscribe to unlock the ultimate experience and enjoy free 7 days on
            us
          </p>
        </div>

        <div className="features-modal__features">
          {features.map((feature, index) => (
            <div key={index} className="feature-item">
              <div className="feature-item__icon">{feature.icon}</div>
              <div className="feature-item__content">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <button className="features-modal__subscribe" onClick={onSubscribe}>
          Subscribe Now
        </button>
      </div>
    </div>
  );
};

export default FeaturesModal;

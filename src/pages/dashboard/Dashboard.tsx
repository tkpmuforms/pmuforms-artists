import React from "react";
import {
  Edit,
  FileText,
  Link as LinkIcon,
  PenTool,
  StickyNote,
  BookTemplate,
  Mail,
  CheckCircle,
  X,
} from "lucide-react";
import "./dashboard.scss";

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
}

const Dashboard: React.FC = () => {
  const pricingPlans: PricingPlan[] = [
    {
      name: "1 MONTH",
      price: "$14.99",
      period: "month",
      features: ["7-days free trial"],
    },
    {
      name: "6 MONTHS",
      price: "$69.99",
      period: "month",
      features: ["(only $10 / month)"],
      popular: true,
    },
    {
      name: "12 MONTHS",
      price: "$119.99",
      period: "year",
      features: ["(only $10 / month)", "Special Offer"],
    },
  ];

  const features = [
    {
      icon: <Edit />,
      label: "Edit Forms",
      desc: "Edit form templates to better match your business",
    },
    {
      icon: <FileText />,
      label: "Print Forms",
      desc: "Edit form templates to better match your business",
    },
    {
      icon: <LinkIcon />,
      label: "Personal Business Link",
      desc: "Add a link to your online page or share via them your",
    },
    {
      icon: <PenTool />,
      label: "Sign Forms",
      desc: "Signing forms in person or take appointment using the iOS",
    },
    {
      icon: <StickyNote />,
      label: "Make Notes",
      desc: "Add notes related when appointments are taken",
    },
    {
      icon: <BookTemplate />,
      label: "Templates Access",
      desc: "Access to all Library of free PMU forms templates",
    },
    {
      icon: <Mail />,
      label: "Service Request",
      desc: "Request for new PMU forms and services to be added to the app",
    },
    {
      icon: <CheckCircle />,
      label: "Facebook Group",
      desc: "Join our Facebook Group to exchange content",
    },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard__container">
        <div className="subscription-section">
          <div className="subscription-card">
            <h2>Reactivate your PMU Subscription</h2>
            <p>
              Subscribe to unlock and keep enjoying the ultimate experience on
              PMU Forms
            </p>

            <div className="pricing-grid">
              {pricingPlans.map((plan, index) => (
                <div
                  key={index}
                  className={`pricing-card ${plan.popular ? "popular" : ""}`}
                >
                  {plan.popular && (
                    <div className="popular-badge">Special Offer</div>
                  )}
                  <h3>{plan.name}</h3>
                  <div className="price">
                    <span className="amount">{plan.price}</span>
                    <span className="period">/{plan.period}</span>
                  </div>
                  {plan.features.map((feature, idx) => (
                    <p key={idx} className="feature-text">
                      {feature}
                    </p>
                  ))}
                </div>
              ))}
            </div>

            <button className="subscribe-btn">Subscribe Now</button>
            <button className="restore-btn">Restore Purchases</button>
          </div>

          <div className="mobile-features">
            <h2>Your First 7 days is on us</h2>
            <p>
              Subscribe to unlock the ultimate experience and enjoy free 7 days
              on us
            </p>

            {features.map((feature, index) => (
              <div key={index} className="feature-item">
                <div className="feature-icon">{feature.icon}</div>
                <div className="feature-content">
                  <h3>{feature.label}</h3>
                  <p>{feature.desc}</p>
                </div>
              </div>
            ))}

            <button className="view-all-btn">View All Plans</button>
          </div>
        </div>

        <div className="navigation-bar">
          <button className="nav-button" aria-label="Previous">
            <X />
          </button>
          <button className="nav-button" aria-label="Next">
            <CheckCircle />
          </button>
        </div>
      </div>

      <div className="file-info">
        <div className="file-alert">
          <span>You can only view and comment on this file.</span>
          <button className="edit-btn">Ask to edit</button>
          <button className="close-btn">×</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

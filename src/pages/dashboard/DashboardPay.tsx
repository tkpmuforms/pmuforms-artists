import React from "react";
import {
  Home,
  Users,
  ClipboardCheck,
  Calendar,
  Settings,
  ChevronRight,
  Copy,
  FileText,
  RefreshCw,
  Plus,
  Link as LinkIcon,
  CheckCircle,
  X,
} from "lucide-react";
import "./dashboardPay.scss";

interface DashboardAfterPaymentProps {
  userName?: string;
  clientCount?: number;
  appointmentCount?: number;
  businessLink?: string;
}

const DashboardAfterPayment: React.FC<DashboardAfterPaymentProps> = ({
  userName = "Michael Williams",
  clientCount = 0,
  appointmentCount = 0,
  businessLink = "https://pmu-beauty-forms.web.app/#/",
}) => {
  const actionItems = [
    {
      icon: <FileText />,
      label: "Preview Forms",
      description: "Update and preview your forms Clients fill these!",
      action: () => console.log("Preview forms"),
      showArrow: true,
    },
    {
      icon: <RefreshCw />,
      label: "Update Services",
      description:
        "Update the services you offer. Clients can buy the services to schedule services",
      action: () => console.log("Update services"),
      showArrow: true,
    },
    {
      icon: <Plus />,
      label: "Add New Client",
      description:
        "Manually add this, Share and send consent forms to them easily.",
      action: () => console.log("Add new client"),
      showArrow: true,
    },
  ];

  const navigationItems = [
    { icon: <Home />, label: "Home", active: true },
    { icon: <Calendar />, label: "Clients", active: false },
    { icon: <Settings />, label: "Settings", active: false },
  ];

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(businessLink);
    // You would typically show a toast notification here
  };

  return (
    <div className="dashboard-after-payment">
      {/* Dashboard variants */}
      <div className="dashboard-grid">
        {/* Empty state */}
        <div className="dashboard-card">
          <div className="header">
            <h2>Welcome,</h2>
            <p className="username">{userName}</p>
            <div className="header-actions">
              <button className="share-btn" aria-label="Share">
                <LinkIcon size={20} />
              </button>
              <div className="avatar">A</div>
            </div>
          </div>

          <div className="stats">
            <div className="stat-card">
              <div className="stat-value">{clientCount}</div>
              <div className="stat-label">Total Clients</div>
              <div className="illustration">👥</div>
            </div>

            <div className="stat-card">
              <div className="stat-value">{appointmentCount}</div>
              <div className="stat-label">Today's Appointments</div>
              <div className="illustration">📋</div>
            </div>
          </div>

          <div className="actions">
            {actionItems.map((item, index) => (
              <div key={index} className="action-item" onClick={item.action}>
                <div className="action-icon">{item.icon}</div>
                <div className="action-content">
                  <h3>{item.label}</h3>
                  <p>{item.description}</p>
                </div>
                {item.showArrow && <ChevronRight size={20} color="#888" />}
              </div>
            ))}
          </div>

          <nav className="bottom-nav">
            {navigationItems.map((item, index) => (
              <button
                key={index}
                className={`nav-item ${item.active ? "active" : ""}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* With data state */}
        <div className="dashboard-card">
          <div className="header">
            <h2>Welcome,</h2>
            <p className="username">{userName}</p>
            <div className="header-actions">
              <button className="share-btn" aria-label="Share">
                <LinkIcon size={20} />
              </button>
              <div className="avatar">A</div>
            </div>
          </div>

          <div className="stats">
            <div className="stat-card">
              <div className="stat-value">32</div>
              <div className="stat-label">Total Clients</div>
              <div className="illustration">👥</div>
            </div>

            <div className="stat-card">
              <div className="stat-value">124</div>
              <div className="stat-label">Today's Appointments</div>
              <div className="illustration">📋</div>
            </div>
          </div>

          <div className="actions">
            {actionItems.map((item, index) => (
              <div key={index} className="action-item" onClick={item.action}>
                <div className="action-icon">{item.icon}</div>
                <div className="action-content">
                  <h3>{item.label}</h3>
                  <p>{item.description}</p>
                </div>
                {item.showArrow && <ChevronRight size={20} color="#888" />}
              </div>
            ))}
          </div>

          <nav className="bottom-nav">
            {navigationItems.map((item, index) => (
              <button
                key={index}
                className={`nav-item ${item.active ? "active" : ""}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Business Link view */}
        <div className="dashboard-card business-link-card">
          <div className="header">
            <h2>Welcome,</h2>
            <p className="username">{userName}</p>
            <div className="header-actions">
              <button className="share-btn" aria-label="Share">
                <LinkIcon size={20} />
              </button>
              <div className="avatar">A</div>
            </div>
          </div>

          <div className="stats">
            <div className="stat-card">
              <div className="stat-value">32</div>
              <div className="stat-label">Total Clients</div>
              <div className="illustration">👥</div>
            </div>

            <div className="stat-card">
              <div className="stat-value">124</div>
              <div className="stat-label">Today's Appointments</div>
              <div className="illustration">📋</div>
            </div>
          </div>

          <div className="business-link-section">
            <h3>Your Business's Form Link</h3>
            <p>Share this link with your Client!</p>

            <p className="link-description">
              The Link to your business's form page that you can share with your
              clients is:
            </p>

            <div className="link-input">
              <input type="text" value={businessLink} readOnly />
              <button
                className="copy-icon"
                onClick={() => navigator.clipboard.writeText(businessLink)}
              >
                <Copy size={20} />
              </button>
            </div>

            <p className="copy-instruction">
              Copy and paste this link into your appointment confirmation email.
            </p>

            <button className="copy-btn" onClick={handleCopyToClipboard}>
              Copy to Clipboard
            </button>
          </div>

          <nav className="bottom-nav">
            {navigationItems.map((item, index) => (
              <button
                key={index}
                className={`nav-item ${item.active ? "active" : ""}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Business Link Copied state */}
        <div className="dashboard-card business-link-card">
          <div className="header">
            <h2>Welcome,</h2>
            <p className="username">{userName}</p>
            <div className="header-actions">
              <button className="share-btn" aria-label="Share">
                <LinkIcon size={20} />
              </button>
              <div className="avatar">A</div>
            </div>
          </div>

          <div className="stats">
            <div className="stat-card">
              <div className="stat-value">32</div>
              <div className="stat-label">Total Clients</div>
              <div className="illustration">👥</div>
            </div>

            <div className="stat-card">
              <div className="stat-value">124</div>
              <div className="stat-label">Today's Appointments</div>
              <div className="illustration">📋</div>
            </div>
          </div>

          <div className="business-link-section">
            <h3>Your Business's Form Link</h3>
            <p>Share this link with your Client!</p>

            <p className="link-description">
              The Link to your business's form page that you can share with your
              clients is:
            </p>

            <div className="link-input">
              <input type="text" value={businessLink} readOnly />
              <button
                className="copy-icon"
                onClick={() => navigator.clipboard.writeText(businessLink)}
              >
                <Copy size={20} />
              </button>
            </div>

            <p className="copy-instruction">
              Copy and paste this link into your appointment confirmation email.
            </p>

            <button className="copy-btn copied" disabled>
              Copied
            </button>
          </div>

          <nav className="bottom-nav">
            {navigationItems.map((item, index) => (
              <button
                key={index}
                className={`nav-item ${item.active ? "active" : ""}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
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

export default DashboardAfterPayment;

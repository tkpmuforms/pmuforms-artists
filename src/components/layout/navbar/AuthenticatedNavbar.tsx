import React, { useState } from "react";
import "./AuthenticatedNavbar.scss";
import useAuth from "../../../context/useAuth";
import { Avatar } from "@mui/material";
import { useNavigate } from "react-router-dom";

interface AuthenticatedNavbarProps {
  breadcrumbs?: string[];
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  onAvatarClick?: () => void;
  onMobileMenuToggle?: () => void;
}

const AuthenticatedNavbar: React.FC<AuthenticatedNavbarProps> = ({
  breadcrumbs = [],
  onSearch,
  onNotificationClick,
  onAvatarClick,
  onMobileMenuToggle,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const handleBackClick = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };

  const lastBreadcrumb =
    breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1] : null;
  const showBackButton = breadcrumbs.length > 1;

  return (
    <nav className="authenticated-navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <button
            className="mobile-menu-toggle"
            onClick={onMobileMenuToggle}
            aria-label="Toggle Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div className="navbar-breadcrumbs">
            {showBackButton && (
              <button
                className="back-button"
                onClick={handleBackClick}
                aria-label="Go back"
              >
                <svg
                  className="back-arrow"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M12.5 15l-5-5 5-5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
            {lastBreadcrumb && (
              <div className="breadcrumb-item">
                <span className="breadcrumb-text">{lastBreadcrumb}</span>
              </div>
            )}
          </div>
        </div>

        <div className="navbar-search">
          <form onSubmit={handleSearchSubmit} className="search-form">
            <div className="search-input-container">
              <svg
                className="search-icon"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M17.5 17.5l-5.5-5.5m0 0a7 7 0 1 0-9.899-9.899A7 7 0 0 0 12 12z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <input
                type="text"
                placeholder="Search name, email, phone number..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>
          </form>
        </div>

        <div className="navbar-actions">
          <button
            className="notification-button"
            onClick={onNotificationClick}
            aria-label="Notifications"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13.73 21a2 2 0 0 1-3.46 0"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            className="avatar-button"
            onClick={onAvatarClick}
            aria-label="User menu"
          >
            <div className="avatar-container">
              <Avatar
                src={user?.info?.avatar_url ?? ""}
                alt={user?.businessName ?? ""}
                sx={{ width: 40, height: 40 }}
              />
            </div>
            <span className="user-name">{user?.businessName}</span>
            <svg
              className="dropdown-icon"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M4 6l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AuthenticatedNavbar;
